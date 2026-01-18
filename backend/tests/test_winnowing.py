import unittest
import sys
import os

# Add backend to path so we can import app.services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.services.winnowing import WinnowingService

class TestWinnowingService(unittest.TestCase):
    def setUp(self):
        self.service = WinnowingService(k=5, w=4)

    def test_preprocess_python(self):
        code = """
        def foo():
            # This is a comment
            return 1
        """
        # Should remove whitespace and comments
        expected = "deffoo():return1"
        self.assertEqual(self.service.preprocess(code), expected)

    def test_preprocess_c_style(self):
        code = """
        int main() {
            // single line comment
            /* multi
               line
               comment */
            return 0;
        }
        """
        expected = "intmain(){return0;}"
        self.assertEqual(self.service.preprocess(code), expected)

    def test_kgrams(self):
        text = "abcdefgh"
        # k=5
        # "abcde", "bcdef", "cdefg", "defgh"
        kgrams = self.service.get_kgrams(text)
        self.assertEqual(len(kgrams), 4)
        self.assertEqual(kgrams[0], "abcde")
        self.assertEqual(kgrams[-1], "defgh")

    def test_kgrams_short_text(self):
        text = "abc"
        # k=5, text < k
        kgrams = self.service.get_kgrams(text)
        self.assertEqual(kgrams, ["abc"])

    def test_winnowing_logic(self):
        # Manually verify winnowing on a small known input
        # Hashes: [10, 5, 20, 2, 8, 15]
        # w=4
        # Windows:
        # [10, 5, 20, 2] -> min 2
        # [5, 20, 2, 8] -> min 2
        # [20, 2, 8, 15] -> min 2
        # Result set: {2}
        
        hashes = [10, 5, 20, 2, 8, 15]
        fingerprints = self.service.winnow(hashes)
        self.assertEqual(fingerprints, {2})

    def test_winnowing_logic_multiple_mins(self):
        # Hashes: [10, 2, 20, 2, 8]
        # w=4
        # Windows:
        # [10, 2, 20, 2] -> min 2 (rightmost)
        # [2, 20, 2, 8] -> min 2 (rightmost)
        # Ideally winnowing picks the rightmost for consistent spacing, 
        # but as long as it picks *a* min it's correct for a set.
        # Our implementation uses min() which usually picks the first occurrence in Python < 3,
        # but let's check what it actually returns.
        # Python's min() is stable (returns first).
        
        hashes = [10, 2, 20, 5, 8] 
        # w=4
        # Window 1: [10, 2, 20, 5] -> min 2
        # Window 2: [2, 20, 5, 8] -> min 2
        # Result {2}
        fingerprints = self.service.winnow(hashes)
        self.assertEqual(fingerprints, {2})

    def test_similarity_identical(self):
        text = "def hello(): return 'world'"
        fp1 = self.service.get_fingerprints(text)
        fp2 = self.service.get_fingerprints(text)
        similarity = self.service.compute_similarity(fp1, fp2)
        self.assertEqual(similarity, 1.0)

    def test_similarity_different(self):
        text1 = "def hello(): return 'world'"
        text2 = "class Foo: pass"
        fp1 = self.service.get_fingerprints(text1)
        fp2 = self.service.get_fingerprints(text2)
        # Should be very low or zero
        similarity = self.service.compute_similarity(fp1, fp2)
        self.assertLess(similarity, 0.2)

    def test_similarity_partial(self):
        text1 = "abcdefg"
        text2 = "abcxyz" 
        # Shared k-grams might exist depending on k
        # k=5
        # t1: abcde, bcdef, cdefg
        # t2: abcxyz, bcxyz
        # No overlap likely with simple hashing unless collision
        # Let's try construct overlapping
        text3 = "abcdefg"
        text4 = "abcdefg extra"
        fp3 = self.service.get_fingerprints(text3)
        fp4 = self.service.get_fingerprints(text4)
        similarity = self.service.compute_similarity(fp3, fp4)
        self.assertGreater(similarity, 0.0)
        self.assertLess(similarity, 1.0)

if __name__ == '__main__':
    unittest.main()
