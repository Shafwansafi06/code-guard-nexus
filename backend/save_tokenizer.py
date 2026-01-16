"""
Script to save the tokenizer alongside the trained model
"""

from transformers import AutoTokenizer
from pathlib import Path

def save_tokenizer():
    """Save the tokenizer to the models directory"""
    model_name = "microsoft/codebert-base"
    model_dir = Path("app/services/models/code_detector")
    tokenizer_dir = model_dir / "tokenizer"
    
    print(f"Loading tokenizer from {model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    print(f"Saving tokenizer to {tokenizer_dir}...")
    tokenizer.save_pretrained(str(tokenizer_dir))
    
    print("✓ Tokenizer saved successfully!")

if __name__ == "__main__":
    save_tokenizer()
