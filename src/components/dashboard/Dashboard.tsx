import { FileText, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { SimilarityPairCard } from './SimilarityPairCard';
import { NetworkGraph } from './NetworkGraph';
import { CodeEditorDialog } from './CodeEditorDialog';
import { CodeComparisonDialog } from './CodeComparisonDialog';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Assignment } from '@/lib/api';

interface DashboardProps {
  assignmentId?: string;
  assignment?: Assignment;
}

export function Dashboard({ assignmentId, assignment: initialAssignment }: DashboardProps) {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string>('');
  const [comparePair, setComparePair] = useState<{
    fileA: string,
    fileB: string,
    similarity: number,
    codeA?: string,
    codeB?: string
  } | null>(null);

  // Fetch submissions if assignmentId is provided
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => api.submissions.list(assignmentId),
    enabled: !!assignmentId,
  });

  // Fetch comparisons if assignmentId is provided
  const { data: comparisons, isLoading: loadingComparisons } = useQuery({
    queryKey: ['comparisons', assignmentId],
    queryFn: () => api.comparisons.getHighRisk(assignmentId!, 0.5), // Lower threshold for graph visualization
    enabled: !!assignmentId,
  });

  // Map submissions to nodes
  const nodes = useMemo(() => {
    if (!submissions) return [];
    return submissions.map(s => ({
      id: s.id,
      label: s.student_identifier,
      type: (s.status === 'processing' ? 'ai' :
        s.status === 'completed' ? 'independent' : 'original') as any
    }));
  }, [submissions]);

  // Map comparisons to edges
  const edges = useMemo(() => {
    if (!comparisons) return [];
    return comparisons.map(c => ({
      source: c.submission_a_id,
      target: c.submission_b_id,
      weight: c.similarity_score || 0
    }));
  }, [comparisons]);

  const handlePreview = async (filename: string, submissionId?: string) => {
    if (!submissionId) {
      setPreviewFile(filename);
      setPreviewCode('// No submission ID provided');
      return;
    }

    try {
      const content = await api.submissions.getContent(submissionId);
      setPreviewFile(filename);
      setPreviewCode(content.content || '// No content available');
    } catch (error) {
      console.error('Error loading code:', error);
      setPreviewFile(filename);
      setPreviewCode('// Failed to load code');
    }
  };

  const handleCompare = async (pair: any) => {
    try {
      // Fetch content for both submissions
      const [contentA, contentB] = await Promise.all([
        api.submissions.getContent(pair.submission_a_id),
        api.submissions.getContent(pair.submission_b_id)
      ]);

      setComparePair({
        fileA: pair.submission_a?.student_identifier || contentA.student_identifier || 'Unknown',
        fileB: pair.submission_b?.student_identifier || contentB.student_identifier || 'Unknown',
        similarity: Math.round((pair.similarity_score || 0) * 100),
        codeA: contentA.content || '// No content available',
        codeB: contentB.content || '// No content available'
      });
    } catch (error) {
      console.error('Error loading comparison:', error);
      // Fallback to placeholders if fetch fails
      setComparePair({
        fileA: pair.submission_a?.student_identifier || pair.fileA || 'Unknown',
        fileB: pair.submission_b?.student_identifier || pair.fileB || 'Unknown',
        similarity: Math.round((pair.similarity_score || pair.similarity || 0) * 100),
        codeA: '// Failed to load code',
        codeB: '// Failed to load code'
      });
    }
  };

  if (!assignmentId) {
    // Return placeholder or default view if no ID (for general dashboard)
    return null;
  }

  if (loadingSubmissions || loadingComparisons) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Analysis Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time insights into code similarity patterns and AI detection results
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            icon={FileText}
            label="Total Submissions"
            value={submissions?.length || 0}
            sublabel="recorded"
            variant="default"
            delay={0}
          />
          <StatCard
            icon={AlertTriangle}
            label="High Risk"
            value={comparisons?.filter(c => (c.similarity_score || 0) >= 0.8).length || 0}
            sublabel="detected"
            variant="danger"
            delay={100}
          />
          <StatCard
            icon={AlertCircle}
            label="Medium Risk"
            value={comparisons?.filter(c => (c.similarity_score || 0) < 0.8 && (c.similarity_score || 0) >= 0.5).length || 0}
            sublabel="detected"
            variant="warning"
            delay={200}
          />
          <StatCard
            icon={CheckCircle}
            label="Clean"
            value={(submissions?.length || 0) - (comparisons?.length || 0)}
            sublabel="no match"
            variant="success"
            delay={300}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Network Graph */}
          <div className="lg:col-span-3">
            <NetworkGraph nodes={nodes} edges={edges} />
          </div>

          {/* Suspicious Pairs List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Detected Conflicts
              </h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {comparisons?.map((pair, index) => (
                <SimilarityPairCard
                  key={pair.id}
                  fileA={pair.submission_a?.student_identifier || 'Unknown'}
                  fileB={pair.submission_b?.student_identifier || 'Unknown'}
                  similarity={Math.round((pair.similarity_score || 0) * 100)}
                  matches={[]}
                  index={index}
                  onPreview={(filename) => handlePreview(filename, pair.submission_a_id)}
                  onCompare={() => handleCompare(pair)}
                />
              ))}
              {(!comparisons || comparisons.length === 0) && (
                <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-muted-foreground text-sm">No similarity conflicts detected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <CodeEditorDialog
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          filename={previewFile || ''}
          code={previewCode}
          language={previewFile?.endsWith('.py') ? 'python' : 'cpp'}
        />

        <CodeComparisonDialog
          open={!!comparePair}
          onOpenChange={(open) => !open && setComparePair(null)}
          fileA={comparePair?.fileA || ''}
          fileB={comparePair?.fileB || ''}
          codeA={comparePair?.codeA || ''}
          codeB={comparePair?.codeB || ''}
          similarity={comparePair?.similarity || 0}
        />
      </div>
    </section>
  );
}
