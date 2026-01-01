import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, FileText, Download, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const historyItems = [
  { id: 1, title: 'CS101 - Assignment 3', date: 'Dec 15, 2024', files: 45, highRisk: 8 },
  { id: 2, title: 'CS201 - Assignment 2', date: 'Dec 10, 2024', files: 38, highRisk: 3 },
  { id: 3, title: 'CS101 - Assignment 2', date: 'Nov 28, 2024', files: 43, highRisk: 5 },
  { id: 4, title: 'CS301 - Assignment 1', date: 'Nov 15, 2024', files: 32, highRisk: 2 },
];

export default function History() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scan History</h1>
          <p className="text-muted-foreground">View all your previous plagiarism scans.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search scans..." className="pl-10" />
        </div>

        <div className="space-y-4">
          {historyItems.map((item) => (
            <div key={item.id} className="p-5 rounded-xl glass-hover flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-background-tertiary">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {item.date} • {item.files} files • {item.highRisk} high risk
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/assignments/${item.id}/results`}>
                  <Button variant="outline" size="sm" className="gap-1">View <ChevronRight className="w-4 h-4" /></Button>
                </Link>
                <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
