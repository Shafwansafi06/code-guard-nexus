#!/usr/bin/env python3
"""
Test script for the clone detection model

This script demonstrates how to use the clone detector with various code examples.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.clone_detector import get_clone_detector


def test_identical_code():
    """Test 1: Identical code"""
    print("\n" + "="*70)
    print("TEST 1: Identical Code")
    print("="*70)
    
    code1 = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""
    
    code2 = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""
    
    detector = get_clone_detector()
    result = detector.predict_clone(code1, code2)
    
    print(f"Code 1:\n{code1}")
    print(f"Code 2:\n{code2}")
    print(f"\n📊 Results:")
    print(f"  Is Clone: {result['is_clone']}")
    print(f"  Similarity Score: {result['similarity_score']:.2f}%")
    print(f"  Confidence: {result['confidence']:.2f}")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  {result['risk_description']}")


def test_renamed_variables():
    """Test 2: Same logic, different variable names"""
    print("\n" + "="*70)
    print("TEST 2: Same Logic, Renamed Variables")
    print("="*70)
    
    code1 = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""
    
    code2 = """
def sum_numbers(arr):
    result = 0
    for x in arr:
        result = result + x
    return result
"""
    
    detector = get_clone_detector()
    result = detector.predict_clone(code1, code2)
    
    print(f"Code 1:\n{code1}")
    print(f"Code 2:\n{code2}")
    print(f"\n📊 Results:")
    print(f"  Is Clone: {result['is_clone']}")
    print(f"  Similarity Score: {result['similarity_score']:.2f}%")
    print(f"  Confidence: {result['confidence']:.2f}")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  {result['risk_description']}")


def test_different_functions():
    """Test 3: Completely different functions"""
    print("\n" + "="*70)
    print("TEST 3: Different Functions")
    print("="*70)
    
    code1 = """
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
"""
    
    code2 = """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
"""
    
    detector = get_clone_detector()
    result = detector.predict_clone(code1, code2)
    
    print(f"Code 1:\n{code1}")
    print(f"Code 2:\n{code2}")
    print(f"\n📊 Results:")
    print(f"  Is Clone: {result['is_clone']}")
    print(f"  Similarity Score: {result['similarity_score']:.2f}%")
    print(f"  Confidence: {result['confidence']:.2f}")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  {result['risk_description']}")


def test_refactored_code():
    """Test 4: Refactored version (same logic, different style)"""
    print("\n" + "="*70)
    print("TEST 4: Refactored Code (Same Logic)")
    print("="*70)
    
    code1 = """
def find_max(numbers):
    max_num = numbers[0]
    for num in numbers:
        if num > max_num:
            max_num = num
    return max_num
"""
    
    code2 = """
def get_maximum(arr):
    return max(arr)
"""
    
    detector = get_clone_detector()
    result = detector.predict_clone(code1, code2)
    
    print(f"Code 1:\n{code1}")
    print(f"Code 2:\n{code2}")
    print(f"\n📊 Results:")
    print(f"  Is Clone: {result['is_clone']}")
    print(f"  Similarity Score: {result['similarity_score']:.2f}%")
    print(f"  Confidence: {result['confidence']:.2f}")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  {result['risk_description']}")


def test_batch_detection():
    """Test 5: Batch clone detection across multiple submissions"""
    print("\n" + "="*70)
    print("TEST 5: Batch Clone Detection")
    print("="*70)
    
    submissions = [
        # Student 1
        """
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
""",
        # Student 2 - Same as Student 1
        """
def fib(num):
    if num <= 1:
        return num
    return fib(num-1) + fib(num-2)
""",
        # Student 3 - Different approach
        """
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
""",
        # Student 4 - Completely different
        """
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)
"""
    ]
    
    detector = get_clone_detector()
    results = detector.batch_compare(submissions, threshold=0.6)
    
    print(f"Analyzing {len(submissions)} submissions...\n")
    
    clone_pairs = [r for r in results if r['is_clone']]
    
    print(f"📊 Results:")
    print(f"  Total comparisons: {len(results)}")
    print(f"  Clone pairs found: {len(clone_pairs)}\n")
    
    if clone_pairs:
        print("🚨 Potential Plagiarism Detected:")
        for pair in clone_pairs:
            print(f"\n  Submission {pair['code1_index']} vs Submission {pair['code2_index']}:")
            print(f"    Similarity: {pair['similarity_score']:.2f}%")
            print(f"    Risk Level: {pair['risk_level']}")
            print(f"    {pair['risk_description']}")
    else:
        print("✅ No plagiarism detected above threshold")


def test_find_similar():
    """Test 6: Find similar submissions to a target"""
    print("\n" + "="*70)
    print("TEST 6: Find Similar Submissions")
    print("="*70)
    
    target = """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
"""
    
    candidates = [
        # Very similar
        """
def sort_bubble(array):
    length = len(array)
    for i in range(length):
        for j in range(0, length-i-1):
            if array[j] > array[j+1]:
                array[j], array[j+1] = array[j+1], array[j]
    return array
""",
        # Somewhat similar
        """
def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
""",
        # Different
        """
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
"""
    ]
    
    detector = get_clone_detector()
    results = detector.find_similar_submissions(target, candidates, threshold=0.4, top_k=3)
    
    print("Target submission:")
    print(target)
    print(f"\nSearching among {len(candidates)} candidates...\n")
    
    print(f"📊 Top {len(results)} Similar Submissions:")
    for i, result in enumerate(results, 1):
        print(f"\n  #{i} - Candidate {result['candidate_index']}:")
        print(f"    Similarity: {result['similarity_score']:.2f}%")
        print(f"    Risk Level: {result['risk_level']}")
        print(f"    {result['risk_description']}")


def main():
    print("=" * 70)
    print("Code Guard Nexus - Clone Detection Test Suite")
    print("=" * 70)
    
    try:
        # Run all tests
        test_identical_code()
        test_renamed_variables()
        test_different_functions()
        test_refactored_code()
        test_batch_detection()
        test_find_similar()
        
        print("\n" + "=" * 70)
        print("✅ All tests completed successfully!")
        print("=" * 70)
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\nPlease run setup_clone_detector.py first to install the model:")
        print("  python setup_clone_detector.py --source /path/to/final_model")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
