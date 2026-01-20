import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlagiarismDetector } from '@/components/plagiarism/PlagiarismDetector';
import { BatchPlagiarismDetector } from '@/components/plagiarism/BatchPlagiarismDetector';
import { Code2, Users, Activity, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, CloneDetectorStatus } from '@/lib/api';

export default function PlagiarismPage() {
  const [activeTab, setActiveTab] = useState('single');

  // Fetch model status
  const { data: modelStatus } = useQuery<CloneDetectorStatus>({
    queryKey: ['clone-detector-status'],
    queryFn: () => api.mlAnalysis.getCloneDetectorStatus(),
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plagiarism Detection</h1>
          <p className="text-muted-foreground mt-2">
            Advanced AI-powered code plagiarism detection using ONNX-optimized deep learning
          </p>
        </div>
      </div>

      {/* Model Status */}
      {modelStatus && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Model Status</p>
                    <Badge variant="default" className="bg-green-500">
                      {modelStatus.status === 'loaded' ? 'Active' : modelStatus.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {modelStatus.backend?.toUpperCase()} backend • {modelStatus.inference_speed} inference
                  </p>
                </div>
              </div>
              
              {modelStatus.performance && (
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Accuracy</p>
                    <p className="font-semibold">
                      {typeof modelStatus.performance.accuracy === 'number' 
                        ? (modelStatus.performance.accuracy * 100).toFixed(1) + '%'
                        : modelStatus.performance.accuracy}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">F1 Score</p>
                    <p className="font-semibold">
                      {typeof modelStatus.performance.f1_score === 'number'
                        ? modelStatus.performance.f1_score.toFixed(2)
                        : modelStatus.performance.f1_score}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {modelStatus.recommendation && (
              <p className="mt-3 text-xs text-muted-foreground">
                {modelStatus.recommendation}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Pairwise Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare two code snippets to detect clones with semantic similarity analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Batch Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze multiple submissions simultaneously to find all plagiarism pairs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              High Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              88%+ accuracy with deep learning model trained on real code clone datasets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detection Tools */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Single Comparison
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Batch Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-6">
          <PlagiarismDetector />
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <BatchPlagiarismDetector />
        </TabsContent>
      </Tabs>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Our plagiarism detection system uses state-of-the-art AI technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🧠 Deep Learning Model</h4>
              <p className="text-sm text-muted-foreground">
                Uses a Siamese Neural Network based on CodeBERT, trained on BigCloneBench dataset
                with 50,000+ code pairs for accurate clone detection.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ ONNX Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Deployed with ONNX Runtime for 2x faster inference (~315ms per comparison)
                and 50% reduced memory usage compared to PyTorch.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Semantic Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Detects clones even when variable names change or code is refactored.
                Analyzes semantic similarity, not just text matching.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Risk Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Provides detailed risk levels (high/medium/low) and similarity scores
                to help prioritize manual review of suspicious submissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
