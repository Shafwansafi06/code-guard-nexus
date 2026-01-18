import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, RefreshCw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AssignmentResults() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => assignmentsApi.get(id!),
    enabled: !!id,
  });

  const handleExport = () => {
    if (!assignment) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assignment, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `assignment_${id}_report.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ title: "Report Exported", description: "Assignment data has been exported." });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading assignment results...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to={`/courses/${assignment?.course_id || ''}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </Link>
            <h1 className="text-2xl font-bold">{assignment?.name || 'Untitled Assignment'}</h1>
            <p className="text-muted-foreground">
              {assignment?.status === 'completed' ? 'Analyzed' : 'Analysis ' + assignment?.status} • {assignment?.submission_count || 0} submissions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Re-scan</Button>
            <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
            <Button variant="hero" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> Export Report</Button>
          </div>
        </div>

        <div className="-mx-8">
          <DashboardComponent assignmentId={id} assignment={assignment} />
        </div>
      </div>
    </DashboardLayout>
  );
}
