import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Editor from '@monaco-editor/react';

interface CodeEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filename: string;
    code: string;
    language?: string;
}

export function CodeEditorDialog({
    open,
    onOpenChange,
    filename,
    code,
    language = 'python'
}: CodeEditorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background border-border">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <span className="text-primary font-mono text-sm">{filename}</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Read Only
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16 },
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
