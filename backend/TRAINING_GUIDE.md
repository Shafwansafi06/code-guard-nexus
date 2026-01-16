# AI Detection Model Training Guide

Since your current system does not have a GPU, follow these steps to train the professional AI Detection model on a different machine.

## Quick Start for Google Colab (Recommended)
1. Open a new [Google Colab](https://colab.research.google.com/) notebook.
2. Change runtime to **GPU** (Edit -> Notebook settings -> Hardware accelerator -> T4 GPU).
3. Run these commands in a cell:
   > [!IMPORTANT]
   > **CRITICAL**: The error you saw (`github-code.py`) means you are still running the **OLD version** of the script. Please copy the **NEW code** from your editor's `fine_tune_model.py` first!

3. Run these commands in a cell:
   ```bash
   !pip install --upgrade datasets transformers torch tqdm scikit-learn seaborn matplotlib
   # Login is required for the new high-quality dataset
   !huggingface-cli login
   # Upload the NEW fine_tune_model.py using the file sidebar on the left
   !python fine_tune_model.py
   ```

## Prerequisites for Local Training

## Steps

1. **Copy the Training Files**
   Copy the following files to your GPU system:
   - `backend/fine_tune_model.py`
   - `backend/app/requirements-ml.txt`

2. **Setup Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements-ml.txt
   ```

3. **Run Training**
   ```bash
   python fine_tune_model.py
   ```
   *This will download CodeBERT and the MultiAIGCD dataset (~120k samples available, the script defaults to 10k for speed).*

4. **Transfer the Model Back**
   Once finished, a file will be created at:
   `app/services/models/code_detector/fine_tuned_codebert.pt`
   
   Copy this file back to your project in the same directory:
   `backend/app/services/models/code_detector/fine_tuned_codebert.pt`

5. **Restart Backend**
   Restart your `start_backend.sh`. The system will automatically detect and use the new professional model for superior accuracy.
