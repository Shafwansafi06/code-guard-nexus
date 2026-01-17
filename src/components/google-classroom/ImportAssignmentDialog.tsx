/**
 * Import Assignment Dialog Component
 * Allows instructors to import assignments from Google Classroom
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: any;
  dueTime?: any;
  maxPoints?: number;
  workType: string;
  state: string;
}

interface ImportAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  googleClassroomId: string;
  userId: string;
  onImportSuccess?: () => void;
}

export function ImportAssignmentDialog({
  open,
  onOpenChange,
  courseId,
  googleClassroomId,
  userId,
  onImportSuccess,
}: ImportAssignmentDialogProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    if (open && googleClassroomId) {
      fetchAssignments();
    }
  }, [open, googleClassroomId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/google-classroom/courses/${googleClassroomId}/coursework`,
        {
          params: { user_id: userId },
        }
      );
      setAssignments(response.data.filter((a: Assignment) => a.state === 'PUBLISHED'));
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Google Classroom assignments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = (assignmentId: string) => {
    const newSelected = new Set(selectedAssignments);
    if (newSelected.has(assignmentId)) {
      newSelected.delete(assignmentId);
    } else {
      newSelected.add(assignmentId);
    }
    setSelectedAssignments(newSelected);
  };

  const formatDueDate = (dueDate: any, dueTime: any) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate.year, dueDate.month - 1, dueDate.day);
    if (dueTime) {
      date.setHours(dueTime.hours || 0, dueTime.minutes || 0);
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleImport = async () => {
    if (selectedAssignments.size === 0) {
      toast({
        title: 'No Assignments Selected',
        description: 'Please select at least one assignment to import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);
      const importPromises = Array.from(selectedAssignments).map((assignmentId) =>
        axios.post(
          `${API_URL}/google-classroom/import/assignment`,
          {
            course_id: courseId,
            google_coursework_id: assignmentId,
          },
          {
            params: { user_id: userId },
          }
        )
      );

      await Promise.all(importPromises);

      toast({
        title: 'Success',
        description: `${selectedAssignments.size} assignment(s) imported successfully!`,
      });

      setSelectedAssignments(new Set());
      onOpenChange(false);
      onImportSuccess?.();
    } catch (error) {
      console.error('Failed to import assignments:', error);
      toast({
        title: 'Import Failed',
        description: 'Some assignments could not be imported. Please try again.',
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
          <DialogTitle>Import Assignments from Google Classroom</DialogTitle>
          <DialogDescription>
            Select the assignments you want to import for plagiarism detection.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No published assignments found in this course.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleAssignment(assignment.id)}
                >
                  <Checkbox
                    checked={selectedAssignments.has(assignment.id)}
                    onCheckedChange={() => toggleAssignment(assignment.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{assignment.title}</h4>
                      <Badge variant="secondary">{assignment.workType}</Badge>
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span>📅 {formatDueDate(assignment.dueDate, assignment.dueTime)}</span>
                      {assignment.maxPoints && <span>🎯 {assignment.maxPoints} points</span>}
                    </div>
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
            disabled={importing || selectedAssignments.size === 0}
          >
            {importing ? 'Importing...' : `Import ${selectedAssignments.size} Assignment(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
