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
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, apiClient } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { OnboardingDialog } from '@/components/onboarding/OnboardingDialog';

const submissionData = [
  { name: 'S', value: 400 },
  { name: 'M', value: 600 },
  { name: 'T', value: 450 },
  { name: 'W', value: 800 },
  { name: 'T', value: 550 },
  { name: 'F', value: 700 },
  { name: 'S', value: 500 },
];

const scanHistoryData = [
  { month: 'Apr', scans: 45, color: '#6366f1' },
  { month: 'May', scans: 52, color: '#8b5cf6' },
  { month: 'Jun', scans: 38, color: '#a855f7' },
  { month: 'Jul', scans: 65, color: '#d946ef' },
  { month: 'Aug', scans: 48, color: '#ec4899' },
  { month: 'Sep', scans: 70, color: '#f43f5e' },
  { month: 'Oct', scans: 61, color: '#3b82f6' },
  { month: 'Nov', scans: 85, color: '#06b6d4' },
];

const riskData = [
  { name: 'Human', value: 85, color: '#10b981' },
  { name: 'AI Gen', value: 33, color: '#f59e0b' },
  { name: 'Copied', value: 65, color: '#ef4444' },
];

const quickStats = [
  { icon: FileText, label: 'Submissions Analyzed', value: '1,247', change: '+12%', positive: true },
  { icon: AlertTriangle, label: 'Plagiarism Cases', value: '23', change: '-8%', positive: true },
  { icon: AlertCircle, label: 'AI-Generated Code', value: '45', change: '+15%', positive: false },
  { icon: Clock, label: 'Time Saved', value: '127h', change: '+22%', positive: true },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "circOut" as const
    }
  }
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.get('/profile/me').then(res => res.data),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchProfile();
    toast({
      title: 'Welcome! 🎉',
      description: 'Your profile has been set up successfully.',
    });
  };

  const handleExport = () => {
    if (!stats) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "codeguard_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: "Report Exported",
      description: "Dashboard statistics have been exported to JSON.",
    });
  };

  const dashboardStats = [
    { icon: FileText, label: 'Submissions Analyzed', value: stats?.total_submissions || '---', change: '+12%', positive: true },
    { icon: AlertTriangle, label: 'Plagiarism Cases', value: stats?.high_risk_cases || '---', change: '-8%', positive: true },
    { icon: AlertCircle, label: 'Pending Reviews', value: stats?.pending_reviews || '---', change: '+15%', positive: false },
    { icon: Clock, label: 'Assignments', value: stats?.total_assignments || '---', change: '+22%', positive: true },
  ];
  
  const greeting = profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}!` : 'Dashboard Overview';
  
  return (
    <DashboardLayout>
      <OnboardingDialog 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />
      
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {greeting}
              </h1>
              {profile?.subject && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.subject} {profile.institution && `• ${profile.institution}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search assignments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-muted/30 border-border/50 rounded-full focus:bg-muted/50 transition-all border-dashed"
              />
            </div>
            <Link to="/assignments/new">
              <Button variant="default" className="gap-2 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Upload className="w-4 h-4" />
                New Scan
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-sm text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Academic Integrity Monitoring
        </motion.p>

        {/* Quick Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -2 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                {isLoading ? (
                  <div className="w-8 h-4 bg-muted animate-pulse rounded" />
                ) : (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.positive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  )}>
                    {stat.change}
                  </span>
                )}
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold mb-1 tracking-tight">{stat.value}</p>
              )}
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={containerVariants} className="grid md:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Link to="/assignments/new" className="block p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-all group h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-primary/20 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <ArrowRight className="w-4 h-4 text-primary translate-x--2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
              <h3 className="font-semibold mb-1">Upload & Scan</h3>
              <p className="text-xs text-muted-foreground">Batch analyze new submissions</p>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/assignments?filter=high-risk" className="block p-4 rounded-2xl bg-card border border-border/50 hover:border-destructive/30 transition-all group h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-destructive/10 group-hover:scale-110 transition-transform">
                  <Flag className="w-5 h-5 text-destructive" />
                </div>
                <ArrowRight className="w-4 h-4 text-destructive translate-x--2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
              <h3 className="font-semibold mb-1">Review Flagged</h3>
              <p className="text-xs text-muted-foreground">23 cases need attention</p>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button
              onClick={handleExport}
              className="w-full p-4 rounded-2xl bg-card border border-border/50 hover:border-success/30 transition-all group text-left h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                  <FileDown className="w-5 h-5 text-success" />
                </div>
                <ArrowRight className="w-4 h-4 text-success translate-x--2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
              <h3 className="font-semibold mb-1">Export Reports</h3>
              <p className="text-xs text-muted-foreground">Generate data report</p>
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/history" className="block p-4 rounded-2xl bg-card border border-border/50 hover:border-accent/30 transition-all group h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform">
                  <Eye className="w-5 h-5 text-accent" />
                </div>
                <ArrowRight className="w-4 h-4 text-accent translate-x--2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
              <h3 className="font-semibold mb-1">View History</h3>
              <p className="text-xs text-muted-foreground">Past scans & trends</p>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-2 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Submissions Trend</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">Monthly</span>
                  <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Weekly</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-extrabold tracking-tight">1,247</span>
              <span className="text-sm font-bold text-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +1.9%
              </span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.8)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#8b5cf6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={2000}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-destructive/20 transition-all flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <p className="text-sm font-medium text-muted-foreground">High Risk</p>
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <p className="text-4xl font-extrabold mb-1 self-start">23</p>
            <p className="text-xs font-bold text-success self-start mb-6">-8% vs last week</p>

            <div className="h-24 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionData}>
                  <Area
                    type="step"
                    dataKey="value"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-success/20 transition-all flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <p className="text-sm font-medium text-muted-foreground">Clean Files</p>
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-4xl font-extrabold mb-1 self-start">1,089</p>
            <p className="text-xs font-bold text-success self-start mb-6">+12% vs last week</p>

            <div className="h-24 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionData}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-lg">Scan Volume</h2>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scanHistoryData} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.8)',
                      backdropFilter: 'blur(8px)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                  <Bar
                    dataKey="scans"
                    radius={[6, 6, 0, 0]}
                    animationDuration={2000}
                    barSize={40}
                  >
                    {scanHistoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={index === scanHistoryData.length - 1 ? 1 : 0.7}
                        className="transition-all duration-300 hover:fill-opacity-100"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-card border border-border/50 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-lg">Detection Risk Profile</h2>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-4 w-full">
                {riskData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">{item.name}</span>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 text-primary" />
              </div>
              <p className="text-sm font-bold mb-1">Optimize Detection Workflow</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-[80%]">
                Advanced AI models are now available for deeper pattern matching across large datasets.
              </p>
              <Button size="sm" variant="outline" className="text-xs rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary/30">
                Upgrade Engine
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
