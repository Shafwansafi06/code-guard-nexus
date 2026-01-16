import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mlAnalysisApi, SimilarityResponse } from '@/lib/api';
import { Loader2, GitCompare, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function SimilarityAnalysisPanel() {
    const [code1, setCode1] = useState('');
    const [code2, setCode2] = useState('');
    const [language, setLanguage] = useState('python');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SimilarityResponse | null>(null);
    const { toast } = useToast();

    const handleCompare = async () => {
        if (!code1.trim() || !code2.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter both code snippets to compare',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await mlAnalysisApi.computeSimilarity({
                code1: code1.trim(),
                code2: code2.trim(),
                language1: language,
                language2: language,
            });
            setResult(response);
            toast({
                title: 'Comparison Complete',
                description: 'Code snippets have been compared successfully',
            });
        } catch (error: any) {
            console.error('Comparison error:', error);
            toast({
                title: 'Comparison Failed',
                description: error.response?.data?.detail || 'Failed to compare code. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityColor = (score: number) => {
        if (score >= 0.8) return 'text-red-500';
        if (score >= 0.6) return 'text-orange-500';
        if (score >= 0.4) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Snippet A</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code1">Source Code</Label>
                            <Textarea
                                id="code1"
                                placeholder="Paste first code snippet here..."
                                value={code1}
                                onChange={(e) => setCode1(e.target.value)}
                                className="font-mono text-xs min-h-[300px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Snippet B</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code2">Source Code</Label>
                            <Textarea
                                id="code2"
                                placeholder="Paste second code snippet here..."
                                value={code2}
                                onChange={(e) => setCode2(e.target.value)}
                                className="font-mono text-xs min-h-[300px]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="language">Programming Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger id="language">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="java">Java</SelectItem>
                                    <SelectItem value="cpp">C++</SelectItem>
                                    <SelectItem value="go">Go</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleCompare}
                            disabled={loading}
                            className="w-full md:w-48 h-10"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <GitCompare className="w-4 h-4 mr-2" />
                            )}
                            {loading ? 'Comparing...' : 'Compare Snippets'}
                        </Button>
                    </div>

                    {result && (
                        <div className="mt-8 p-6 border rounded-xl bg-secondary/20 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        Analysis Result
                                        {result.is_suspicious ? (
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Based on semantic and structural analysis
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-4xl font-bold ${getSimilarityColor(result.similarity_score)}`}>
                                        {(result.similarity_score * 100).toFixed(1)}%
                                    </span>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        Similarity Score
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Plagiarism Risk</span>
                                    <span className={result.is_suspicious ? 'text-red-500' : 'text-green-500'}>
                                        {result.is_suspicious ? 'High Risk' : 'Low Risk'}
                                    </span>
                                </div>
                                <Progress
                                    value={result.similarity_score * 100}
                                    className={`h-2 ${result.is_suspicious ? 'bg-red-100' : 'bg-green-100'}`}
                                />
                            </div>

                            <div className="p-4 bg-background/50 rounded-lg border border-dashed text-sm space-y-2">
                                <p className="font-medium">Insights:</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {result.similarity_score > 0.8 ? (
                                        <li>Extremely high structural similarity detected. Likely direct code conversion or renaming.</li>
                                    ) : result.similarity_score > 0.6 ? (
                                        <li>Significant similarity found in algorithm structure and logic flow.</li>
                                    ) : (
                                        <li>Low similarity. The implementations appear to be independent.</li>
                                    )}
                                    <li>Comparison was performed using {language} language context.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
