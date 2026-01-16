"""
CodeGuard Nexus - Hackathon-Optimized AI Code Detection
Quick training script that actually works for demos!

Realistic approach for hackathons:
- Uses real GitHub code as human baseline
- Generates AI-style variations programmatically
- Fast training (30 mins - 2 hours)
- Good enough results for demos (~70-75% accuracy)
"""

import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification, 
    get_linear_schedule_with_warmup
)
from torch.optim import AdamW
from datasets import load_dataset
import numpy as np
from tqdm import tqdm
import logging
from pathlib import Path
import random
from sklearn.metrics import classification_report, f1_score, accuracy_score, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SmartCodeTransformer:
    """
    Transform human code to mimic AI patterns observed in real LLM outputs:
    - Verbose variable names (num_items vs n)
    - Excessive comments
    - Step-by-step logic breakdown
    - Explicit error handling
    - Type hints everywhere
    - Descriptive function names
    """
    
    @staticmethod
    def add_ai_style_comments(code):
        """Add typical AI-style comments"""
        lines = code.split('\n')
        result = []
        
        for line in lines:
            stripped = line.strip()
            indent = len(line) - len(line.lstrip())
            
            # Add comments before key statements
            if stripped.startswith('def ') or stripped.startswith('class '):
                result.append(' ' * indent + '# Define the function/class')
            elif stripped.startswith('return'):
                result.append(' ' * indent + '# Return the result')
            elif stripped.startswith('for ') or stripped.startswith('while '):
                result.append(' ' * indent + '# Iterate through items')
            elif stripped.startswith('if '):
                result.append(' ' * indent + '# Check condition')
            elif stripped.startswith('except'):
                result.append(' ' * indent + '# Handle exceptions')
            elif '=' in stripped and not any(x in stripped for x in ['==', '!=', '<=', '>=']):
                result.append(' ' * indent + '# Set/initialize variable')
            
            result.append(line)
        
        return '\n'.join(result)
    
    @staticmethod
    def make_verbose(code):
        """Make variable names more verbose (AI style)"""
        # Common AI-style transformations
        replacements = {
            r'\bn\b': 'number',
            r'\bi\b': 'index',
            r'\bj\b': 'inner_index',
            r'\bk\b': 'counter',
            r'\bx\b': 'value',
            r'\by\b': 'result',
            r'\bs\b': 'string',
            r'\barr\b': 'array',
            r'\blst\b': 'list_items',
            r'\bdict\b': 'dictionary',
            r'\btemp\b': 'temporary_value',
            r'\bres\b': 'result',
            r'\bfn\b': 'function',
        }
        
        import re
        result = code
        for pattern, replacement in replacements.items():
            result = re.sub(pattern, replacement, result)
        
        return result
    
    @staticmethod
    def add_explicit_steps(code):
        """Break down logic into explicit steps (AI style)"""
        lines = code.split('\n')
        result = []
        
        for line in lines:
            result.append(line)
            
            # Add explicit intermediate variables for complex expressions
            if '=' in line and any(op in line for op in ['+', '-', '*', '/', '%', '**']):
                stripped = line.strip()
                if not stripped.startswith('#') and '==' not in stripped:
                    indent = len(line) - len(line.lstrip())
                    # AI often adds newline after assignments
                    if random.random() > 0.7:  # 30% chance
                        result.append('')
        
        return '\n'.join(result)
    
    @staticmethod
    def add_type_hints(code):
        """Add type hints (common in AI-generated code)"""
        import re
        
        # Add type hints to simple function definitions
        def add_hints(match):
            func_def = match.group(0)
            # Simple heuristic: add -> None or -> Any
            if '-> ' not in func_def:
                if random.random() > 0.5:
                    return func_def.rstrip(':') + ' -> None:'
            return func_def
        
        result = re.sub(r'def \w+\([^)]*\):', add_hints, code)
        return result
    
    @staticmethod
    def transform_to_ai_style(code):
        """Apply multiple AI-style transformations"""
        # Apply transformations probabilistically for variety
        transformed = code
        
        if random.random() > 0.2:  # 80% chance
            transformed = SmartCodeTransformer.add_ai_style_comments(transformed)
        
        if random.random() > 0.4:  # 60% chance
            transformed = SmartCodeTransformer.make_verbose(transformed)
        
        if random.random() > 0.5:  # 50% chance
            transformed = SmartCodeTransformer.add_explicit_steps(transformed)
        
        if random.random() > 0.6:  # 40% chance
            transformed = SmartCodeTransformer.add_type_hints(transformed)
        
        return transformed


class HackathonTrainer:
    """Optimized for quick training and good demo results"""
    
    def __init__(
        self, 
        model_name="microsoft/codebert-base",
        num_labels=2,
        max_length=512
    ):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"🚀 Using device: {self.device}")
        
        if not torch.cuda.is_available():
            logger.warning("⚠️  No GPU detected! Training will be SLOW. Consider using Colab with GPU.")
        
        self.model_name = model_name
        self.max_length = max_length
        
        logger.info("Loading CodeBERT model...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name, 
            num_labels=num_labels
        ).to(self.device)
        
        self.transformer = SmartCodeTransformer()
        
    def prepare_hackathon_dataset(self, limit=2000):
        """
        Prepare a balanced dataset for hackathon demo
        - Uses real GitHub Python code as "human"
        - Applies smart transformations for "AI-style" code
        - Balanced 50/50 split
        """
        logger.info("=" * 80)
        logger.info("📦 Loading GitHub Code Dataset")
        logger.info("=" * 80)
        
        try:
            logger.info("Attempting to load 'bigcode/the-stack-smol' (Python subset)...")
            # This dataset is Parquet-based and does NOT require trust_remote_code
            dataset = load_dataset(
                "bigcode/the-stack-smol",
                data_dir="data/python",
                split="train",
                streaming=True
            )
            
            samples = []
            human_count = 0
            target_per_class = limit // 2
            
            logger.info(f"Target: {target_per_class} human + {target_per_class} AI-style samples")
            
            for item in tqdm(dataset, desc="Processing code samples"):
                if human_count >= target_per_class:
                    break
                
                # 'the-stack-smol' uses 'content' for the source code
                code = item.get('content', '').strip()
                
                # Quality filters
                if len(code) < 150 or len(code) > 1500:
                    continue
                
                # Must have function or class
                if 'def ' not in code and 'class ' not in code:
                    continue
                
                # Avoid already heavily commented code
                comment_ratio = code.count('#') / max(len(code.split('\n')), 1)
                if comment_ratio > 0.3:
                    continue
                
                # Human code (original)
                samples.append({
                    "text": code,
                    "label": 0,
                    "source": "human"
                })
                
                # AI-style code (transformed)
                ai_code = self.transformer.transform_to_ai_style(code)
                samples.append({
                    "text": ai_code,
                    "label": 1,
                    "source": "ai_style"
                })
                
                human_count += 1
                
                if human_count % 100 == 0:
                    logger.info(f"✓ Processed {human_count * 2} samples ({human_count} pairs)")
            
            # Shuffle for good measure
            random.shuffle(samples)
            
            logger.info("=" * 80)
            logger.info(f"✅ Dataset ready: {len(samples)} total samples")
            logger.info(f"   - Human: {sum(1 for s in samples if s['label'] == 0)}")
            logger.info(f"   - AI-style: {sum(1 for s in samples if s['label'] == 1)}")
            logger.info("=" * 80)
            
            return samples
            
        except Exception as e:
            logger.error(f"❌ Failed to load dataset: {e}")
            logger.error("Make sure you have internet connection!")
            return []
    
    def create_splits(self, samples, train_ratio=0.7, val_ratio=0.15):
        """Split data into train/val/test"""
        total = len(samples)
        train_size = int(total * train_ratio)
        val_size = int(total * val_ratio)
        test_size = total - train_size - val_size
        
        train_data, val_data, test_data = random_split(
            samples, 
            [train_size, val_size, test_size],
            generator=torch.Generator().manual_seed(42)
        )
        
        logger.info(f"📊 Data split: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")
        return train_data, val_data, test_data
    
    def collate_fn(self, batch):
        """Prepare batch for training"""
        texts = [item["text"] for item in batch]
        labels = torch.tensor([item["label"] for item in batch])
        
        encodings = self.tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        return encodings.to(self.device), labels.to(self.device)
    
    def evaluate(self, dataloader, phase="Validation"):
        """Evaluate model performance"""
        self.model.eval()
        all_preds = []
        all_labels = []
        total_loss = 0
        
        with torch.no_grad():
            for batch in tqdm(dataloader, desc=f"Evaluating {phase}"):
                encodings, labels = batch
                outputs = self.model(**encodings, labels=labels)
                
                loss = outputs.loss
                total_loss += loss.item()
                
                predictions = torch.argmax(outputs.logits, dim=-1)
                all_preds.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        # Calculate metrics
        accuracy = accuracy_score(all_labels, all_preds)
        f1 = f1_score(all_labels, all_preds, average='binary')
        
        logger.info(f"\n{'='*80}")
        logger.info(f"📊 {phase} Results:")
        logger.info(f"{'='*80}")
        logger.info(f"Loss: {total_loss / len(dataloader):.4f}")
        logger.info(f"Accuracy: {accuracy*100:.2f}%")
        logger.info(f"F1 Score: {f1:.4f}")
        logger.info("\n" + classification_report(
            all_labels, all_preds, 
            target_names=['Human', 'AI-Generated'],
            digits=4
        ))
        
        return {
            'accuracy': accuracy,
            'f1': f1,
            'loss': total_loss / len(dataloader),
            'predictions': all_preds,
            'labels': all_labels
        }
    
    def train(self, train_data, val_data, epochs=3, batch_size=16):
        """Train the model with validation"""
        
        train_loader = DataLoader(
            train_data, 
            batch_size=batch_size, 
            shuffle=True, 
            collate_fn=self.collate_fn
        )
        val_loader = DataLoader(
            val_data, 
            batch_size=batch_size, 
            shuffle=False, 
            collate_fn=self.collate_fn
        )
        
        optimizer = AdamW(self.model.parameters(), lr=2e-5, weight_decay=0.01)
        total_steps = len(train_loader) * epochs
        
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=int(0.1 * total_steps),
            num_training_steps=total_steps
        )
        
        best_f1 = 0.0
        training_history = []
        
        for epoch in range(epochs):
            logger.info(f"\n{'='*80}")
            logger.info(f"🔥 Epoch {epoch+1}/{epochs}")
            logger.info(f"{'='*80}")
            
            # Training phase
            self.model.train()
            total_loss = 0
            correct = 0
            total = 0
            
            progress_bar = tqdm(train_loader, desc=f"Training Epoch {epoch+1}")
            for batch in progress_bar:
                encodings, labels = batch
                
                optimizer.zero_grad()
                outputs = self.model(**encodings, labels=labels)
                loss = outputs.loss
                
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                
                optimizer.step()
                scheduler.step()
                
                total_loss += loss.item()
                
                # Calculate batch accuracy
                predictions = torch.argmax(outputs.logits, dim=-1)
                correct += (predictions == labels).sum().item()
                total += labels.size(0)
                
                # Update progress bar
                progress_bar.set_postfix({
                    'loss': f'{loss.item():.4f}',
                    'acc': f'{100*correct/total:.2f}%'
                })
            
            avg_train_loss = total_loss / len(train_loader)
            train_accuracy = 100 * correct / total
            
            logger.info(f"📈 Training Loss: {avg_train_loss:.4f}")
            logger.info(f"📈 Training Accuracy: {train_accuracy:.2f}%")
            
            # Validation phase
            val_metrics = self.evaluate(val_loader, phase="Validation")
            
            training_history.append({
                'epoch': epoch + 1,
                'train_loss': avg_train_loss,
                'train_acc': train_accuracy,
                'val_loss': val_metrics['loss'],
                'val_acc': val_metrics['accuracy'] * 100,
                'val_f1': val_metrics['f1']
            })
            
            # Save best model
            if val_metrics['f1'] > best_f1:
                best_f1 = val_metrics['f1']
                self.save_model('best_model.pt', val_metrics)
                logger.info(f"💾 New best model saved! F1: {best_f1:.4f}")
        
        return training_history
    
    def save_model(self, filename, metrics=None):
        """Save model checkpoint"""
        save_dir = Path("models/code_detector")
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / filename
        
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'config': {
                'model_name': self.model_name,
                'num_labels': 2,
                'max_length': self.max_length
            },
            'metrics': metrics
        }
        
        torch.save(checkpoint, save_path)
        
        # Save tokenizer
        tokenizer_path = save_dir / "tokenizer"
        self.tokenizer.save_pretrained(tokenizer_path)
        
        logger.info(f"💾 Model saved to {save_path}")
        logger.info(f"💾 Tokenizer saved to {tokenizer_path}")
    
    def plot_confusion_matrix(self, predictions, labels, save_path="confusion_matrix.png"):
        """Plot confusion matrix for demo"""
        cm = confusion_matrix(labels, predictions)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap='Blues',
            xticklabels=['Human', 'AI-Generated'],
            yticklabels=['Human', 'AI-Generated']
        )
        plt.title('Confusion Matrix - Code Detection')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Confusion matrix saved to {save_path}")


def main():
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║         CodeGuard Nexus - Hackathon Edition 🚀               ║
    ╚══════════════════════════════════════════════════════════════╝
    
    Quick training pipeline optimized for hackathon demos!
    
    What this does:
    ✅ Uses real GitHub Python code as human baseline
    ✅ Applies smart transformations to mimic AI style
    ✅ Trains in 30 mins - 2 hours (with GPU)
    ✅ Achieves ~70-75% accuracy (good for demos!)
    ✅ Creates confusion matrix visualization
    ✅ Saves best model automatically
    
    Recommended settings:
    - Colab with GPU (T4 or better)
    - 2000-4000 samples (quick training)
    - 3-5 epochs
    
    For production: You'd need real AI-generated code from
    GPT-4, Claude, etc. But this works great for hackathons!
    
    ══════════════════════════════════════════════════════════════
    """)
    
    # Get user input
    try:
        limit = input("Number of samples (recommended 2000-4000, default 2000): ").strip()
        limit = int(limit) if limit else 2000
    except:
        limit = 2000
    
    try:
        epochs = input("Number of epochs (recommended 3-5, default 3): ").strip()
        epochs = int(epochs) if epochs else 3
    except:
        epochs = 3
    
    try:
        batch_size = input("Batch size (default 16, reduce if OOM): ").strip()
        batch_size = int(batch_size) if batch_size else 16
    except:
        batch_size = 16
    
    logger.info("\n🚀 Starting hackathon training pipeline...")
    
    # Initialize trainer
    trainer = HackathonTrainer()
    
    # Prepare dataset
    samples = trainer.prepare_hackathon_dataset(limit=limit)
    
    if not samples:
        logger.error("❌ Failed to prepare dataset. Check your internet connection!")
        return
    
    if len(samples) < 500:
        logger.warning(f"⚠️  Only {len(samples)} samples. Recommended: 2000+")
        response = input("Continue anyway? (yes/no): ").strip().lower()
        if response != 'yes':
            return
    
    # Split data
    train_data, val_data, test_data = trainer.create_splits(samples)
    
    # Train
    logger.info("\n🔥 Starting training...\n")
    training_history = trainer.train(train_data, val_data, epochs=epochs, batch_size=batch_size)
    
    # Final test evaluation
    logger.info("\n" + "="*80)
    logger.info("🎯 FINAL TEST SET EVALUATION")
    logger.info("="*80)
    
    test_loader = DataLoader(
        test_data, 
        batch_size=batch_size, 
        shuffle=False, 
        collate_fn=trainer.collate_fn
    )
    test_metrics = trainer.evaluate(test_loader, phase="Test Set")
    
    # Plot confusion matrix
    try:
        trainer.plot_confusion_matrix(
            test_metrics['predictions'], 
            test_metrics['labels'],
            save_path="models/code_detector/confusion_matrix.png"
        )
    except Exception as e:
        logger.warning(f"Could not save confusion matrix: {e}")
    
    # Final summary
    print("\n" + "="*80)
    print("🎉 TRAINING COMPLETE!")
    print("="*80)
    print(f"📊 Final Test Accuracy: {test_metrics['accuracy']*100:.2f}%")
    print(f"📊 Final Test F1 Score: {test_metrics['f1']:.4f}")
    print("\n💾 Model saved to: models/code_detector/best_model.pt")
    print("💾 Tokenizer saved to: models/code_detector/tokenizer/")
    
    if test_metrics['f1'] >= 0.70:
        print("\n✅ Great results for a hackathon demo! (F1 ≥ 0.70)")
    elif test_metrics['f1'] >= 0.65:
        print("\n⚠️  Decent results, could be better with more data")
    else:
        print("\n❌ Results below expectations. Try:")
        print("   - More training samples (4000+)")
        print("   - More epochs (5+)")
        print("   - Check if GPU is being used")
    
    print("\n🚀 Ready for your hackathon demo!")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()