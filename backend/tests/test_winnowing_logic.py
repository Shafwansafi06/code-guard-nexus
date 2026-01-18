from app.services.winnowing import WinnowingService

def test_winnowing():
    service = WinnowingService(k=8, w=4)
    
    # Exact copy
    code1 = "def test(): return 1 + 2"
    code1_copy = "def  test(): \n  return 1 + 2" # different whitespace/newline
    
    fp1 = service.get_fingerprints(code1)
    fp1_copy = service.get_fingerprints(code1_copy)
    sim_exact = service.compute_similarity(fp1, fp1_copy)
    print(f"Similarity (Exact Copy): {sim_exact:.4f}")
    assert sim_exact == 1.0, "Exact copies (after preprocessing) must have 100% similarity"
    
    # Partially similar (variable renames, different function name)
    code_a = """
    def hello_world():
        print("Hello, World!")
        x = 10
        y = 20
        return x + y
    """
    
    code_b = """
    def say_hello():
        print("Hello, World!")
        a = 10
        b = 20
        return a + b
    """
    
    fp_a = service.get_fingerprints(code_a)
    fp_b = service.get_fingerprints(code_b)
    sim_ab = service.compute_similarity(fp_a, fp_b)
    print(f"Similarity (Partial/Renamed): {sim_ab:.4f}")
    # For character-based winnowing with k=8, this is about 0.22 as calculated before.
    assert sim_ab > 0.1, "Should detect shared segments even with renames"
    
    # Completely different
    code_c = """
    class Database:
        def __init__(self, url):
            self.url = url
    """
    fp_c = service.get_fingerprints(code_c)
    sim_ac = service.compute_similarity(fp_a, fp_c)
    print(f"Similarity (Different): {sim_ac:.4f}")
    assert sim_ac < 0.05, "Different code should have near zero similarity"
    
    print("OK: Winnowing logic tests passed!")

if __name__ == "__main__":
    test_winnowing()
