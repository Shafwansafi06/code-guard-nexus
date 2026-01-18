import hashlib
import re
from typing import Set, List

class WinnowingService:
    def __init__(self, k: int = 15, w: int = 10):
        """
        k: k-gram size (noise threshold)
        w: window size (guarantee threshold)
        """
        self.k = k
        self.w = w

    def preprocess(self, text: str) -> str:
        """Basic preprocessing: remove comments, whitespace and lowercase"""
        # Remove Python/Shell comments
        text = re.sub(r'#.*', '', text)
        # Remove C-style single line comments
        text = re.sub(r'//.*', '', text)
        # Remove C-style multi-line comments
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
        # Remove Python multi-line strings/comments
        text = re.sub(r'""".*?"""', '', text, flags=re.DOTALL)
        text = re.sub(r"'''.*?'''", '', text, flags=re.DOTALL)
        
        # Lowercase and remove all whitespace
        text = text.lower()
        text = re.sub(r'\s+', '', text)
        return text

    def get_kgrams(self, text: str) -> List[str]:
        """Generate sliding window k-grams"""
        if len(text) < self.k:
            return [text] if text else []
        return [text[i:i+self.k] for i in range(len(text) - self.k + 1)]

    def hash_kgrams(self, kgrams: List[str]) -> List[int]:
        """Compute hashes for k-grams"""
        hashes = []
        for kg in kgrams:
            # Using MD5 for a balance of speed and collision resistance for fingerprints
            h = hashlib.md5(kg.encode('utf-8')).hexdigest()
            # Use 32-bit integer for hashes
            hashes.append(int(h[:8], 16))
        return hashes

    def winnow(self, hashes: List[int]) -> Set[int]:
        """Apply winnowing algorithm to select fingerprints"""
        fingerprints = set()
        if not hashes:
            return fingerprints
            
        n = len(hashes)
        w = self.w
        
        # If hashes list is shorter than window, just take the minimum
        if n < w:
            fingerprints.add(min(hashes))
            return fingerprints

        # Sliding window of size w
        for i in range(n - w + 1):
            window = hashes[i:i+w]
            # Select the minimum hash in the window. 
            # If multiple equal mins, the rightmost one is traditionally picked to allow incremental updates,
            # but for a simple set, any consistent selection works.
            min_val = min(window)
            fingerprints.add(min_val)
            
        return fingerprints

    def get_fingerprints(self, text: str) -> Set[int]:
        """Main entry point to get fingerprints from text"""
        clean_text = self.preprocess(text)
        if not clean_text:
            return set()
        kgrams = self.get_kgrams(clean_text)
        hashes = self.hash_kgrams(kgrams)
        return self.winnow(hashes)

    def compute_similarity(self, fingerprints1: Set[int], fingerprints2: Set[int]) -> float:
        """Compute Jaccard similarity between two sets of fingerprints"""
        if not fingerprints1 or not fingerprints2:
            return 0.0
        
        intersection = fingerprints1.intersection(fingerprints2)
        union = fingerprints1.union(fingerprints2)
        
        return len(intersection) / len(union)

# Global instance
winnowing_service = WinnowingService()
