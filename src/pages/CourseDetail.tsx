import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  BarChart3, 
  Plus,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  ChevronRight,
  Brain,
  Download
} from 'lucide-react';

const courseData = {
  id: 1,
  name: 'CS101: Data Structures and Algorithms',
  semester: 'Fall 2024',
  students: 45,
  description: 'Introduction to fundamental data structures and algorithms.',
  totalSubmissions: 225,
  plagiarismCases: 12,
  aiGenerated: 8,
};

const assignments = [
  {
    id: 1,
    name: 'Assignment 3: Binary Search Tree',
    dueDate: 'Dec 15, 2024',
    status: 'graded',
    submissions: 45,
    highRisk: 8,
    mediumRisk: 12,
    lowRisk: 25,
    scannedAt: '2 hours ago',
  },
  {
    id: 2,
    name: 'Assignment 2: Sorting Algorithms',
    dueDate: 'Nov 28, 2024',
    status: 'graded',
    submissions: 43,
    highRisk: 3,
    mediumRisk: 8,
    lowRisk: 32,
    scannedAt: '3 days ago',
  },
  {
    id: 3,
    name: 'Assignment 1: Linked Lists',
    dueDate: 'Nov 10, 2024',
    status: 'graded',
    submissions: 44,
    highRisk: 1,
    mediumRisk: 5,
    lowRisk: 38,
    scannedAt: '2 weeks ago',
  },
];

export default function CourseDetail() {
  const { id } = useParams();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Back & Header */}
        <div>
          <Link 
            to="/courses" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{courseData.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {courseData.semester}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {courseData.students} Students
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Course
              </Button>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Student List
              </Button>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="p-6 rounded-xl glass">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Course Overview
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background-tertiary/50">
              <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
              <p className="text-2xl font-bold">{courseData.totalSubmissions}</p>
            </div>
            <div className="p-4 rounded-lg bg-background-tertiary/50">
              <p className="text-sm text-muted-foreground mb-1">Plagiarism Cases</p>
              <p className="text-2xl font-bold text-destructive">{courseData.plagiarismCases}</p>
              <p className="text-xs text-muted-foreground">
                ({((courseData.plagiarismCases / courseData.totalSubmissions) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background-tertiary/50">
              <p className="text-sm text-muted-foreground mb-1">AI-Generated</p>
              <p className="text-2xl font-bold text-warning">{courseData.aiGenerated}</p>
              <p className="text-xs text-muted-foreground">
                ({((courseData.aiGenerated / courseData.totalSubmissions) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background-tertiary/50">
              <p className="text-sm text-muted-foreground mb-1">Clean Submissions</p>
              <p className="text-2xl font-bold text-success">
                {courseData.totalSubmissions - courseData.plagiarismCases - courseData.aiGenerated}
              </p>
            </div>
          </div>

          <Button variant="outline" className="mt-4 gap-2">
            <Download className="w-4 h-4" />
            Export Course Report
          </Button>
        </div>

        {/* Assignments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assignments</h2>
            <Link to="/assignments/new">
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                New Assignment
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <div 
                key={assignment.id}
                className="p-6 rounded-xl glass-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{assignment.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs capitalize">
                        {assignment.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {assignment.dueDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {assignment.submissions} submissions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Scanned {assignment.scannedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm">
                          <span className="font-medium text-destructive">{assignment.highRisk}</span>
                          <span className="text-muted-foreground"> High Risk</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span className="text-sm">
                          <span className="font-medium text-warning">{assignment.mediumRisk}</span>
                          <span className="text-muted-foreground"> Medium Risk</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">
                          <span className="font-medium text-success">{assignment.lowRisk}</span>
                          <span className="text-muted-foreground"> Low Risk</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link to={`/assignments/${assignment.id}/results`}>
                      <Button variant="outline" className="gap-2">
                        View Analysis
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" className="gap-2">
                      <Brain className="w-4 h-4" />
                      Rescan
                    </Button>
                    <Button variant="ghost" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
