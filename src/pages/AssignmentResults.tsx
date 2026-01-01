import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react';

export default function AssignmentResults() {
  const { id } = useParams();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to="/courses/1" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Course
            </Link>
            <h1 className="text-2xl font-bold">CS101 - Assignment 3: Binary Search Tree</h1>
            <p className="text-muted-foreground">Analyzed 2 hours ago • 45 submissions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Re-scan</Button>
            <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
            <Button variant="hero" className="gap-2"><Download className="w-4 h-4" /> Export Report</Button>
          </div>
        </div>
        
        <div className="-mx-8">
          <DashboardComponent />
        </div>
      </div>
    </DashboardLayout>
  );
}
