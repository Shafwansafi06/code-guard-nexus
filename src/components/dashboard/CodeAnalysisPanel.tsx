import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIDetectionCard } from './AIDetectionCard';
import { mlAnalysisApi, AIDetectionResponse } from '@/lib/api';
import { Loader2, Code2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';

export function CodeAnalysisPanel() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDetectionResponse | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some code to analyze',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await mlAnalysisApi.detectAI({
        code: code.trim(),
        language,
      });
      setResult(response);
      toast({
        title: 'Analysis Complete',
        description: 'Code has been analyzed successfully',
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.response?.data?.detail || 'Failed to analyze code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleCode = `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Print first 10 fibonacci numbers
for i in range(10):
    print(fibonacci(i))`;

  const loadSample = () => {
    setCode(sampleCode);
    setLanguage('python');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="border-border/50 shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <CardDescription className="text-xs">
                  Analyze your source code for AI patterns
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="language" className="sr-only">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" className="w-[140px] h-8 text-xs bg-background/50 border-dashed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 relative min-h-[400px] border-y border-border/50">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                padding: { top: 16, bottom: 16 },
                automaticLayout: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>

          <div className="p-4 bg-muted/20 flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 rounded-full shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Analyzing Source...' : 'Execute Analysis'}
            </Button>
            <Button
              variant="outline"
              onClick={loadSample}
              className="rounded-full px-6"
            >
              Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <div className="space-y-4">
        {result ? (
          <AIDetectionCard detection={result} />
        ) : (
          <Card className="h-full flex items-center justify-center border-dashed border-2 bg-muted/5">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50 group">
                <div className="animate-pulse">
                  <Code2 className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Editor Ready</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Paste your code into the professional IDE on the left and click "Execute Analysis" to begin detection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
