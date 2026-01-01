import { useState } from 'react';
import { ArrowLeft, Download, Link, ChevronDown, Brain, Clock, Flag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const codeA = `import numpy as np

# Bubble sort algorithm
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Test the function
test_array = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(test_array.copy())
print(f"Sorted array: {result}")`;

const codeB = `import numpy as np

# Sort using bubbles
def bubble_sort(array):
    length = len(array)
    for i in range(length):
        for j in range(0, length-i-1):
            if array[j] > array[j+1]:
                array[j], array[j+1] = array[j+1], array[j]
    return array

# Test the sorting function
test_data = [64, 34, 25, 12, 22, 11, 90]
sorted_result = bubble_sort(test_data.copy())
print(f"Sorted array: {sorted_result}")`;

interface LineProps {
  number: number;
  content: string;
  highlight?: 'identical' | 'similar' | 'suspicious' | null;
}

function CodeLine({ number, content, highlight }: LineProps) {
  const highlightStyles = {
    identical: 'bg-success/10 border-l-2 border-success',
    similar: 'bg-warning/10 border-l-2 border-warning',
    suspicious: 'bg-destructive/10 border-l-2 border-destructive',
  };

  return (
    <div className={cn(
      "flex font-mono text-sm",
      highlight && highlightStyles[highlight]
    )}>
      <span className="w-12 flex-shrink-0 text-right pr-4 text-muted-foreground select-none">
        {number}
      </span>
      <pre className="flex-1 overflow-x-auto">
        <code className="text-foreground">{content}</code>
      </pre>
    </div>
  );
}

export function CodeComparison() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const codeALines = codeA.split('\n');
  const codeBLines = codeB.split('\n');

  const getHighlight = (lineNum: number): 'identical' | 'similar' | 'suspicious' | null => {
    if ([1, 4, 5, 6, 7, 8, 9].includes(lineNum)) return 'identical';
    if ([3, 11, 12, 13].includes(lineNum)) return 'similar';
    return null;
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border hidden md:block" />
              <h2 className="text-lg font-semibold text-foreground">
                student_a.py vs student_b.py
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Similarity Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Similarity</span>
              <span className="text-2xl font-bold text-destructive">92%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-destructive to-accent rounded-full"
                style={{ width: '92%' }}
              />
            </div>
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Lexical:</span> 95%
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Syntactic:</span> 89%
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Semantic:</span> 88%
              </span>
            </div>
          </div>
        </div>

        {/* Code Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left Panel */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">student_a.py</span>
                <span className="text-xs text-muted-foreground">(Original)</span>
              </div>
              <span className="text-xs text-muted-foreground">Lines: 15 | Size: 0.4KB</span>
            </div>
            <div className="bg-[hsl(220,40%,6%)] p-4 max-h-[400px] overflow-y-auto">
              {codeALines.map((line, i) => (
                <CodeLine
                  key={i}
                  number={i + 1}
                  content={line}
                  highlight={getHighlight(i + 1)}
                />
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm font-medium text-foreground">student_b.py</span>
                <span className="text-xs text-muted-foreground">(Copy)</span>
              </div>
              <span className="text-xs text-muted-foreground">Lines: 15 | Size: 0.4KB</span>
            </div>
            <div className="bg-[hsl(220,40%,6%)] p-4 max-h-[400px] overflow-y-auto">
              {codeBLines.map((line, i) => (
                <CodeLine
                  key={i}
                  number={i + 1}
                  content={line}
                  highlight={getHighlight(i + 1)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/20 border-l-2 border-success" />
            <span className="text-sm text-muted-foreground">Identical code</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/20 border-l-2 border-warning" />
            <span className="text-sm text-muted-foreground">Similar but modified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive/20 border-l-2 border-destructive" />
            <span className="text-sm text-muted-foreground">Suspicious patterns</span>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">Analysis Details</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isPanelOpen && "rotate-180"
            )} />
          </button>

          {isPanelOpen && (
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Findings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Flag className="w-4 h-4 text-primary" />
                  Key Findings
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Variable renaming detected (arr → array)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Comment modifications found
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Identical logic structure
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Function call order matches 100%
                  </li>
                </ul>
              </div>

              {/* AI Detection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-secondary" />
                  AI Detection
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">student_a.py</span>
                      <span className="text-success">12% AI</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">student_b.py</span>
                      <span className="text-destructive">89% AI ⚠️</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-info" />
                  Metadata
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">student_a submitted:</span>
                    <span className="text-foreground">Dec 15, 14:23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">student_b submitted:</span>
                    <span className="text-foreground">Dec 15, 16:47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time gap:</span>
                    <span className="text-warning">2h 24m 🚩</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Flag className="w-3 h-3 mr-1" />
                    Flag
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Plus className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
