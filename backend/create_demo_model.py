"""
Create a lightweight demo model for testing purposes
This will be much faster than downloading the full 500MB model
"""

import torch
from app.services.train_detector import DualHeadCodeModel, TrainingConfig
from transformers import AutoTokenizer
from pathlib import Path

def create_demo_model():
    """Create a demo model with random weights for testing"""
    print("Creating demo model for testing...")
    
    config = TrainingConfig()
    model = DualHeadCodeModel(
        model_name=config.model_name,
        embedding_dim=config.embedding_dim
    )
    
    # Save model checkpoint
    save_dir = Path("app/services/models/code_detector")
    save_dir.mkdir(parents=True, exist_ok=True)
    
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'config': {
            'model_name': config.model_name,
            'embedding_dim': config.embedding_dim,
            'max_length': config.max_length,
        },
        'metrics': {
            'auc': 0.9994,  # Demo value
            'accuracy': 0.9950,
        },
        'note': 'Demo model for testing - not trained'
    }
    
    save_path = save_dir / "demo_model.pt"
    torch.save(checkpoint, save_path)
    print(f"✓ Demo model saved to {save_path}")
    
    # Save tokenizer
    tokenizer_dir = save_dir / "tokenizer"
    if not tokenizer_dir.exists():
        print(f"Saving tokenizer to {tokenizer_dir}...")
        tokenizer = AutoTokenizer.from_pretrained(config.model_name)
        tokenizer.save_pretrained(str(tokenizer_dir))
        print(f"✓ Tokenizer saved")
    else:
        print(f"✓ Tokenizer already exists")
    
    print("\n✓ Demo model created successfully!")
    print(f"   Model size: {save_path.stat().st_size / (1024*1024):.2f} MB")
    print("\nNote: This is a demo model with random weights for testing the integration.")
    print("For actual AI detection, you need to train the model or download the trained weights.")

if __name__ == "__main__":
    create_demo_model()
