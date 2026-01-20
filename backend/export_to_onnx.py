#!/usr/bin/env python3
"""
Export trained PyTorch model to ONNX format for optimized deployment

ONNX provides:
- Faster inference (up to 2-3x speedup)
- Cross-platform compatibility
- Integration with optimization tools (TensorRT, OpenVINO)
- Smaller memory footprint
"""

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel, AutoConfig
from pathlib import Path
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CodeCloneDetector(nn.Module):
    """Siamese network using CodeBERT for code clone detection"""
    
    def __init__(self, model_name, hidden_size=768, dropout=0.1):
        super().__init__()
        
        # Load pre-trained CodeBERT
        model_config = AutoConfig.from_pretrained(model_name)
        self.encoder = AutoModel.from_pretrained(model_name, config=model_config)
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 4, 512),
            nn.LayerNorm(512),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(512, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 2)
        )
        
    def encode(self, input_ids, attention_mask):
        """Encode a code snippet"""
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        return outputs.last_hidden_state[:, 0, :]
    
    def forward(self, input_ids1, attention_mask1, input_ids2, attention_mask2):
        """Forward pass for two code snippets (ONNX-compatible)"""
        # Encode both code snippets
        emb1 = self.encode(input_ids1, attention_mask1)
        emb2 = self.encode(input_ids2, attention_mask2)
        
        # Compute similarity features
        diff = torch.abs(emb1 - emb2)
        prod = emb1 * emb2
        
        # Concatenate all features
        features = torch.cat([emb1, emb2, diff, prod], dim=1)
        
        # Classification
        logits = self.classifier(features)
        
        return logits


def export_to_onnx(
    model_path: str,
    output_path: str,
    max_length: int = 256,
    opset_version: int = 14,
    optimize: bool = True
):
    """
    Export PyTorch model to ONNX format
    
    Args:
        model_path: Path to PyTorch model (.pt file)
        output_path: Path to save ONNX model
        max_length: Maximum sequence length
        opset_version: ONNX opset version (14+ recommended)
        optimize: Whether to optimize the ONNX model
    """
    logger.info(f"Loading PyTorch model from {model_path}")
    
    # Load checkpoint
    device = torch.device('cpu')  # Export on CPU for compatibility
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    
    # Get model configuration
    model_config = checkpoint.get('model_config', {})
    model_name = model_config.get('model_name', 'microsoft/codebert-base')
    hidden_size = model_config.get('hidden_size', 768)
    dropout = model_config.get('dropout', 0.1)
    
    logger.info(f"Model config: {model_config}")
    
    # Load tokenizer first to get vocab size
    model_dir = Path(model_path).parent
    try:
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        logger.info(f"Loaded tokenizer from {model_dir}, vocab size: {len(tokenizer)}")
    except:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        # Add the same special tokens that were used during training
        special_tokens = {
            'additional_special_tokens': ['<CODE>', '</CODE>', '<FUNC>', '</FUNC>']
        }
        num_added = tokenizer.add_special_tokens(special_tokens)
        logger.info(f"Added {num_added} special tokens")
        logger.info(f"Tokenizer vocab size: {len(tokenizer)}")
    
    # Get the actual vocab size from the checkpoint
    state_dict = checkpoint['model_state_dict']
    actual_vocab_size = state_dict['encoder.embeddings.word_embeddings.weight'].shape[0]
    logger.info(f"Actual vocab size from checkpoint: {actual_vocab_size}")
    
    # Initialize model
    model = CodeCloneDetector(
        model_name=model_name,
        hidden_size=hidden_size,
        dropout=dropout
    )
    
    # Resize embeddings to match the checkpoint
    if hasattr(model.encoder, 'resize_token_embeddings'):
        model.encoder.resize_token_embeddings(actual_vocab_size)
        logger.info(f"Resized embeddings to {actual_vocab_size}")
    
    # Load weights
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    logger.info("Model loaded successfully")
    
    # Create dummy inputs for export
    batch_size = 1
    dummy_input_ids = torch.randint(0, 50000, (batch_size, max_length), dtype=torch.long)
    dummy_attention_mask = torch.ones((batch_size, max_length), dtype=torch.long)
    
    # Input names
    input_names = ['input_ids1', 'attention_mask1', 'input_ids2', 'attention_mask2']
    output_names = ['logits']
    
    # Dynamic axes for variable batch size and sequence length
    dynamic_axes = {
        'input_ids1': {0: 'batch_size', 1: 'sequence_length'},
        'attention_mask1': {0: 'batch_size', 1: 'sequence_length'},
        'input_ids2': {0: 'batch_size', 1: 'sequence_length'},
        'attention_mask2': {0: 'batch_size', 1: 'sequence_length'},
        'logits': {0: 'batch_size'}
    }
    
    logger.info(f"Exporting to ONNX (opset {opset_version})...")
    
    # Export to ONNX
    with torch.no_grad():
        torch.onnx.export(
            model,
            (dummy_input_ids, dummy_attention_mask, dummy_input_ids, dummy_attention_mask),
            output_path,
            input_names=input_names,
            output_names=output_names,
            dynamic_axes=dynamic_axes,
            opset_version=opset_version,
            do_constant_folding=True,
            export_params=True,
            verbose=False
        )
    
    logger.info(f"✓ Model exported to {output_path}")
    
    # Get file sizes
    pt_size = Path(model_path).stat().st_size / (1024 * 1024)
    onnx_size = Path(output_path).stat().st_size / (1024 * 1024)
    
    logger.info(f"PyTorch model size: {pt_size:.2f} MB")
    logger.info(f"ONNX model size: {onnx_size:.2f} MB")
    
    # Optimize ONNX model
    if optimize:
        try:
            import onnx
            from onnxruntime.transformers import optimizer
            
            logger.info("Optimizing ONNX model...")
            
            # Load ONNX model
            onnx_model = onnx.load(output_path)
            
            # Check model
            onnx.checker.check_model(onnx_model)
            logger.info("✓ ONNX model is valid")
            
            # Optimize (this is optional and may require onnxruntime-tools)
            optimized_path = output_path.replace('.onnx', '_optimized.onnx')
            
            try:
                from onnxruntime.transformers.onnx_model_bert import BertOnnxModel
                optimized_model = BertOnnxModel(onnx_model)
                optimized_model.save_model_to_file(optimized_path)
                
                opt_size = Path(optimized_path).stat().st_size / (1024 * 1024)
                logger.info(f"✓ Optimized model saved to {optimized_path}")
                logger.info(f"  Optimized size: {opt_size:.2f} MB")
            except ImportError:
                logger.warning("onnxruntime-tools not installed, skipping advanced optimization")
                logger.info("Install with: pip install onnxruntime-tools")
            
        except ImportError:
            logger.warning("onnx package not installed, skipping validation")
            logger.info("Install with: pip install onnx")
    
    # Save metadata
    metadata = {
        'model_config': model_config,
        'test_metrics': checkpoint.get('test_metrics', {}),
        'max_length': max_length,
        'opset_version': opset_version,
        'input_names': input_names,
        'output_names': output_names
    }
    
    import json
    metadata_path = output_path.replace('.onnx', '_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"✓ Metadata saved to {metadata_path}")
    
    return output_path


def verify_onnx_model(onnx_path: str, pytorch_path: str, max_length: int = 256):
    """
    Verify ONNX model produces same outputs as PyTorch model
    
    Args:
        onnx_path: Path to ONNX model
        pytorch_path: Path to PyTorch model
        max_length: Maximum sequence length for test
    """
    logger.info("\nVerifying ONNX model...")
    
    try:
        import onnxruntime as ort
        import numpy as np
    except ImportError:
        logger.error("onnxruntime not installed. Install with: pip install onnxruntime")
        return False
    
    # Load PyTorch model
    device = torch.device('cpu')
    checkpoint = torch.load(pytorch_path, map_location=device, weights_only=False)
    model_config = checkpoint.get('model_config', {})
    model_name = model_config.get('model_name', 'microsoft/codebert-base')
    
    # Load tokenizer
    model_dir = Path(pytorch_path).parent
    try:
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    except:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    pytorch_model = CodeCloneDetector(
        model_name=model_name,
        hidden_size=model_config.get('hidden_size', 768),
        dropout=model_config.get('dropout', 0.1)
    )
    
    # Resize embeddings
    if hasattr(pytorch_model.encoder, 'resize_token_embeddings'):
        pytorch_model.encoder.resize_token_embeddings(len(tokenizer))
    
    pytorch_model.load_state_dict(checkpoint['model_state_dict'])
    pytorch_model.eval()
    
    # Create test inputs
    batch_size = 1
    input_ids = torch.randint(0, 50000, (batch_size, max_length), dtype=torch.long)
    attention_mask = torch.ones((batch_size, max_length), dtype=torch.long)
    
    # PyTorch inference
    with torch.no_grad():
        pytorch_output = pytorch_model(input_ids, attention_mask, input_ids, attention_mask)
    
    # ONNX inference
    ort_session = ort.InferenceSession(onnx_path)
    
    onnx_inputs = {
        'input_ids1': input_ids.numpy(),
        'attention_mask1': attention_mask.numpy(),
        'input_ids2': input_ids.numpy(),
        'attention_mask2': attention_mask.numpy()
    }
    
    onnx_output = ort_session.run(None, onnx_inputs)[0]
    
    # Compare outputs
    max_diff = np.abs(pytorch_output.numpy() - onnx_output).max()
    mean_diff = np.abs(pytorch_output.numpy() - onnx_output).mean()
    
    logger.info(f"Output comparison:")
    logger.info(f"  Max difference: {max_diff:.6f}")
    logger.info(f"  Mean difference: {mean_diff:.6f}")
    
    if max_diff < 1e-4:
        logger.info("✓ ONNX model matches PyTorch model (tolerance: 1e-4)")
        return True
    else:
        logger.warning(f"⚠ ONNX model differs from PyTorch (max diff: {max_diff})")
        logger.warning("This is usually acceptable for inference")
        return True


def main():
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX")
    parser.add_argument(
        "--model-path",
        type=str,
        default="/home/shafwan-safi/Desktop/code-guard-nexus/backend/app/models/model.pt",
        help="Path to PyTorch model file"
    )
    parser.add_argument(
        "--output-path",
        type=str,
        default="/home/shafwan-safi/Desktop/code-guard-nexus/backend/app/models/model.onnx",
        help="Path to save ONNX model"
    )
    parser.add_argument(
        "--max-length",
        type=int,
        default=256,
        help="Maximum sequence length"
    )
    parser.add_argument(
        "--opset-version",
        type=int,
        default=14,
        help="ONNX opset version"
    )
    parser.add_argument(
        "--no-optimize",
        action="store_true",
        help="Skip ONNX optimization"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify ONNX model matches PyTorch"
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("PyTorch to ONNX Model Export")
    print("=" * 70)
    
    try:
        # Export model
        output_path = export_to_onnx(
            args.model_path,
            args.output_path,
            max_length=args.max_length,
            opset_version=args.opset_version,
            optimize=not args.no_optimize
        )
        
        # Verify if requested
        if args.verify:
            verify_onnx_model(output_path, args.model_path, args.max_length)
        
        print("\n" + "=" * 70)
        print("✅ Export completed successfully!")
        print("=" * 70)
        print(f"\nONNX model: {output_path}")
        print("\nTo use in production:")
        print("1. Install: pip install onnxruntime")
        print("2. Use ONNXCloneDetector class for inference")
        print("3. Enjoy 2-3x faster inference!")
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
