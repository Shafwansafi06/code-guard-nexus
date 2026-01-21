import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, FileText, Download, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { assignmentsApi } from '@/lib/api';

interface HistoryItem {
  id: string;
  title: string;
  course: { name: string; code: string } | null;
  created_at: string;
  total_submissions: number;
  high_risk_count: number;
  status: string;
}

export default function History() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const assignments = await assignmentsApi.list();
      // Sort by created_at descending (newest first)
      const sorted = assignments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistoryItems(sorted);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredItems = historyItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scan History</h1>
          <p className="text-muted-foreground">View all your previous plagiarism scans.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search scans..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No scans found matching your search.' : 'No scan history yet. Create your first assignment to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-5 rounded-xl glass-hover flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-background-tertiary">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {item.course ? `${item.course.code} - ${item.title}` : item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {formatDate(item.created_at)} • {item.total_submissions || 0} submissions
                      {item.high_risk_count > 0 && (
                        <span className="text-red-500 font-medium">• {item.high_risk_count} high risk</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/assignments/${item.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      View <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
