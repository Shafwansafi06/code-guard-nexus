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

const assignments = [
  {
    id: 1,
    name: 'Assignment 3: Binary Search Tree Implementation',
    course: 'CS101: Data Structures',
    dueDate: '2024-10-15',
    submissions: 45,
    analyzed: 45,
    plagiarismCases: 8,
    aiGenerated: 12,
    status: 'completed',
    avgSimilarity: 23,
    timeAnalyzed: '2 hours ago',
    cleanFiles: 25,
  },
  {
    id: 2,
    name: 'Assignment 2: Graph Algorithms - DFS & BFS',
    course: 'CS201: Advanced Algorithms',
    dueDate: '2024-10-12',
    submissions: 38,
    analyzed: 38,
    plagiarismCases: 5,
    aiGenerated: 8,
    status: 'completed',
    avgSimilarity: 18,
    timeAnalyzed: 'Yesterday',
    cleanFiles: 25,
  },
  {
    id: 3,
    name: 'Assignment 2: Sorting Algorithms Comparison',
    course: 'CS101: Data Structures',
    dueDate: '2024-10-08',
    submissions: 44,
    analyzed: 44,
    plagiarismCases: 6,
    aiGenerated: 10,
    status: 'completed',
    avgSimilarity: 21,
    timeAnalyzed: '3 days ago',
    cleanFiles: 28,
  },
  {
    id: 4,
    name: 'Assignment 1: Process Scheduling Simulation',
    course: 'CS301: Operating Systems',
    dueDate: '2024-10-05',
    submissions: 32,
    analyzed: 32,
    plagiarismCases: 3,
    aiGenerated: 5,
    status: 'completed',
    avgSimilarity: 15,
    timeAnalyzed: '5 days ago',
    cleanFiles: 24,
  },
  {
    id: 5,
    name: 'Assignment 4: Hash Table Implementation',
    course: 'CS101: Data Structures',
    dueDate: '2024-11-01',
    submissions: 42,
    analyzed: 0,
    plagiarismCases: 0,
    aiGenerated: 0,
    status: 'pending',
    avgSimilarity: 0,
    timeAnalyzed: 'Not analyzed',
    cleanFiles: 0,
  },
];

export default function Assignments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
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
          {filteredAssignments.map((assignment) => {
            const riskLevel = getRiskLevel(assignment.plagiarismCases, assignment.submissions);
            
            return (
              <div 
                key={assignment.id}
                className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Assignment Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{assignment.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {assignment.course}
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status === 'completed' ? 'Analyzed' : 'Pending Review'}
                      </Badge>
                    </div>

                    {/* Stats Row */}
                    {assignment.status === 'completed' ? (
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground font-medium">{assignment.submissions}</span>
                          <span className="text-muted-foreground">submissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-foreground font-medium">{assignment.plagiarismCases}</span>
                          <span className="text-muted-foreground">plagiarism</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-accent" />
                          <span className="text-foreground font-medium">{assignment.aiGenerated}</span>
                          <span className="text-muted-foreground">AI-generated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-foreground font-medium">{assignment.cleanFiles}</span>
                          <span className="text-muted-foreground">clean</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${riskLevel.color}`}>{riskLevel.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for analysis</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {assignment.timeAnalyzed}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {assignment.status === 'completed' ? (
                      <>
                        <Link to={`/assignments/${assignment.id}/results`}>
                          <Button variant="default" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View Results
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                      </>
                    ) : (
                      <Link to={`/assignments/${assignment.id}/results`}>
                        <Button variant="default" size="sm" className="gap-2">
                          Start Analysis
                        </Button>
                      </Link>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Re-analyze</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Share Report</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
