/**
 * Language Detection Utility
 * Detects programming language from file extensions and code content
 */

// File extension to language mapping
const EXTENSION_MAP: Record<string, string> = {
  // Web Languages
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  
  // Backend Languages
  'py': 'python',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'h': 'c',
  'hpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'swift': 'swift',
  'kt': 'kotlin',
  'scala': 'scala',
  'r': 'r',
  'pl': 'perl',
  'lua': 'lua',
  
  // Shell & Config
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'ps1': 'powershell',
  'sql': 'sql',
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'toml': 'toml',
  'ini': 'ini',
  'md': 'markdown',
  'txt': 'plaintext',
};

// Language keywords for content-based detection
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  python: [
    /\bdef\s+\w+\s*\(/,
    /\bclass\s+\w+:/,
    /\bimport\s+\w+/,
    /\bfrom\s+\w+\s+import/,
    /\bprint\s*\(/,
  ],
  javascript: [
    /\bfunction\s+\w+\s*\(/,
    /\bconst\s+\w+\s*=/,
    /\blet\s+\w+\s*=/,
    /\bvar\s+\w+\s*=/,
    /\bconsole\.log\(/,
    /\b(async|await)\b/,
  ],
  typescript: [
    /\binterface\s+\w+/,
    /\btype\s+\w+\s*=/,
    /:\s*(string|number|boolean|any)\b/,
    /\bas\s+(string|number|boolean|any)\b/,
  ],
  java: [
    /\bpublic\s+class\s+\w+/,
    /\bprivate\s+(static\s+)?void\s+\w+\s*\(/,
    /\bSystem\.out\.println\(/,
    /\bimport\s+java\./,
    /\bpublic\s+static\s+void\s+main/,
  ],
  cpp: [
    /\b#include\s*<\w+>/,
    /\bstd::/,
    /\bcout\s*<</, 
    /\bcin\s*>>/,
    /\bnamespace\s+\w+/,
  ],
  c: [
    /\b#include\s*<\w+\.h>/,
    /\bprintf\s*\(/,
    /\bscanf\s*\(/,
    /\bmain\s*\(\s*(void|int)?\s*\)/,
  ],
  csharp: [
    /\busing\s+System/,
    /\bnamespace\s+\w+/,
    /\bpublic\s+class\s+\w+/,
    /\bConsole\.WriteLine\(/,
  ],
  ruby: [
    /\bdef\s+\w+/,
    /\bclass\s+\w+/,
    /\bend\b/,
    /\brequire\s+['"]/, 
    /\bputs\s/,
  ],
  php: [
    /<\?php/,
    /\$\w+\s*=/,
    /\bfunction\s+\w+\s*\(/,
    /\becho\s/,
  ],
  go: [
    /\bpackage\s+\w+/,
    /\bfunc\s+\w+\s*\(/,
    /\bimport\s+\(/,
    /\bfmt\.Print/,
  ],
  rust: [
    /\bfn\s+\w+\s*\(/,
    /\blet\s+mut\s+\w+/,
    /\bimpl\s+\w+/,
    /\bprintln!\(/,
  ],
};

/**
 * Detect language from filename extension
 */
export function detectLanguageFromFilename(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  return EXTENSION_MAP[extension] || null;
}

/**
 * Detect language from code content
 */
export function detectLanguageFromContent(code: string): string | null {
  if (!code || code.trim().length === 0) return null;
  
  // Count matches for each language
  const scores: Record<string, number> = {};
  
  for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        score++;
      }
    }
    if (score > 0) {
      scores[language] = score;
    }
  }
  
  // Return language with highest score
  if (Object.keys(scores).length === 0) return null;
  
  const sortedLanguages = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);
  
  return sortedLanguages[0][0];
}

/**
 * Detect language with confidence score
 */
export function detectLanguage(
  code: string,
  filename?: string
): { language: string; confidence: 'high' | 'medium' | 'low' } | null {
  // Try filename first (most reliable)
  if (filename) {
    const langFromFile = detectLanguageFromFilename(filename);
    if (langFromFile) {
      return { language: langFromFile, confidence: 'high' };
    }
  }
  
  // Try content detection
  const langFromContent = detectLanguageFromContent(code);
  if (langFromContent) {
    return { language: langFromContent, confidence: 'medium' };
  }
  
  return null;
}

/**
 * Get display name for language
 */
export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    r: 'R',
    perl: 'Perl',
    lua: 'Lua',
    shell: 'Shell',
    powershell: 'PowerShell',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    markdown: 'Markdown',
    plaintext: 'Plain Text',
  };
  
  return displayNames[language.toLowerCase()] || language;
}

/**
 * Check if language is supported for plagiarism detection
 */
export function isSupportedLanguage(language: string): boolean {
  const supported = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 
    'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'
  ];
  
  return supported.includes(language.toLowerCase());
}
