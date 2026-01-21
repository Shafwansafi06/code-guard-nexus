import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CodeAnalysisPanel } from '@/components/dashboard/CodeAnalysisPanel';
import { SimilarityAnalysisPanel } from '@/components/dashboard/SimilarityAnalysisPanel';
import { BatchAnalysisPanel } from '@/components/dashboard/BatchAnalysisPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, GitCompare, Shield } from 'lucide-react';

export default function MLAnalysis() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">ML-Powered Code Analysis</h1>
          <p className="text-muted-foreground">
            Advanced AI detection and code similarity analysis using our trained machine learning model
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                Model Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">CodeBERT</p>
                <p className="text-xs text-muted-foreground">
                  AUC: 0.96 • 96% accuracy
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Detection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-500">Active</p>
                <p className="text-xs text-muted-foreground">
                  Real-time AI detection enabled
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-500" />
                Similarity Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-purple-500">Ready</p>
                <p className="text-xs text-muted-foreground">
                  Contrastive learning enabled
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-detection" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ai-detection">AI Detection</TabsTrigger>
            <TabsTrigger value="similarity">Code Similarity</TabsTrigger>
            <TabsTrigger value="batch">Batch Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-detection" className="space-y-4">
            <CodeAnalysisPanel />
          </TabsContent>

          <TabsContent value="similarity" className="space-y-4">
            <SimilarityAnalysisPanel />
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <BatchAnalysisPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
