/**
 * Import Course Dialog Component
 * Allows instructors to import courses from Google Classroom
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
  enrollmentCode?: string;
  courseState: string;
}

interface ImportCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onImportSuccess?: () => void;
}

export function ImportCourseDialog({
  open,
  onOpenChange,
  userId,
  onImportSuccess,
}: ImportCourseDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/google-classroom/courses`, {
        params: { user_id: userId },
      });
      setCourses(response.data.filter((c: Course) => c.courseState === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Google Classroom courses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleImport = async () => {
    if (selectedCourses.size === 0) {
      toast({
        title: 'No Courses Selected',
        description: 'Please select at least one course to import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);
      const importPromises = Array.from(selectedCourses).map((courseId) =>
        axios.post(
          `${API_URL}/google-classroom/import/course`,
          {
            google_classroom_id: courseId,
            sync_enabled: false,
          },
          {
            params: { user_id: userId },
          }
        )
      );

      await Promise.all(importPromises);

      toast({
        title: 'Success',
        description: `${selectedCourses.size} course(s) imported successfully!`,
      });

      setSelectedCourses(new Set());
      onOpenChange(false);
      onImportSuccess?.();
    } catch (error) {
      console.error('Failed to import courses:', error);
      toast({
        title: 'Import Failed',
        description: 'Some courses could not be imported. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Courses from Google Classroom</DialogTitle>
          <DialogDescription>
            Select the courses you want to import into CodeGuard Nexus.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No active courses found in Google Classroom.
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleCourse(course.id)}
                >
                  <Checkbox
                    checked={selectedCourses.has(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{course.name}</h4>
                    {course.section && (
                      <p className="text-sm text-gray-600">Section: {course.section}</p>
                    )}
                    {course.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    {course.enrollmentCode && (
                      <p className="text-xs text-gray-400 mt-1">
                        Code: {course.enrollmentCode}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || selectedCourses.size === 0}
          >
            {importing ? 'Importing...' : `Import ${selectedCourses.size} Course(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
