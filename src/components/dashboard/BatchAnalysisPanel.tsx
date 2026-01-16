import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mlAnalysisApi } from '@/lib/api';
import { Loader2, Upload, FileCode, CheckCircle, AlertCircle, Trash2, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BatchFile {
    id: string;
    name: string;
    content: string;
    language: string;
    status: 'pending' | 'analyzing' | 'completed' | 'failed';
    result?: any;
}

export function BatchAnalysisPanel() {
    const [files, setFiles] = useState<BatchFile[]>([]);
    const [language, setLanguage] = useState('python');
    const [analyzing, setAnalyzing] = useState(false);
    const { toast } = useToast();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles) return;

        const newFiles: BatchFile[] = [];
        Array.from(uploadedFiles).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setFiles((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        content: content,
                        language: language,
                        status: 'pending',
                    },
                ]);
            };
            reader.readAsText(file);
        });
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const runBatchAnalysis = async () => {
        if (files.length === 0) {
            toast({
                title: 'Error',
                description: 'Please upload files to analyze',
                variant: 'destructive',
            });
            return;
        }

        setAnalyzing(true);
        setFiles((prev) => prev.map((f) => ({ ...f, status: 'analyzing' })));

        try {
            const codes = files.map((f) => f.content);
            const languages = files.map(() => language);

            const response = await mlAnalysisApi.batchAnalysis(codes, languages);

            setFiles((prev) =>
                prev.map((f, index) => ({
                    ...f,
                    status: 'completed',
                    result: response.results[index],
                }))
            );

            toast({
                title: 'Batch Analysis Complete',
                description: `Successfully analyzed ${files.length} files`,
            });
        } catch (error) {
            console.error('Batch analysis error:', error);
            setFiles((prev) => prev.map((f) => ({ ...f, status: 'failed' })));
            toast({
                title: 'Batch Analysis Failed',
                description: 'Failed to process batch. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-green-500';
        }
    };

    const stats = {
        total: files.length,
        ai: files.filter(f => f.result?.ai_detection?.is_ai).length,
        human: files.filter(f => f.result && !f.result?.ai_detection?.is_ai).length,
        avgScore: files.length > 0
            ? files.reduce((acc, f) => acc + (f.result?.ai_detection?.ai_score || 0), 0) / files.length
            : 0
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Files
                    </CardTitle>
                    <CardDescription>
                        Select multiple source files for bulk AI detection analysis
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
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
                        <div className="flex-1 w-full">
                            <Label
                                htmlFor="file-upload"
                                className="flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                            >
                                <FileCode className="w-4 h-4" />
                                Select Files
                            </Label>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <Button
                            className="w-full md:w-48"
                            onClick={runBatchAnalysis}
                            disabled={analyzing || files.length === 0}
                        >
                            {analyzing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Brain className="w-4 h-4 mr-2" />
                            )}
                            {analyzing ? 'Analyzing...' : 'Run Analysis'}
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-4 bg-secondary/10">
                        {files.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                No files selected yet.
                            </p>
                        ) : (
                            files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-2 bg-background border rounded-md">
                                    <div className="flex items-center gap-3">
                                        <FileCode className="w-4 h-4 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{language}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {file.status === 'analyzing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                        {file.status === 'completed' && file.result && (
                                            <Badge variant={file.result.ai_detection.is_ai ? "destructive" : "secondary"} className="text-[10px]">
                                                {file.result.ai_detection.is_ai ? "AI" : "Human"} ({(file.result.ai_detection.ai_score * 100).toFixed(0)}%)
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => removeFile(file.id)}
                                            disabled={analyzing}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {files.some(f => f.status === 'completed') && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Total Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">AI Flagged</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{stats.ai}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Human Verified</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.human}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm">Avg AI Score</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-bold">{(stats.avgScore * 100).toFixed(1)}%</div>
                            <Progress value={stats.avgScore * 100} className="h-1 bg-secondary" />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
