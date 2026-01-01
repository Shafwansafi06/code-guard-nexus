import { useState, useCallback } from 'react';
import { Upload, FileCode, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'ready' | 'error';
}

const supportedExtensions = ['.py', '.java', '.cpp', '.c', '.js', '.ts', '.go', '.rs', '.rb', '.php'];

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || '',
      status: supportedExtensions.some(ext => file.name.endsWith(ext)) ? 'ready' : 'error',
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getLanguageIcon = (ext: string) => {
    const colors: Record<string, string> = {
      py: 'text-[#3776AB]',
      java: 'text-[#ED8B00]',
      cpp: 'text-[#00599C]',
      c: 'text-[#A8B9CC]',
      js: 'text-[#F7DF1E]',
      ts: 'text-[#3178C6]',
      go: 'text-[#00ADD8]',
      rs: 'text-[#DEA584]',
      rb: 'text-[#CC342D]',
      php: 'text-[#777BB4]',
    };
    return colors[ext] || 'text-muted-foreground';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Upload Zone */}
      <div
        className={cn(
          "upload-zone p-8 md:p-12 text-center cursor-pointer",
          isDragging && "dragging"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={supportedExtensions.join(',')}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragging ? "bg-primary/20 scale-110" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-all duration-300",
              isDragging ? "text-primary animate-bounce" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isDragging ? 'Drop files here' : 'Drop your code files here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {supportedExtensions.map(ext => (
              <span
                key={ext}
                className="px-2 py-1 text-xs font-mono rounded bg-muted text-muted-foreground"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} ready
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiles([])}
              className="text-destructive hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div
                key={file.id}
                className={cn(
                  "glass-hover rounded-lg p-3 flex items-center gap-3 animate-slide-up",
                  file.status === 'error' && "border-destructive/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <FileCode className={cn("w-5 h-5 flex-shrink-0", getLanguageIcon(file.type))} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                
                {file.status === 'ready' ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
