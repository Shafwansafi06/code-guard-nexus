import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, FileCode, X, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewAssignment() {
  const [files, setFiles] = useState<File[]>([]);
  const [sensitivity, setSensitivity] = useState([85]);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Analysis started!", description: "You'll be redirected when complete." });
    setTimeout(() => navigate('/assignments/1/results'), 1500);
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
            <h2 className="font-semibold">Assignment Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignment Name</Label>
                <Input placeholder="e.g., Assignment 3: Binary Search Tree" required />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Input placeholder="CS101: Data Structures" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="Add any notes..." rows={3} />
            </div>
          </div>

          {/* Upload Zone */}
          <div className="p-6 rounded-xl glass space-y-4">
            <h2 className="font-semibold">Upload Submissions</h2>
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
            <h2 className="font-semibold">Detection Settings</h2>
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
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="hero" className="gap-2">
              <Zap className="w-4 h-4" /> Start Analysis
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
