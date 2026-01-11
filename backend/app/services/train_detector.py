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
    
    # Training settings
    batch_size: int = 32
    num_epochs: int = 10
    learning_rate: float = 2e-5
    warmup_steps: int = 1000
    weight_decay: float = 0.01
    
    # Loss weights
    lambda_contrastive: float = 0.5
    lambda_classification: float = 0.5
    temperature: float = 0.07  # For InfoNCE loss
    
    # Freezing strategy
    freeze_epochs: int = 2
    
    # Hardware
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    num_workers: int = 4
    
    # Paths
    output_dir: str = "./models/code_detector"
    checkpoint_dir: str = "./checkpoints"
    
    # Logging
    use_wandb: bool = False
    log_interval: int = 100


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
                    'language': item['language'],
                    'task': item['title'],
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
        # For now, create synthetic examples
        # In production, load from actual AI-generated code datasets
        
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
        
        # Loss functions
        self.contrastive_loss = InfoNCELoss(temperature=config.temperature)
        self.classification_loss = nn.CrossEntropyLoss()
        
        # Initialize wandb if enabled
        if config.use_wandb:
            wandb.init(project="code-detector", config=vars(config))
    
    def prepare_data(self):
        """Load and prepare datasets"""
        logger.info("Preparing datasets...")
        
        # Load datasets
        rosetta_examples = DatasetLoader.load_rosetta_code()
        ai_examples = DatasetLoader.load_ai_generated_code()
        
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
        
        # Create dataloaders
        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=self.config.num_workers
        )
        self.val_loader = DataLoader(
            self.val_dataset,
            batch_size=self.config.batch_size,
            num_workers=self.config.num_workers
        )
        
        logger.info(f"Train: {len(train_examples)}, Val: {len(val_examples)}, Test: {len(test_examples)}")
    
    def train_epoch(self, epoch: int, optimizer, scheduler):
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        contrastive_loss_total = 0
        classification_loss_total = 0
        
        progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch}")
        
        for batch_idx, batch in enumerate(progress_bar):
            input_ids = batch['input_ids'].to(self.device)
            attention_mask = batch['attention_mask'].to(self.device)
            labels = batch['label'].to(self.device)
            
            # Forward pass
            logits, embeddings = self.model(input_ids, attention_mask)
            
            # Compute losses
            cls_loss = self.classification_loss(logits, labels)
            cont_loss = self.contrastive_loss(embeddings, labels)
            
            # Combined loss
            loss = (self.config.lambda_classification * cls_loss + 
                   self.config.lambda_contrastive * cont_loss)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            
            # Track metrics
            total_loss += loss.item()
            contrastive_loss_total += cont_loss.item()
            classification_loss_total += cls_loss.item()
            
            if batch_idx % self.config.log_interval == 0:
                progress_bar.set_postfix({
                    'loss': f'{loss.item():.4f}',
                    'cls': f'{cls_loss.item():.4f}',
                    'cont': f'{cont_loss.item():.4f}'
                })
        
        avg_loss = total_loss / len(self.train_loader)
        return avg_loss, classification_loss_total / len(self.train_loader), contrastive_loss_total / len(self.train_loader)
    
    def evaluate(self):
        """Evaluate model"""
        self.model.eval()
        all_labels = []
        all_preds = []
        all_embeddings = []
        
        with torch.no_grad():
            for batch in tqdm(self.val_loader, desc="Evaluating"):
                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['label']
                
                logits, embeddings = self.model(input_ids, attention_mask)
                preds = torch.softmax(logits, dim=1)[:, 1]  # Probability of AI-generated
                
                all_labels.extend(labels.cpu().numpy())
                all_preds.extend(preds.cpu().numpy())
                all_embeddings.append(embeddings.cpu().numpy())
        
        # Compute metrics
        all_labels = np.array(all_labels)
        all_preds = np.array(all_preds)
        all_embeddings = np.vstack(all_embeddings)
        
        # ROC-AUC for classification
        roc_auc = roc_auc_score(all_labels, all_preds)
        
        # Precision-Recall AUC
        precision, recall, _ = precision_recall_curve(all_labels, all_preds)
        pr_auc = auc(recall, precision)
        
        logger.info(f"Validation ROC-AUC: {roc_auc:.4f}, PR-AUC: {pr_auc:.4f}")
        
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
    config = TrainingConfig(
        model_name="microsoft/codebert-base",
        batch_size=32,
        num_epochs=10,
        learning_rate=2e-5,
        use_wandb=False  # Set to True if you have wandb setup
    )
    
    trainer = CodeDetectorTrainer(config)
    trainer.train()


if __name__ == "__main__":
    main()
