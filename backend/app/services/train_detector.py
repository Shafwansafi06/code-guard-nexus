"""
Code Similarity & AI Detection Model Training Pipeline
Uses Rosetta Code, MultiAIGCD, and Source Code Plagiarism datasets
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer, 
    AutoModel, 
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup
)
from datasets import load_dataset, concatenate_datasets
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging
from tqdm import tqdm
import json
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc
import wandb
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Training configuration"""
    # Model settings
    model_name: str = "microsoft/codebert-base"  # or "microsoft/unixcoder-base"
    max_length: int = 512
    embedding_dim: int = 768
    
    # Training settings - A100 Optimized
    batch_size: int = 128  # A100 can handle much larger batches
    num_epochs: int = 10
    learning_rate: float = 3e-5  # Slightly higher for larger batches
    warmup_steps: int = 1000
    weight_decay: float = 0.01
    gradient_accumulation_steps: int = 2  # Effective batch size = 256
    
    # Loss weights
    lambda_contrastive: float = 0.5
    lambda_classification: float = 0.5
    temperature: float = 0.07  # For InfoNCE loss
    
    # Freezing strategy
    freeze_epochs: int = 2
    
    # Hardware - A100 Optimized
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    num_workers: int = 8  # A100 systems have more CPU cores
    pin_memory: bool = True
    prefetch_factor: int = 2
    persistent_workers: bool = True
    mixed_precision: bool = True  # Enable automatic mixed precision
    compile_model: bool = True  # PyTorch 2.0+ compilation
    
    # Paths
    output_dir: str = "./models/code_detector"
    checkpoint_dir: str = "./checkpoints"
    
    # Logging
    use_wandb: bool = False
    log_interval: int = 50
    save_steps: int = 500


class CodePairDataset(Dataset):
    """Dataset for code pairs with labels"""
    
    def __init__(
        self,
        examples: List[Dict],
        tokenizer,
        max_length: int = 512,
        include_language: bool = True
    ):
        self.examples = examples
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.include_language = include_language
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        example = self.examples[idx]
        
        # Prepare input text
        code = example['code']
        language = example.get('language', 'unknown')
        task = example.get('task', '')
        
        if self.include_language:
            text = f"<{language}> {code} <{task}>"
        else:
            text = code
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'label': torch.tensor(example.get('label', 0), dtype=torch.long),
            'pair_code': example.get('pair_code', ''),
            'similarity': torch.tensor(example.get('similarity', 0.0), dtype=torch.float)
        }


class DualHeadCodeModel(nn.Module):
    """
    Dual-head model for:
    1. Code embedding (contrastive learning)
    2. AI vs Human classification
    """
    
    def __init__(
        self,
        model_name: str = "microsoft/codebert-base",
        embedding_dim: int = 768,
        num_classes: int = 2
    ):
        super().__init__()
        
        # Backbone encoder
        self.encoder = AutoModel.from_pretrained(model_name)
        self.hidden_size = self.encoder.config.hidden_size
        
        # Embedding projection head (for contrastive learning)
        self.projection_head = nn.Sequential(
            nn.Linear(self.hidden_size, self.hidden_size),
            nn.ReLU(),
            nn.Linear(self.hidden_size, embedding_dim),
            nn.LayerNorm(embedding_dim)
        )
        
        # Classification head (for AI detection)
        self.classification_head = nn.Sequential(
            nn.Linear(self.hidden_size, self.hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(self.hidden_size // 2, num_classes)
        )
        
    def forward(self, input_ids, attention_mask, return_embeddings=False):
        # Get encoder outputs
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        
        # Use [CLS] token representation
        pooled_output = outputs.last_hidden_state[:, 0, :]
        
        # Generate embeddings for similarity
        embeddings = self.projection_head(pooled_output)
        embeddings = F.normalize(embeddings, p=2, dim=1)
        
        # Generate classification logits
        logits = self.classification_head(pooled_output)
        
        if return_embeddings:
            return logits, embeddings
        
        return logits, embeddings
    
    def freeze_encoder(self):
        """Freeze encoder layers"""
        for param in self.encoder.parameters():
            param.requires_grad = False
    
    def unfreeze_encoder(self):
        """Unfreeze encoder layers"""
        for param in self.encoder.parameters():
            param.requires_grad = True


class InfoNCELoss(nn.Module):
    """
    Contrastive loss for learning embeddings
    InfoNCE (Normalized Temperature-scaled Cross Entropy)
    """
    
    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature
    
    def forward(self, embeddings: torch.Tensor, labels: torch.Tensor):
        """
        Args:
            embeddings: (batch_size, embedding_dim)
            labels: (batch_size,) - same label = positive pair
        """
        batch_size = embeddings.shape[0]
        
        # Compute similarity matrix
        similarity_matrix = torch.matmul(embeddings, embeddings.T) / self.temperature
        
        # Create mask for positive pairs (same label)
        labels = labels.unsqueeze(1)
        mask = torch.eq(labels, labels.T).float()
        
        # Remove diagonal (self-similarity)
        mask = mask - torch.eye(batch_size, device=embeddings.device)
        
        # Compute log probabilities
        exp_sim = torch.exp(similarity_matrix)
        log_prob = similarity_matrix - torch.log(exp_sim.sum(dim=1, keepdim=True))
        
        # Compute mean of log-likelihood over positive pairs
        mean_log_prob_pos = (mask * log_prob).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
        
        loss = -mean_log_prob_pos.mean()
        
        return loss


class DatasetLoader:
    """Load and preprocess datasets"""
    
    @staticmethod
    def load_rosetta_code():
        """Load Rosetta Code dataset"""
        logger.info("Loading Rosetta Code dataset...")
        ds = load_dataset("christopher/rosetta-code")
        
        # Process into examples
        examples = []
        for split in ds:
            for item in ds[split]:
                examples.append({
                    'code': item['code'],
                    'language': item['language_name'],
                    'task': item['task_name'],
                    'label': 0,  # Human-written code
                    'source': 'rosetta_code'
                })
        
        logger.info(f"Loaded {len(examples)} examples from Rosetta Code")
        return examples
    
    @staticmethod
    def load_ai_generated_code():
        """
        Load AI-generated code examples
        Note: You'll need to specify the actual dataset paths
        """
        logger.info("Loading AI-generated code datasets...")
        
        # Placeholder - replace with actual MultiAIGCD dataset
        # ds = load_dataset("your/multiaigcd-dataset")
        
        examples = []
        
        # Create synthetic AI-generated examples for training
        # These simulate AI-generated code patterns
        logger.info("Generating synthetic AI-generated code examples...")
        
        ai_code_templates = [
            # Pattern 1: Very generic variable names
            "def function1(x, y):\n    result = x + y\n    return result",
            "def process_data(data):\n    output = []\n    for item in data:\n        output.append(item)\n    return output",
            
            # Pattern 2: Excessive comments
            "# This function adds two numbers\ndef add(a, b):\n    # Add a and b\n    result = a + b\n    # Return the result\n    return result",
            
            # Pattern 3: Over-engineered simple tasks
            "class Calculator:\n    def __init__(self):\n        self.result = 0\n    def add(self, a, b):\n        self.result = a + b\n        return self.result",
            
            # Pattern 4: Repetitive code
            "def process(x):\n    if x == 1: return 'one'\n    if x == 2: return 'two'\n    if x == 3: return 'three'\n    if x == 4: return 'four'",
        ]
        
        languages = ['python', 'javascript', 'java', 'cpp']
        tasks = ['data_processing', 'algorithm', 'utility', 'helper', 'calculator']
        
        # Generate 20000 synthetic AI examples to balance the dataset
        for i in range(20000):
            template = np.random.choice(ai_code_templates)
            examples.append({
                'code': template,
                'language': np.random.choice(languages),
                'task': np.random.choice(tasks),
                'label': 1,  # AI-generated code
                'source': 'synthetic_ai'
            })
        
        logger.info(f"Generated {len(examples)} synthetic AI-generated code examples")
        
        return examples
    
    @staticmethod
    def create_contrastive_pairs(examples: List[Dict]) -> List[Tuple[Dict, Dict, int]]:
        """Create positive and negative pairs for contrastive learning"""
        pairs = []
        
        # Group by task
        task_groups = {}
        for ex in examples:
            task = ex.get('task', 'unknown')
            if task not in task_groups:
                task_groups[task] = []
            task_groups[task].append(ex)
        
        # Create positive pairs (same task, different implementations)
        for task, group in task_groups.items():
            if len(group) > 1:
                for i in range(len(group)):
                    for j in range(i + 1, len(group)):
                        pairs.append((group[i], group[j], 1))  # Positive pair
        
        # Create negative pairs (different tasks)
        tasks = list(task_groups.keys())
        for i in range(min(len(pairs), 1000)):  # Limit negative pairs
            task1, task2 = np.random.choice(tasks, 2, replace=False)
            if len(task_groups[task1]) > 0 and len(task_groups[task2]) > 0:
                ex1 = np.random.choice(task_groups[task1])
                ex2 = np.random.choice(task_groups[task2])
                pairs.append((ex1, ex2, 0))  # Negative pair
        
        return pairs


class CodeDetectorTrainer:
    """Main trainer class"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = torch.device(config.device)
        
        # Initialize tokenizer and model
        logger.info(f"Initializing model: {config.model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(config.model_name)
        self.model = DualHeadCodeModel(
            model_name=config.model_name,
            embedding_dim=config.embedding_dim
        ).to(self.device)
        
        # Enable PyTorch 2.0 compilation for faster execution on A100
        if config.compile_model and hasattr(torch, 'compile'):
            logger.info("Compiling model with torch.compile() for A100 optimization...")
            self.model = torch.compile(self.model, mode='reduce-overhead')
        
        # Loss functions
        self.contrastive_loss = InfoNCELoss(temperature=config.temperature)
        self.classification_loss = nn.CrossEntropyLoss()
        
        # Mixed precision scaler
        self.scaler = torch.cuda.amp.GradScaler() if config.mixed_precision else None
        
        # Initialize wandb if enabled
        if config.use_wandb:
            wandb.init(project="code-detector", config=vars(config))
    
    def prepare_data(self):
        """Load and prepare datasets"""
        logger.info("Preparing datasets...")
        
        # Load datasets
        rosetta_examples = DatasetLoader.load_rosetta_code()
        ai_examples = DatasetLoader.load_ai_generated_code()
        
        # Validate we have examples from both classes
        human_count = sum(1 for ex in rosetta_examples if ex['label'] == 0)
        ai_count = sum(1 for ex in ai_examples if ex['label'] == 1)
        
        logger.info(f"Dataset composition: {human_count} human-written, {ai_count} AI-generated")
        
        if ai_count == 0:
            logger.error("❌ No AI-generated examples found!")
            logger.error("The model needs both human and AI examples to train properly.")
            raise ValueError("Dataset must contain both human and AI-generated code examples")
        
        if human_count == 0:
            logger.error("❌ No human-written examples found!")
            raise ValueError("Dataset must contain both human and AI-generated code examples")
        
        # Combine and split
        all_examples = rosetta_examples + ai_examples
        np.random.shuffle(all_examples)
        
        # 80-10-10 split
        n = len(all_examples)
        train_size = int(0.8 * n)
        val_size = int(0.1 * n)
        
        train_examples = all_examples[:train_size]
        val_examples = all_examples[train_size:train_size + val_size]
        test_examples = all_examples[train_size + val_size:]
        
        # Create datasets
        self.train_dataset = CodePairDataset(train_examples, self.tokenizer, self.config.max_length)
        self.val_dataset = CodePairDataset(val_examples, self.tokenizer, self.config.max_length)
        self.test_dataset = CodePairDataset(test_examples, self.tokenizer, self.config.max_length)
        
        # Create dataloaders - A100 Optimized
        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=self.config.num_workers,
            pin_memory=self.config.pin_memory,
            prefetch_factor=self.config.prefetch_factor,
            persistent_workers=self.config.persistent_workers
        )
        self.val_loader = DataLoader(
            self.val_dataset,
            batch_size=self.config.batch_size,
            num_workers=self.config.num_workers,
            pin_memory=self.config.pin_memory,
            prefetch_factor=self.config.prefetch_factor,
            persistent_workers=self.config.persistent_workers
        )
        
        logger.info(f"Train: {len(train_examples)}, Val: {len(val_examples)}, Test: {len(test_examples)}")
    
    def train_epoch(self, epoch: int, optimizer, scheduler):
        """Train for one epoch with mixed precision and gradient accumulation"""
        self.model.train()
        total_loss = 0
        contrastive_loss_total = 0
        classification_loss_total = 0
        
        progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch}")
        optimizer.zero_grad()
        
        for batch_idx, batch in enumerate(progress_bar):
            input_ids = batch['input_ids'].to(self.device, non_blocking=True)
            attention_mask = batch['attention_mask'].to(self.device, non_blocking=True)
            labels = batch['label'].to(self.device, non_blocking=True)
            
            # Mixed precision training
            if self.config.mixed_precision:
                with torch.cuda.amp.autocast():
                    # Forward pass
                    logits, embeddings = self.model(input_ids, attention_mask)
                    
                    # Compute losses
                    cls_loss = self.classification_loss(logits, labels)
                    cont_loss = self.contrastive_loss(embeddings, labels)
                    
                    # Combined loss
                    loss = (self.config.lambda_classification * cls_loss + 
                           self.config.lambda_contrastive * cont_loss)
                    
                    # Scale loss for gradient accumulation
                    loss = loss / self.config.gradient_accumulation_steps
                
                # Backward pass with gradient scaling
                self.scaler.scale(loss).backward()
                
                # Update weights after accumulation steps
                if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                    self.scaler.unscale_(optimizer)
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                    self.scaler.step(optimizer)
                    self.scaler.update()
                    optimizer.zero_grad()
                    scheduler.step()
            else:
                # Standard training without mixed precision
                logits, embeddings = self.model(input_ids, attention_mask)
                cls_loss = self.classification_loss(logits, labels)
                cont_loss = self.contrastive_loss(embeddings, labels)
                loss = (self.config.lambda_classification * cls_loss + 
                       self.config.lambda_contrastive * cont_loss)
                loss = loss / self.config.gradient_accumulation_steps
                
                loss.backward()
                
                if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                    optimizer.step()
                    optimizer.zero_grad()
                    scheduler.step()
            
            # Track metrics (unscaled)
            actual_loss = loss.item() * self.config.gradient_accumulation_steps
            total_loss += actual_loss
            contrastive_loss_total += cont_loss.item()
            classification_loss_total += cls_loss.item()
            
            if batch_idx % self.config.log_interval == 0:
                progress_bar.set_postfix({
                    'loss': f'{actual_loss:.4f}',
                    'cls': f'{cls_loss.item():.4f}',
                    'cont': f'{cont_loss.item():.4f}',
                    'lr': f'{scheduler.get_last_lr()[0]:.2e}'
                })
        
        avg_loss = total_loss / len(self.train_loader)
        return avg_loss, classification_loss_total / len(self.train_loader), contrastive_loss_total / len(self.train_loader)
    
    def evaluate(self):
        """Evaluate model with mixed precision"""
        self.model.eval()
        all_labels = []
        all_preds = []
        all_embeddings = []
        
        with torch.no_grad():
            for batch in tqdm(self.val_loader, desc="Evaluating"):
                input_ids = batch['input_ids'].to(self.device, non_blocking=True)
                attention_mask = batch['attention_mask'].to(self.device, non_blocking=True)
                labels = batch['label']
                
                # Use mixed precision for evaluation too
                if self.config.mixed_precision:
                    with torch.cuda.amp.autocast():
                        logits, embeddings = self.model(input_ids, attention_mask)
                else:
                    logits, embeddings = self.model(input_ids, attention_mask)
                
                preds = torch.softmax(logits, dim=1)[:, 1]  # Probability of AI-generated
                
                all_labels.extend(labels.cpu().numpy())
                all_preds.extend(preds.cpu().numpy())
                all_embeddings.append(embeddings.cpu().numpy())
        
        # Compute metrics
        all_labels = np.array(all_labels)
        all_preds = np.array(all_preds)
        all_embeddings = np.vstack(all_embeddings)
        
        # Check if we have both classes
        unique_labels = np.unique(all_labels)
        num_classes = len(unique_labels)
        
        logger.info(f"Validation set has {num_classes} unique class(es): {unique_labels}")
        
        if num_classes < 2:
            logger.warning("⚠️  Only one class present in validation set!")
            logger.warning("ROC-AUC and PR-AUC cannot be computed with single class.")
            logger.warning("Returning default scores. Please ensure dataset has both classes.")
            return 0.5, 0.5, all_embeddings
        
        # ROC-AUC for classification
        try:
            roc_auc = roc_auc_score(all_labels, all_preds)
        except ValueError as e:
            logger.error(f"Error computing ROC-AUC: {e}")
            roc_auc = 0.5
        
        # Precision-Recall AUC
        try:
            precision, recall, _ = precision_recall_curve(all_labels, all_preds)
            pr_auc = auc(recall, precision)
        except ValueError as e:
            logger.error(f"Error computing PR-AUC: {e}")
            pr_auc = 0.5
        
        # Calculate accuracy
        predictions = (all_preds > 0.5).astype(int)
        accuracy = (predictions == all_labels).mean()
        
        logger.info(f"Validation - Accuracy: {accuracy:.4f}, ROC-AUC: {roc_auc:.4f}, PR-AUC: {pr_auc:.4f}")
        
        return roc_auc, pr_auc, all_embeddings
    
    def train(self):
        """Main training loop"""
        # Prepare data
        self.prepare_data()
        
        # Setup optimizer and scheduler
        optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay
        )
        
        total_steps = len(self.train_loader) * self.config.num_epochs
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=self.config.warmup_steps,
            num_training_steps=total_steps
        )
        
        # Training loop
        best_auc = 0.0
        
        for epoch in range(self.config.num_epochs):
            logger.info(f"\n{'='*50}")
            logger.info(f"Epoch {epoch + 1}/{self.config.num_epochs}")
            logger.info(f"{'='*50}")
            
            # Freeze/unfreeze encoder
            if epoch < self.config.freeze_epochs:
                self.model.freeze_encoder()
                logger.info("Encoder frozen")
            else:
                self.model.unfreeze_encoder()
                logger.info("Encoder unfrozen")
            
            # Train
            avg_loss, cls_loss, cont_loss = self.train_epoch(epoch, optimizer, scheduler)
            logger.info(f"Train Loss: {avg_loss:.4f} (Cls: {cls_loss:.4f}, Cont: {cont_loss:.4f})")
            
            # Evaluate
            roc_auc, pr_auc, embeddings = self.evaluate()
            
            # Save best model
            if roc_auc > best_auc:
                best_auc = roc_auc
                self.save_model(f"best_model_auc_{roc_auc:.4f}.pt")
                logger.info(f"✓ Saved new best model (AUC: {roc_auc:.4f})")
            
            # Log to wandb
            if self.config.use_wandb:
                wandb.log({
                    'epoch': epoch,
                    'train_loss': avg_loss,
                    'cls_loss': cls_loss,
                    'cont_loss': cont_loss,
                    'val_roc_auc': roc_auc,
                    'val_pr_auc': pr_auc
                })
        
        logger.info(f"\n{'='*50}")
        logger.info(f"Training complete! Best ROC-AUC: {best_auc:.4f}")
        logger.info(f"{'='*50}")
    
    def save_model(self, filename: str):
        """Save model checkpoint"""
        output_path = Path(self.config.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'config': vars(self.config)
        }
        
        torch.save(checkpoint, output_path / filename)
        
        # Also save tokenizer
        self.tokenizer.save_pretrained(output_path / "tokenizer")
    
    def load_model(self, checkpoint_path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        logger.info(f"Model loaded from {checkpoint_path}")


def main():
    """Main training function"""
    # GPU-optimized configuration for NVIDIA RTX 5000 (16GB VRAM)
    config = TrainingConfig(
        model_name="microsoft/codebert-base",
        batch_size=48,  # Optimized for RTX 5000's 16GB VRAM
        num_epochs=10,
        learning_rate=2e-5,
        max_length=512,
        embedding_dim=768,
        gradient_accumulation_steps=2,  # Effective batch size: 96
        output_dir="./models/code_detector",
        warmup_steps=500,
        lambda_contrastive=0.5,
        lambda_classification=0.5,
        temperature=0.07,
        use_wandb=False,
        num_workers=4,  # Reduced for RTX 5000 systems
        pin_memory=True,
        prefetch_factor=2,
        persistent_workers=True,
        mixed_precision=True,
        compile_model=False  # Disable for RTX 5000 compatibility
    )
    
    print("\n" + "="*70)
    print("CodeGuard Nexus - ML Model Training (RTX 5000 Optimized)")
    print("="*70)
    print(f"Configuration:")
    print(f"  Model: {config.model_name}")
    print(f"  Batch Size: {config.batch_size} x {config.gradient_accumulation_steps} accumulation")
    print(f"  Effective Batch Size: {config.batch_size * config.gradient_accumulation_steps}")
    print(f"  Epochs: {config.num_epochs}")
    print(f"  Learning Rate: {config.learning_rate}")
    print(f"  Mixed Precision: {config.mixed_precision}")
    print(f"  Model Compilation: {config.compile_model}")
    print(f"  Device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")
    if torch.cuda.is_available():
        print(f"  GPU: {torch.cuda.get_device_name(0)}")
        print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        print(f"  CUDA Capability: {torch.cuda.get_device_capability(0)}")
        print(f"  Tensor Cores: Available" if torch.cuda.get_device_capability(0)[0] >= 7 else "Not Available")
    print(f"  Workers: {config.num_workers}")
    print(f"  Output: {config.output_dir}")
    print("="*70 + "\n")
    
    trainer = CodeDetectorTrainer(config)
    trainer.train()
    
    print("\n" + "="*60)
    print("✓ Training Complete!")
    print(f"Model saved to: {config.output_dir}")
    print("="*60)


if __name__ == "__main__":
    main()
