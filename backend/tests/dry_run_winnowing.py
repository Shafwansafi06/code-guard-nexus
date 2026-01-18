from app.services.winnowing import WinnowingService
import re

def dry_run():
    # Small k and w for easy visualization
    k = 5
    w = 4
    service = WinnowingService(k=k, w=w)
    
    code = "def add(a, b): return a + b # sum"
    print(f"--- DRY RUN START ---")
    print(f"Original Code: '{code}'")
    
    # 1. Preprocess
    clean = service.preprocess(code)
    print(f"\n1. Preprocessed (stripped): '{clean}'")
    
    # 2. K-grams
    kgrams = service.get_kgrams(clean)
    print(f"\n2. K-grams (k={k}):")
    print(kgrams[:5], "...")
    
    # 3. Hashes
    hashes = service.hash_kgrams(kgrams)
    print(f"\n3. Hashes (first 5):")
    print(hashes[:5], "...")
    
    # 4. Winnowing (Manual step-by-step for visualization)
    print(f"\n4. Winnowing (window size w={w}):")
    fingerprints = set()
    for i in range(len(hashes) - w + 1):
        window = hashes[i:i+w]
        min_h = min(window)
        fingerprints.add(min_h)
        if i < 3: # Just show first 3 windows
            print(f"   Window {i}: {window} -> Min: {min_h}")
    print(f"   ...")
    
    print(f"\nTotal Fingerprints selected: {len(fingerprints)}")
    
    # 5. Similarity Demo
    code_alt = "def plus(x, y): return x + y"
    fp_alt = service.get_fingerprints(code_alt)
    similarity = service.compute_similarity(fingerprints, fp_alt)
    
    print(f"\n5. Similarity with 'def plus(x, y): return x + y':")
    print(f"   Result: {similarity:.4f}")
    print(f"--- DRY RUN END ---")

if __name__ == "__main__":
    dry_run()
