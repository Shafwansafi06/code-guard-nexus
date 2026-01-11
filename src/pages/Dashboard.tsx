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
  Download,
  Search,
  Bell,
  MoreVertical,
  Upload,
  Flag,
  Eye,
  FileDown,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const quickStats = [
  { icon: FileText, label: 'Submissions Analyzed', value: '1,247', change: '+12%', positive: true },
  { icon: AlertTriangle, label: 'Plagiarism Cases', value: '23', change: '-8%', positive: true },
  { icon: AlertCircle, label: 'AI-Generated Code', value: '45', change: '+15%', positive: false },
  { icon: Clock, label: 'Time Saved', value: '127h', change: '+22%', positive: true },
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
  { id: 1, name: 'CS101: Data Structures', students: 45, assignments: 5, semester: 'Fall 2024' },
  { id: 2, name: 'CS201: Algorithms', students: 38, assignments: 3, semester: 'Fall 2024' },
  { id: 3, name: 'CS301: Operating Systems', students: 32, assignments: 2, semester: 'Fall 2024' },
];

const riskDistribution = [
  { label: 'Clean', percentage: 65, color: 'bg-success' },
  { label: 'Medium', percentage: 25, color: 'bg-warning' },
  { label: 'High', percentage: 10, color: 'bg-destructive' },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search assignments" 
                className="pl-9 w-64 bg-muted/50 border-border/50 rounded-full"
              />
            </div>
            <Link to="/assignments/new">
              <Button variant="default" className="gap-2 rounded-lg">
                <Upload className="w-4 h-4" />
                New Scan
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-lg">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Academic Integrity Monitoring</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className={`text-xs ${stat.positive ? 'text-success' : 'text-warning'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions for Professors */}
        <div className="grid md:grid-cols-4 gap-4">
          <Link to="/assignments/new" className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 hover:border-primary/50 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold mb-1">Upload & Scan</h3>
            <p className="text-xs text-muted-foreground">Batch analyze new submissions</p>
          </Link>

          <Link to="/assignments?filter=high-risk" className="p-4 rounded-xl bg-card border border-border/50 hover:border-destructive/50 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                <Flag className="w-5 h-5 text-destructive" />
              </div>
              <ArrowRight className="w-4 h-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold mb-1">Review Flagged</h3>
            <p className="text-xs text-muted-foreground">23 cases need attention</p>
          </Link>

          <button className="p-4 rounded-xl bg-card border border-border/50 hover:border-success/50 transition-all group text-left">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                <FileDown className="w-5 h-5 text-success" />
              </div>
              <ArrowRight className="w-4 h-4 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold mb-1">Export Reports</h3>
            <p className="text-xs text-muted-foreground">Generate PDF evidence</p>
          </button>

          <Link to="/history" className="p-4 rounded-xl bg-card border border-border/50 hover:border-accent/50 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold mb-1">View History</h3>
            <p className="text-xs text-muted-foreground">Past scans & trends</p>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Stat Card - Total Scans */}
          <div className="md:col-span-2 p-6 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Submissions This Month</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Monthly</span>
                  <span className="text-sm text-muted-foreground">Weekly</span>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span className="text-4xl font-bold">1,247</span>
              <span className="text-sm text-success">+1.9%</span>
            </div>
            {/* Chart placeholder */}
            <div className="h-32 flex items-end justify-between gap-1">
              {[40, 60, 45, 80, 55, 70, 50].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-muted rounded-t transition-all hover:bg-muted-foreground/30"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="p-6 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">High Risk Cases</p>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">23</p>
            <p className="text-sm text-success">-8% from last week</p>
            {/* Mini chart */}
            <div className="mt-4 flex items-end justify-between gap-1 h-16">
              {[30, 50, 40, 60, 45, 55, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-muted rounded" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Clean Files</p>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">1,089</p>
            <p className="text-sm text-success">+12% from last week</p>
            {/* Mini chart */}
            <div className="mt-4 flex items-end justify-between gap-1 h-16">
              {[50, 60, 55, 70, 65, 80, 75, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-muted rounded" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Scans */}
          <div className="p-6 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Recent Scans</h2>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            {/* Bar chart placeholder */}
            <div className="space-y-4">
              {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, i) => (
                <div key={month} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">{month}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground/30 rounded"
                      style={{ width: `${30 + Math.random() * 50}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detection Stats */}
          <div className="p-6 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">Detection Stats</h2>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Circular progress indicators */}
            <div className="flex items-center justify-around mb-6">
              {[
                { label: 'Clean Files', value: 85, color: 'text-success' },
                { label: 'Medium Risk', value: 33, color: 'text-warning' },
                { label: 'High Risk', value: 65, color: 'text-destructive' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={`${stat.value * 2.26} 226`}
                        className={stat.color}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                      {stat.value}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-sm font-medium mb-1">Increase your detection accuracy</p>
              <p className="text-xs text-muted-foreground mb-3">
                Improving detection accuracy is a strategy aimed at enhancing your professional visibility.
              </p>
              <Button size="sm" variant="outline" className="text-xs">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
