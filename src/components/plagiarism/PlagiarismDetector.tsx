import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, CloneDetectionResponse } from '@/lib/api';
import { AlertCircle, CheckCircle, XCircle, Loader2, Code2, AlertTriangle, FileCode } from 'lucide-react';
import { detectLanguage, getLanguageDisplayName } from '@/lib/languageDetection';

export function PlagiarismDetector() {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [detectedLang1, setDetectedLang1] = useState<string | null>(null);
  const [detectedLang2, setDetectedLang2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CloneDetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect language as user types (debounced)
  useEffect(() => {
    if (code1.trim().length > 50) {
      const timeout = setTimeout(() => {
        const detected = detectLanguage(code1);
        setDetectedLang1(detected?.language || null);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setDetectedLang1(null);
    }
  }, [code1]);

  useEffect(() => {
    if (code2.trim().length > 50) {
      const timeout = setTimeout(() => {
        const detected = detectLanguage(code2);
        setDetectedLang2(detected?.language || null);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setDetectedLang2(null);
    }
  }, [code2]);

  const handleDetect = async () => {
    if (!code1.trim() || !code2.trim()) {
      setError('Please enter both code snippets');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.mlAnalysis.detectClone({
        code1,
        code2,
        threshold: 0.5
      });
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to detect plagiarism');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode1('');
    setCode2('');
    setResult(null);
    setError(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Code Plagiarism Detector
          </CardTitle>
          <CardDescription>
            Compare two code snippets to detect potential plagiarism using our ONNX-powered AI model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Code Snippet 1</label>
                {detectedLang1 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileCode className="h-3 w-3" />
                    {getLanguageDisplayName(detectedLang1)}
                  </Badge>
                )}
              </div>
              <Textarea
                value={code1}
                onChange={(e) => setCode1(e.target.value)}
                placeholder="Paste first code snippet here..."
                className="font-mono text-sm min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground">
                {code1.length} characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Code Snippet 2</label>
                {detectedLang2 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileCode className="h-3 w-3" />
                    {getLanguageDisplayName(detectedLang2)}
                  </Badge>
                )}
              </div>
              <Textarea
                value={code2}
                onChange={(e) => setCode2(e.target.value)}
                placeholder="Paste second code snippet here..."
                className="font-mono text-sm min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground">
                {code2.length} characters
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDetect}
              disabled={loading || !code1.trim() || !code2.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Check for Plagiarism'
              )}
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={`border-2 ${
          result.risk_level === 'high' ? 'border-destructive' :
          result.risk_level === 'medium' ? 'border-yellow-500' :
          result.risk_level === 'low' ? 'border-blue-500' :
          'border-green-500'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getRiskIcon(result.risk_level)}
                Analysis Results
              </span>
              <Badge variant={getRiskColor(result.risk_level) as any}>
                {result.risk_level.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Similarity Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Similarity Score</span>
                <span className="text-2xl font-bold">
                  {(result.similarity_score * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={result.similarity_score * 100} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {result.risk_description}
              </p>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Clone Probability</p>
                <p className="text-lg font-semibold">
                  {(result.clone_probability * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold">
                  {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Is Clone</p>
                <p className="text-lg font-semibold">
                  {result.is_clone ? (
                    <span className="text-destructive">Yes</span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Threshold Used</p>
                <p className="text-lg font-semibold">
                  {(result.threshold * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Verdict */}
            {result.is_clone && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  ⚠️ Potential plagiarism detected! These code snippets appear to be clones.
                  Manual review is recommended.
                </AlertDescription>
              </Alert>
            )}

            {!result.is_clone && result.similarity_score < 40 && (
              <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  ✓ No significant plagiarism detected. The code snippets appear to be original.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
