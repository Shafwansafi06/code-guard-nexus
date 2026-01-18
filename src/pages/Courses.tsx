import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  FileText,
  MoreVertical,
  Calendar,
  Edit,
  Trash2,
  ChevronRight,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateCourseDialog } from '@/components/dashboard/CreateCourseDialog';
import { GoogleClassroomConnect } from '@/components/google-classroom/GoogleClassroomConnect';
import { ImportCourseDialog } from '@/components/google-classroom/ImportCourseDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen as BookIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALLBACK_COLORS = [
  'from-primary/20 to-secondary/20',
  'from-secondary/20 to-accent/20',
  'from-accent/20 to-primary/20',
  'from-success/20 to-info/20',
];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpne, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user ID from auth context or local storage
  const localUserId = localStorage.getItem('user_id');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.me(),
    enabled: !localUserId,
    retry: false
  });

  const userId = localUserId || user?.id || '';

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Course Deleted',
        description: 'The course has been successfully removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete course',
        variant: 'destructive',
      });
    },
  });

  const filteredCourses = courses.filter((course: any) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Courses</h1>
            <p className="text-muted-foreground">
              Manage your courses and track plagiarism across assignments.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
              Import from Google Classroom
            </Button>
            <Button variant="hero" className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">Loading your courses...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course: any, index: number) => (
              <div
                key={course.id}
                className="group relative rounded-xl glass-hover overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Header */}
                <div className={cn(
                  "h-24 bg-gradient-to-br",
                  FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                )} />

                {/* Content */}
                <div className="p-6 -mt-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-background-secondary border border-border flex items-center justify-center shadow-lg shadow-black/20">
                      <BookIcon className="w-7 h-7 text-primary" />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(course.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="text-lg font-semibold mb-1 truncate" title={course.name}>
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{course.code}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <Calendar className="w-3 h-3 text-secondary" />
                    {course.semester}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{course.student_count || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{course.assignment_count || 0} assignments</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs border-t border-border pt-4">
                    <div>
                      <span className="text-destructive font-bold">{course.plagiarism_count || 0}</span>
                      <span className="text-muted-foreground/80 font-medium"> plagiarism</span>
                    </div>
                    <div>
                      <span className="text-warning font-bold">{course.ai_count || 0}</span>
                      <span className="text-muted-foreground/80 font-medium"> AI-generated</span>
                    </div>
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-background-tertiary/50 hover:bg-primary/10 hover:text-primary transition-all text-sm font-semibold"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
              <BookIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your search or create a new course.</p>
            </div>
          )}

          {/* Add New Course Card */}
          <button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center min-h-[320px] group bg-card/30 hover:bg-card/50"
          >
            <div className="w-14 h-14 rounded-xl bg-background-tertiary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Create New Course
            </p>
          </button>
        </div>

        <CreateCourseDialog
          open={isDialogOpne}
          onOpenChange={setIsDialogOpen}
        />

        <ImportCourseDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          userId={userId}
          onImportSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
