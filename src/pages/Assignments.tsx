import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MoreVertical,
  Filter,
  Calendar,
  Brain,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';



export default function Assignments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignmentsData = [], isLoading } = useQuery({
    queryKey: ['assignments', filterStatus],
    queryFn: () => assignmentsApi.list(undefined, filterStatus === 'all' ? undefined : filterStatus),
  });

  const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: "Deleted", description: "Assignment removed successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete assignment",
        variant: "destructive"
      });
    }
  });

  const startAnalysisMutation = useMutation({
    mutationFn: (id: string) => assignmentsApi.startAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: "Analysis Started", description: "The detection engine is now processing files." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to start analysis",
        variant: "destructive"
      });
    }
  });

  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch = assignment.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskLevel = (plagiarismCases: number, total: number) => {
    if (total === 0) return { label: 'Not Analyzed', color: 'text-muted-foreground' };
    const percentage = (plagiarismCases / total) * 100;
    if (percentage >= 20) return { label: 'High Risk', color: 'text-destructive' };
    if (percentage >= 10) return { label: 'Medium Risk', color: 'text-warning' };
    return { label: 'Low Risk', color: 'text-success' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assignments</h1>
            <p className="text-muted-foreground">
              Manage and review all assignment submissions for plagiarism detection.
            </p>
          </div>
          <Link to="/assignments/new">
            <Button variant="hero" className="gap-2">
              <Plus className="w-4 h-4" />
              New Assignment Scan
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-xs text-destructive">-8%</span>
            </div>
            <p className="text-2xl font-bold">23</p>
            <p className="text-sm text-muted-foreground">Plagiarism Cases</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-5 h-5 text-accent" />
              <span className="text-xs text-warning">+15%</span>
            </div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">AI-Generated</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-success" />
              <span className="text-xs text-success">+22%</span>
            </div>
            <p className="text-2xl font-bold">127h</p>
            <p className="text-sm text-muted-foreground">Time Saved</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
              size="sm"
            >
              Pending
            </Button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">Fetching assignments...</p>
            </div>
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment: any) => {
              const riskLevel = getRiskLevel(assignment.plagiarism_count || 0, assignment.submission_count || 0);

              return (
                <div
                  key={assignment.id}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all shadow-sm group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Assignment Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{assignment.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            Course ID: {assignment.course_id}
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <Calendar className="w-3 h-3" />
                            Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Badge className={cn("px-2.5 py-0.5 rounded-full border", getStatusColor(assignment.status))}>
                          {assignment.status === 'completed' ? 'Analyzed' : assignment.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Stats Row */}
                      {assignment.status === 'completed' ? (
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground font-semibold">{assignment.submission_count || 0}</span>
                            <span className="text-muted-foreground">submissions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span className="text-foreground font-semibold">{assignment.plagiarism_count || 0}</span>
                            <span className="text-muted-foreground">plagiarism</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-accent" />
                            <span className="text-foreground font-semibold">{assignment.ai_count || 0}</span>
                            <span className="text-muted-foreground">AI-generated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold", riskLevel.color)}>{riskLevel.label}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-warning font-medium">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span>Analysis {assignment.status}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {assignment.status === 'completed' ? 'Last analyzed recently' : 'Created ' + new Date(assignment.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {assignment.status === 'completed' ? (
                        <>
                          <Link to={`/assignments/${assignment.id}/results`}>
                            <Button variant="default" size="sm" className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all">
                              <Eye className="w-4 h-4" />
                              View Results
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="gap-2 rounded-full">
                            <Download className="w-4 h-4" />
                            Report
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 rounded-full shadow-md hover:bg-primary/90"
                          onClick={() => startAnalysisMutation.mutate(assignment.id)}
                          disabled={startAnalysisMutation.isPending}
                        >
                          {startAnalysisMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          Start Analysis
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                          <DropdownMenuItem className="gap-2"><TrendingUp className="w-4 h-4" /> Re-analyze</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Clock className="w-4 h-4" /> Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive gap-2" onClick={() => deleteMutation.mutate(assignment.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-border rounded-2xl bg-card/10 backdrop-blur-sm">
              <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold">No assignments found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Upload some code to start protecting academic integrity.</p>
              <Link to="/assignments/new" className="mt-6 inline-block">
                <Button variant="hero">Create First Scan</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
