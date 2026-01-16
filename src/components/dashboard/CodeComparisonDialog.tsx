import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, User, Copy, AlertTriangle } from 'lucide-react';

interface DiffLine {
    content: string;
    type: 'added' | 'removed' | 'unchanged' | 'copied';
    lineNumber?: number;
}

interface CodeComparisonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileA: string;
    fileB: string;
    codeA: string;
    codeB: string;
    similarity: number;
}

export function CodeComparisonDialog({
    open,
    onOpenChange,
    fileA,
    fileB,
    codeA,
    codeB,
    similarity
}: CodeComparisonDialogProps) {
    // Simple "diff" logic for the demo
    // In a real app, we'd use a line-by-line diff algorithm or get matches from back-end
    const linesA = codeA.split('\n');
    const linesB = codeB.split('\n');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border">
                <DialogHeader className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-8">
                        <DialogTitle className="flex items-center gap-3">
                            <ArrowLeftRight className="w-5 h-5 text-primary" />
                            <span>Plagiarism Comparison</span>
                        </DialogTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
                                <AlertTriangle className="w-4 h-4" />
                                {similarity}% Match
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Left Side: Source/Original */}
                    <div className="flex-1 flex flex-col border-r border-border">
                        <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{fileA}</span>
                                <span className="text-[10px] uppercase tracking-wider px-1.5 rounded bg-primary/10 text-primary font-bold">Source</span>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 font-mono text-sm">
                            <div className="p-4">
                                {linesA.map((line, i) => (
                                    <div key={i} className={cn(
                                        "group flex hover:bg-muted/50 transition-colors",
                                        // Hardcoded highlighting for demo impact
                                        (i > 2 && i < 8) && "bg-success/10 border-l-2 border-success"
                                    )}>
                                        <span className="w-10 text-right pr-4 text-muted-foreground/50 select-none text-xs leading-6">{i + 1}</span>
                                        <span className="flex-1 whitespace-pre leading-6 px-2">{line || ' '}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Side: Suspected Copy */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-3 bg-muted/20 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{fileB}</span>
                                <span className="text-[10px] uppercase tracking-wider px-1.5 rounded bg-destructive/10 text-destructive font-bold">Copied</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Copy className="w-3 h-3" />
                                <span>Suspected match with {fileA}</span>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 font-mono text-sm">
                            <div className="p-4">
                                {linesB.map((line, i) => (
                                    <div key={i} className={cn(
                                        "group flex hover:bg-muted/50 transition-colors",
                                        // Hardcoded highlighting for demo impact
                                        (i > 2 && i < 8) && "bg-destructive/10 border-l-2 border-destructive animate-pulse-subtle"
                                    )}>
                                        <span className="w-10 text-right pr-4 text-muted-foreground/50 select-none text-xs leading-6">{i + 1}</span>
                                        <span className="flex-1 whitespace-pre leading-6 px-2">{line || ' '}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/20 flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-success/20 border border-success" />
                        <span>Original Code (Source)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive" />
                        <span>Plagiarized Segment</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
