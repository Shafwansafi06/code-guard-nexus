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
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const courses = [
  {
    id: 1,
    name: 'CS101: Data Structures and Algorithms',
    students: 45,
    assignments: 5,
    semester: 'Fall 2024',
    plagiarismCases: 12,
    aiGenerated: 8,
    color: 'from-primary/20 to-secondary/20',
  },
  {
    id: 2,
    name: 'CS201: Advanced Algorithms',
    students: 38,
    assignments: 3,
    semester: 'Fall 2024',
    plagiarismCases: 5,
    aiGenerated: 3,
    color: 'from-secondary/20 to-accent/20',
  },
  {
    id: 3,
    name: 'CS301: Operating Systems',
    students: 32,
    assignments: 2,
    semester: 'Fall 2024',
    plagiarismCases: 3,
    aiGenerated: 2,
    color: 'from-accent/20 to-primary/20',
  },
  {
    id: 4,
    name: 'CS401: Database Systems',
    students: 28,
    assignments: 4,
    semester: 'Fall 2024',
    plagiarismCases: 7,
    aiGenerated: 4,
    color: 'from-success/20 to-info/20',
  },
];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Link to="/courses/new">
            <Button variant="hero" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Course
            </Button>
          </Link>
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
          {filteredCourses.map((course, index) => (
            <div 
              key={course.id}
              className="group relative rounded-xl glass-hover overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Header */}
              <div className={`h-24 bg-gradient-to-br ${course.color}`} />
              
              {/* Content */}
              <div className="p-6 -mt-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-background-secondary border border-border flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary" />
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
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="text-lg font-semibold mb-1">{course.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  {course.semester}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{course.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{course.assignments} assignments</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs border-t border-border pt-4">
                  <div>
                    <span className="text-destructive font-medium">{course.plagiarismCases}</span>
                    <span className="text-muted-foreground"> plagiarism</span>
                  </div>
                  <div>
                    <span className="text-warning font-medium">{course.aiGenerated}</span>
                    <span className="text-muted-foreground"> AI-generated</span>
                  </div>
                </div>

                <Link 
                  to={`/courses/${course.id}`}
                  className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-background-tertiary/50 hover:bg-background-tertiary transition-colors text-sm font-medium"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Add New Course Card */}
          <Link 
            to="/courses/new"
            className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[320px] group"
          >
            <div className="w-14 h-14 rounded-xl bg-background-tertiary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Create New Course
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
