import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, BatchCloneResponse, ClonePair } from '@/lib/api';
import { AlertCircle, Loader2, Users, FileText, AlertTriangle, FileCode } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { detectLanguage, getLanguageDisplayName } from '@/lib/languageDetection';

export function BatchPlagiarismDetector() {
  const [codes, setCodes] = useState<string[]>(['', '', '']);
  const [detectedLangs, setDetectedLangs] = useState<(string | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchCloneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.7);

  // Auto-detect language for each code snippet
  useEffect(() => {
    codes.forEach((code, index) => {
      if (code.trim().length > 50) {
        const timeout = setTimeout(() => {
          const detected = detectLanguage(code);
          setDetectedLangs(prev => {
            const newLangs = [...prev];
            newLangs[index] = detected?.language || null;
            return newLangs;
          });
        }, 500);
        return () => clearTimeout(timeout);
      }
    });
  }, [codes]);

  const handleCodeChange = (index: number, value: string) => {
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);
  };

  const addCodeInput = () => {
    setCodes([...codes, '']);
  };

  const removeCodeInput = (index: number) => {
    if (codes.length > 2) {
      setCodes(codes.filter((_, i) => i !== index));
    }
  };

  const handleDetect = async () => {
    const validCodes = codes.filter(code => code.trim());
    
    if (validCodes.length < 2) {
      setError('Please enter at least 2 code snippets');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.mlAnalysis.batchCloneDetection(validCodes, threshold);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to detect plagiarism');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: any = {
      high: 'destructive',
      medium: 'warning',
      low: 'secondary',
      none: 'default'
    };
    return <Badge variant={variants[level] || 'default'}>{level.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Batch Plagiarism Detection
          </CardTitle>
          <CardDescription>
            Compare multiple student submissions simultaneously to find potential plagiarism
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Threshold Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Similarity Threshold: {(threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={threshold * 100}
              onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Pairs with similarity above this threshold will be flagged as potential clones
            </p>
          </div>

          {/* Code Inputs */}
          <div className="space-y-4">
            {codes.map((code, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Submission {index + 1}
                  </label>
                  <div className="flex items-center gap-2">
                    {detectedLangs[index] && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {getLanguageDisplayName(detectedLangs[index]!)}
                      </Badge>
                    )}
                    {codes.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCodeInput(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  value={code}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  placeholder={`Paste submission ${index + 1} code here...`}
                  className="font-mono text-sm min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  {code.length} characters
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addCodeInput} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Add Submission
            </Button>
            <Button
              onClick={handleDetect}
              disabled={loading || codes.filter(c => c.trim()).length < 2}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Check All for Plagiarism'
              )}
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
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Found {result.clone_pairs_found} potential plagiarism case(s) out of {result.total_comparisons} comparisons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{result.summary.total_codes}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Clone Pairs</p>
                <p className="text-2xl font-bold text-destructive">
                  {result.clone_pairs_found}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Max Similarity</p>
                <p className="text-2xl font-bold">
                  {result.summary.max_similarity.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Similarity</p>
                <p className="text-2xl font-bold">
                  {result.summary.avg_similarity.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* High Risk Alert */}
            {result.summary.high_risk_pairs > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  ⚠️ {result.summary.high_risk_pairs} high-risk plagiarism case(s) detected! 
                  Immediate review recommended.
                </AlertDescription>
              </Alert>
            )}

            {/* Clone Pairs Table */}
            {result.clone_pairs.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead>Similarity</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.clone_pairs.map((pair: ClonePair, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          #{pair.code1_index + 1} ↔ #{pair.code2_index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold">
                              {(pair.similarity_score * 100).toFixed(1)}%
                            </div>
                            <Progress value={pair.similarity_score * 100} className="h-2 w-20" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {(pair.confidence * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(pair.risk_level)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {pair.risk_description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <AlertDescription className="font-medium">
                  ✓ No plagiarism detected above the {(threshold * 100).toFixed(0)}% threshold.
                  All submissions appear to be original.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
