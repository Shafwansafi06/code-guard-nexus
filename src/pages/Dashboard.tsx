import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';

const quickStats = [
  { icon: FileText, label: 'Total Scans', value: '45', sublabel: 'this semester', color: 'text-primary' },
  { icon: AlertTriangle, label: 'High Risk', value: '8', sublabel: 'pairs found', color: 'text-destructive' },
  { icon: AlertCircle, label: 'Medium Risk', value: '12', sublabel: 'pairs found', color: 'text-warning' },
  { icon: Clock, label: 'Time Saved', value: '2.4', sublabel: 'hours avg', color: 'text-success' },
];

const recentActivity = [
  {
    id: 1,
    title: 'CS101 - Assignment 3: Binary Search Tree',
    time: '2 hours ago',
    status: 'completed',
    highRisk: 8,
    mediumRisk: 12,
    files: 45,
  },
  {
    id: 2,
    title: 'CS201 - Assignment 2: Graph Algorithms',
    time: 'Yesterday',
    status: 'completed',
    highRisk: 3,
    mediumRisk: 5,
    files: 38,
  },
  {
    id: 3,
    title: 'CS101 - Assignment 2: Sorting Algorithms',
    time: '3 days ago',
    status: 'completed',
    highRisk: 5,
    mediumRisk: 8,
    files: 44,
  },
];

const courses = [
  {
    id: 1,
    name: 'CS101: Data Structures',
    students: 45,
    assignments: 5,
    semester: 'Fall 2024',
  },
  {
    id: 2,
    name: 'CS201: Algorithms',
    students: 38,
    assignments: 3,
    semester: 'Fall 2024',
  },
  {
    id: 3,
    name: 'CS301: Operating Systems',
    students: 32,
    assignments: 2,
    semester: 'Fall 2024',
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Professor! 👋</h1>
            <p className="text-muted-foreground">
              Here's an overview of your plagiarism detection activity.
            </p>
          </div>
          <Link to="/assignments/new">
            <Button variant="hero" className="gap-2">
              <Plus className="w-4 h-4" />
              New Scan
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl glass-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-background-tertiary`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground/70">{stat.sublabel}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Link 
                  key={activity.id}
                  to={`/assignments/${activity.id}/results`}
                  className="block p-5 rounded-xl glass-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                        <span className="mx-1">•</span>
                        {activity.files} files analyzed
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-destructive">{activity.highRisk} High Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-warning">{activity.mediumRisk} Medium Risk</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Courses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Courses</h2>
              <Link to="/courses" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <Link 
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-5 rounded-xl glass-hover"
                >
                  <h3 className="font-medium mb-2">{course.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{course.semester}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {course.students} students
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {course.assignments} assignments
                    </div>
                  </div>
                </Link>
              ))}

              <Link to="/courses/new">
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Course
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl gradient-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ready to scan new submissions?</h3>
              <p className="text-sm text-muted-foreground">
                Upload files and get results in under 5 minutes
              </p>
            </div>
            <Link to="/assignments/new">
              <Button variant="hero" className="gap-2">
                Start New Scan
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
