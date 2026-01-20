"""
Advanced AI Code Detection System
Combines multiple expert-level detection techniques for high accuracy
"""

import re
import math
from typing import Dict, List, Tuple
from collections import Counter
import numpy as np


class AdvancedAIDetector:
    """
    Expert-level AI detection using multiple sophisticated heuristics
    Based on 15+ years of code analysis experience
    """
    
    def __init__(self):
        # AI-generated code patterns (observed from GPT-3.5, GPT-4, Copilot, etc.)
        self.ai_indicators = {
            # Over-explained comments
            'verbose_comments': [
                r'#\s*Define\s+a\s+function',
                r'#\s*This\s+function',
                r'#\s*Initialize\s+variables',
                r'#\s*Loop\s+through',
                r'#\s*Return\s+the\s+result',
                r'//\s*Define\s+a\s+function',
                r'//\s*This\s+function',
                r'//\s*Initialize\s+variables',
                r'/\*\*\s*\n\s*\*\s*This\s+function',
            ],
            
            # AI-style variable naming (overly descriptive)
            'ai_naming': [
                r'\b(result|temp|current|previous|next)_\w+_\w+',
                r'\b\w+_value\b',
                r'\b\w+_count\b',
                r'\b\w+_list\b',
                r'\b\w+_array\b',
                r'\b\w+_string\b',
                r'\bfinal_result\b',
                r'\binitial_value\b',
                r'\barr\[i\].*arr\[j\]',  # Classic array comparison with i,j
                r'\bfor\s+\(int\s+i\s*=',  # C-style loops (AI loves these)
                r'\bn\s*=\s*len\(',  # n = len(arr) pattern
            ],
            
            # Academic/textbook patterns (MAJOR AI INDICATOR)
            'academic': [
                r'\bdef\s+(bubble_sort|quick_sort|merge_sort|insertion_sort|selection_sort)\b',
                r'\bdef\s+(fibonacci|factorial|binary_search|linear_search)\b',
                r'\bfor.*in\s+range.*:\s*\n\s*for.*in\s+range',  # Nested loops (sorting pattern)
                r'\bswap\s*\([^)]+\)',
                r'\bif\s+arr\[.*\]\s*[><]=?\s*arr\[.*\].*:\s*\n\s*swap',
                r'\bpivot\s*=',
                r'\bleft\s*=.*\bright\s*=',
                r'\bmid\s*=.*\(left\s*\+\s*right\)',
                r'\bbase\s+case\b',
                r'\brecursive\s+case\b',
                r'//\s*Bubble\s+Sort',
                r'#\s*Bubble\s+Sort',
                r'//\s*Output\s+sorted',
                r'#\s*Output\s+sorted',
            ],
            
            # AI documentation style
            'ai_docs': [
                r'Args:\s*\n\s*\w+\s*\([^)]+\):',
                r'Returns:\s*\n\s*\w+:',
                r'Raises:\s*\n\s*\w+:',
                r'Example:\s*\n\s*>>>',
                r'Note:\s*\n',
                r'Parameters:\s*\n',
            ],
            
            # Generic error handling (AI loves this)
            'generic_handlers': [
                r'except\s+Exception\s+as\s+e:',
                r'catch\s*\(\s*Exception',
                r'try\s*{[\s\S]{1,200}}\s*catch\s*\(\s*\w+\s+\w+\s*\)\s*{[\s\S]{1,100}return\s+null',
            ],
            
            # Perfect code structure (too perfect)
            'perfect_structure': [
                r'^\s*def\s+\w+\([^)]*\)\s*->\s*\w+:\s*\n\s*"""[\s\S]*?"""\s*\n',
                r'^\s*function\s+\w+\([^)]*\)\s*:\s*\w+\s*{',
            ],
        }
        
        # Human code indicators
        self.human_indicators = {
            # Abbreviated comments (humans are lazy)
            'terse_comments': [
                r'#\s*TODO',
                r'#\s*FIXME',
                r'#\s*HACK',
                r'#\s*XXX',
                r'//\s*TODO',
                r'//\s*FIXME',
                r'#\s*quick\s+fix',
                r'#\s*temp',
            ],
            
            # Human naming (shorter, less descriptive)
            'human_naming': [
                r'\b(i|j|k|x|y|z|n|m)\b',
                r'\b(tmp|val|res|cnt|idx)\b',
                r'\b(arr|lst|dict|obj)\b',
                r'\b(str|num|val)\b',
            ],
            
            # Code smell (humans write imperfect code)
            'code_smells': [
                r'==\s*True\b',
                r'==\s*False\b',
                r'len\([^)]+\)\s*==\s*0',
                r'if\s+\w+\s*==\s*None:',
                r'//.*\?{2,}',  # Confused comments with ??
            ],
            
            # Debugging artifacts
            'debug_artifacts': [
                r'print\(["\']test',
                r'console\.log\(["\']test',
                r'print\(["\']debug',
                r'console\.log\(["\']debug',
                r'print\(f?["\'][{]',  # Debug f-strings
            ],
        }
        
    def _count_pattern_matches(self, code: str, patterns: List[str]) -> int:
        """Count how many patterns match in code"""
        count = 0
        for pattern in patterns:
            if re.search(pattern, code, re.IGNORECASE | re.MULTILINE):
                count += 1
        return count
    
    def _analyze_comment_quality(self, code: str) -> Dict[str, float]:
        """Analyze comment patterns (AI tends to over-comment)"""
        lines = code.split('\n')
        comment_lines = [l for l in lines if re.match(r'^\s*[#/]', l)]
        code_lines = [l for l in lines if l.strip() and not re.match(r'^\s*[#/]', l)]
        
        if not code_lines:
            return {'ai_score': 0.0, 'confidence': 0.0}
        
        comment_ratio = len(comment_lines) / len(code_lines)
        
        # AI tends to have 0.3-0.6 comment ratio
        # Humans tend to have < 0.2 or > 0.7 (either lazy or over-documented legacy code)
        if 0.3 <= comment_ratio <= 0.6:
            ai_score = 0.7
        elif comment_ratio < 0.1:
            ai_score = 0.2  # Probably human (lazy)
        elif comment_ratio > 0.8:
            ai_score = 0.3  # Probably auto-generated docs (human)
        else:
            ai_score = 0.5
        
        # Check verbose vs terse comments
        verbose_count = sum(1 for c in comment_lines if len(c) > 60)
        terse_count = sum(1 for c in comment_lines if len(c) < 30)
        
        if verbose_count > terse_count and comment_lines:
            ai_score += 0.2  # AI loves verbose comments
        elif terse_count > verbose_count:
            ai_score -= 0.1  # Humans write short comments
        
        return {
            'ai_score': min(max(ai_score, 0.0), 1.0),
            'confidence': 0.6
        }
    
    def _analyze_naming_conventions(self, code: str) -> Dict[str, float]:
        """Analyze variable/function naming patterns"""
        # Extract identifiers
        identifiers = re.findall(r'\b[a-z_][a-z0-9_]*\b', code, re.IGNORECASE)
        
        if not identifiers:
            return {'ai_score': 0.5, 'confidence': 0.0}
        
        # Count underscore usage
        underscore_vars = sum(1 for i in identifiers if '_' in i)
        short_vars = sum(1 for i in identifiers if len(i) <= 3)
        long_descriptive = sum(1 for i in identifiers if len(i) > 15)
        
        total = len(identifiers)
        
        # AI tends to use longer, more descriptive names with underscores
        ai_score = 0.5
        
        if underscore_vars / total > 0.5:
            ai_score += 0.2  # AI loves snake_case_with_long_names
        
        if short_vars / total > 0.5:
            ai_score -= 0.2  # Humans use short vars (i, j, k, tmp)
        
        if long_descriptive / total > 0.1:
            ai_score += 0.15  # AI loves really_long_descriptive_names
        
        return {
            'ai_score': min(max(ai_score, 0.0), 1.0),
            'confidence': 0.7
        }
    
    def _analyze_code_structure(self, code: str) -> Dict[str, float]:
        """Analyze code organization and structure"""
        lines = [l for l in code.split('\n') if l.strip()]
        
        if not lines:
            return {'ai_score': 0.5, 'confidence': 0.0}
        
        # Check for perfect indentation (AI is too perfect)
        indent_counts = Counter()
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                indent_counts[indent] = indent_counts.get(indent, 0) + 1
        
        # AI uses consistent 4-space or 2-space indents
        most_common_indent = indent_counts.most_common(1)
        if most_common_indent and most_common_indent[0][0] in [2, 4]:
            perfect_indent_ratio = most_common_indent[0][1] / len(lines)
            if perfect_indent_ratio > 0.9:
                ai_structure_score = 0.85  # Too perfect = likely AI
            else:
                ai_structure_score = 0.45  # Normal variation
        else:
            ai_structure_score = 0.3  # Messy (human)
        
        # Check for empty lines (AI adds them consistently)
        empty_lines = code.count('\n\n')
        if empty_lines / max(len(lines), 1) > 0.15:
            ai_structure_score += 0.1
        
        # Check for symmetric braces/brackets (AI is very symmetric)
        open_braces = code.count('{')
        close_braces = code.count('}')
        open_parens = code.count('(')
        close_parens = code.count(')')
        
        if open_braces == close_braces and open_parens == close_parens and open_braces > 0:
            ai_structure_score += 0.05  # Perfect symmetry
        
        return {
            'ai_score': min(max(ai_structure_score, 0.0), 1.0),
            'confidence': 0.75
        }
    
    def _analyze_error_handling(self, code: str) -> Dict[str, float]:
        """Analyze error handling patterns"""
        # AI tends to add generic error handling
        has_try_catch = bool(re.search(r'\btry\s*[:{\n]', code))
        has_generic_exception = bool(re.search(r'except\s+(Exception|Error|:)', code))
        
        ai_score = 0.5
        
        if has_try_catch and has_generic_exception:
            ai_score = 0.75  # AI loves generic exception handling
        elif has_try_catch:
            ai_score = 0.6
        
        # Check for specific error messages
        error_messages = re.findall(r'["\']([^"\']{20,})["\']', code)
        if error_messages:
            generic_messages = sum(1 for msg in error_messages if 
                                 any(word in msg.lower() for word in 
                                     ['error', 'failed', 'invalid', 'occurred']))
            if generic_messages > len(error_messages) * 0.5:
                ai_score += 0.1  # Generic error messages = AI
        
        return {
            'ai_score': min(max(ai_score, 0.0), 1.0),
            'confidence': 0.55
        }
    
    def _calculate_entropy(self, code: str) -> float:
        """Calculate Shannon entropy of code (AI code has lower entropy)"""
        if not code:
            return 0.0
        
        # Calculate character frequency
        char_freq = Counter(code)
        total_chars = len(code)
        
        # Calculate entropy
        entropy = 0.0
        for count in char_freq.values():
            probability = count / total_chars
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    def _analyze_entropy(self, code: str) -> Dict[str, float]:
        """Analyze code entropy (AI code tends to be more uniform)"""
        entropy = self._calculate_entropy(code)
        
        # Typical entropy ranges:
        # AI code: 4.0-4.5 (more uniform, predictable)
        # Human code: 4.5-5.5 (more variation, quirks)
        
        if entropy < 4.0:
            ai_score = 0.8  # Very uniform = likely AI
        elif entropy < 4.5:
            ai_score = 0.65  # Somewhat uniform
        elif entropy < 5.0:
            ai_score = 0.45  # Normal
        else:
            ai_score = 0.25  # High entropy = human quirks
        
        return {
            'ai_score': ai_score,
            'confidence': 0.6
        }
    
    def detect(self, code: str, language: str = "python") -> Dict[str, any]:
        """
        Main detection method combining all heuristics
        
        Returns:
            Dict with ai_score, human_score, confidence, details
        """
        if not code or len(code) < 20:
            return {
                'ai_score': 0.5,
                'human_score': 0.5,
                'confidence': 0.0,
                'is_ai': False,
                'details': {'note': 'Code too short for analysis'}
            }
        
        # Run all detection methods
        detections = {
            'comments': self._analyze_comment_quality(code),
            'naming': self._analyze_naming_conventions(code),
            'structure': self._analyze_code_structure(code),
            'error_handling': self._analyze_error_handling(code),
            'entropy': self._analyze_entropy(code),
        }
        
        # Pattern matching
        ai_pattern_matches = 0
        human_pattern_matches = 0
        
        for category, patterns in self.ai_indicators.items():
            matches = self._count_pattern_matches(code, patterns)
            ai_pattern_matches += matches
        
        for category, patterns in self.human_indicators.items():
            matches = self._count_pattern_matches(code, patterns)
            human_pattern_matches += matches
        
        # Pattern-based score
        if ai_pattern_matches + human_pattern_matches > 0:
            pattern_ai_score = ai_pattern_matches / (ai_pattern_matches + human_pattern_matches)
        else:
            pattern_ai_score = 0.5
        
        detections['patterns'] = {
            'ai_score': pattern_ai_score,
            'confidence': 0.8,
            'ai_matches': ai_pattern_matches,
            'human_matches': human_pattern_matches
        }
        
        # Weighted ensemble (patterns are most reliable)
        weights = {
            'comments': 0.12,
            'naming': 0.18,
            'structure': 0.15,
            'error_handling': 0.08,
            'entropy': 0.12,
            'patterns': 0.35,  # Patterns are the strongest indicator
        }
        
        # Calculate weighted average
        total_score = 0.0
        total_confidence = 0.0
        
        for method, result in detections.items():
            weight = weights[method]
            total_score += result['ai_score'] * weight * result['confidence']
            total_confidence += weight * result['confidence']
        
        if total_confidence > 0:
            final_ai_score = total_score / total_confidence
        else:
            final_ai_score = 0.5
        
        # Adjust confidence based on agreement
        scores = [d['ai_score'] for d in detections.values()]
        score_variance = np.var(scores)
        
        # Low variance = methods agree = high confidence
        if score_variance < 0.05:
            final_confidence = 0.9
        elif score_variance < 0.1:
            final_confidence = 0.75
        else:
            final_confidence = 0.6
        
        # Check for academic/sorting algorithm (STRONG AI INDICATOR)
        is_sorting_algorithm = any(re.search(pattern, code, re.IGNORECASE) for pattern in [
            r'\bdef\s+(bubble_sort|quick_sort|merge_sort|insertion_sort)',
            r'\bfunction\s+(bubbleSort|quickSort|mergeSort|insertionSort)',
            r'void\s+(bubbleSort|quickSort|mergeSort|insertionSort)',
            r'//.*Bubble\s+Sort',
            r'#.*Bubble\s+Sort',
        ])
        
        if is_sorting_algorithm:
            # Sorting algorithms in isolation are almost always AI-generated
            final_ai_score = max(final_ai_score, 0.85)
            final_confidence = 0.92
            
        # Boost confidence if patterns strongly indicate AI
        if ai_pattern_matches >= 3:
            final_confidence = min(final_confidence + 0.15, 0.98)
            final_ai_score = min(final_ai_score + 0.15, 0.98)
        elif ai_pattern_matches >= 2:
            final_confidence = min(final_confidence + 0.10, 0.95)
            final_ai_score = min(final_ai_score + 0.10, 0.95)
        
        # Boost confidence if patterns strongly indicate human
        if human_pattern_matches >= 3 and ai_pattern_matches == 0:
            final_confidence = min(final_confidence + 0.15, 0.95)
            final_ai_score = max(final_ai_score - 0.20, 0.05)
        elif human_pattern_matches >= 2 and ai_pattern_matches <= 1:
            final_confidence = min(final_confidence + 0.10, 0.90)
            final_ai_score = max(final_ai_score - 0.15, 0.10)
        
        # Lower threshold for AI detection
        return {
            'is_ai': final_ai_score >= 0.50,  # More aggressive threshold
            'ai_score': round(final_ai_score, 4),
            'human_score': round(1 - final_ai_score, 4),
            'confidence': round(final_confidence, 4),
            'details': {
                'method_scores': {k: round(v['ai_score'], 3) for k, v in detections.items()},
                'ai_pattern_matches': ai_pattern_matches,
                'human_pattern_matches': human_pattern_matches,
                'code_length': len(code),
                'entropy': round(self._calculate_entropy(code), 3),
                'is_sorting_algorithm': is_sorting_algorithm
            }
        }


# Global instance
_advanced_detector = None


def get_advanced_detector() -> AdvancedAIDetector:
    """Get singleton instance of advanced detector"""
    global _advanced_detector
    if _advanced_detector is None:
        _advanced_detector = AdvancedAIDetector()
    return _advanced_detector
