import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, FileCode, X, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { coursesApi, assignmentsApi, submissionsApi } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewAssignment() {
  const [assignmentName, setAssignmentName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sensitivity, setSensitivity] = useState([85]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: coursesData = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  });

  const courses = Array.isArray(coursesData) ? coursesData : [];

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Create the assignment
      const assignment = await assignmentsApi.create({
        name: assignmentName,
        course_id: courseId,
        settings: {
          sensitivity: sensitivity[0],
          ai_detection: true,
          network_analysis: true
        }
      });

      // 2. Upload files (for simplicity we group all files for now, 
      // in a real app we'd likely have a way to associate with students)
      if (files.length > 0) {
        setUploading(true);
        // Using "Bulk" as a placeholder for student identifier if not provided
        await submissionsApi.upload(assignment.id, "Batch_Upload", files);

        // Start analysis
        await assignmentsApi.startAnalysis(assignment.id);
      }

      return assignment;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "Assignment created and analysis started."
      });
      navigate(`/assignments/${data.id}/results`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create assignment',
        variant: 'destructive',
      });
      setUploading(false);
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast({ title: "Error", description: "Please select a course", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create New Assignment Scan</h1>
          <p className="text-muted-foreground">Upload submissions and configure detection settings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assignment Details */}
          <div className="p-6 rounded-xl glass space-y-4">
            <h2 className="font-semibold px-1">Assignment Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-name">Assignment Name</Label>
                  <Input
                    id="assignment-name"
                    placeholder="e.g., Assignment 3: Binary Search Tree"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={courseId} onValueChange={setCourseId} required>
                    <SelectTrigger id="course">
                      <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="p-6 rounded-xl glass space-y-4">
            <h2 className="font-semibold px-1">Upload Submissions</h2>
            <div
              className={`upload-zone p-12 text-center ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Drop your code files here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
              <input id="file-input" type="file" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-tertiary text-sm">
                    <FileCode className="w-4 h-4 text-primary" />
                    {file.name}
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="p-6 rounded-xl glass space-y-6">
            <h2 className="font-semibold px-1">Detection Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Sensitivity: {sensitivity[0]}%</Label>
              </div>
              <Slider value={sensitivity} onValueChange={setSensitivity} max={100} min={50} step={5} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Detection</p>
                <p className="text-sm text-muted-foreground">Detect ChatGPT/Copilot code</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Network Analysis</p>
                <p className="text-sm text-muted-foreground">Visualize collaboration patterns</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="gap-2 min-w-[160px]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? 'Uploading Files...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
