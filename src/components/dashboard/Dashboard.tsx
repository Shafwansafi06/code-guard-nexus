import { FileText, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { SimilarityPairCard } from './SimilarityPairCard';
import { NetworkGraph } from './NetworkGraph';
import { CodeEditorDialog } from './CodeEditorDialog';
import { CodeComparisonDialog } from './CodeComparisonDialog';
import { useState } from 'react';

const mockPairs = [
  {
    fileA: 'student_a.py',
    fileB: 'student_b.py',
    similarity: 92,
    matches: ['Variable names', 'Logic flow', 'Comments'],
    aiPattern: 87,
  },
  {
    fileA: 'student_c.java',
    fileB: 'student_d.java',
    similarity: 89,
    matches: ['Function structure', 'Error handling'],
    aiPattern: 23,
  },
  {
    fileA: 'student_e.cpp',
    fileB: 'student_f.cpp',
    similarity: 76,
    matches: ['Algorithm', 'Naming convention'],
  },
  {
    fileA: 'student_g.py',
    fileB: 'student_h.py',
    similarity: 68,
    matches: ['Import statements', 'Class structure'],
  },
];

const mockCode: Record<string, string> = {
  'student_a.py': `def calculate_average(scores):
    # This function calculates the mean of a list of numbers
    total = 0
    for s in scores:
        total += s
    
    avg = total / len(scores)
    return avg

def process_data(data):
    # Main processing loop
    results = []
    for item in data:
        res = calculate_average(item['scores'])
        results.append(res)
    return results`,
  'student_b.py': `def get_mean_value(values):
    # This function calculates the mean of a list of numbers
    sum_val = 0
    for v in values:
        sum_val += v
    
    mean = sum_val / len(values)
    return mean

def handle_items(items):
    # Main processing loop
    output = []
    for x in items:
        val = get_mean_value(x['scores'])
        output.append(val)
    return output`,
  'student_c.java': `public class DataProcessor {
    public double calculateMean(List<Double> numbers) {
        double sum = 0;
        for (Double n : numbers) {
            sum += n;
        }
        return sum / numbers.size();
    }
}`,
  'student_d.java': `public class Analyzer {
    public double getAverage(List<Double> vals) {
        double total = 0;
        for (Double v : vals) {
            total += v;
        }
        return total / vals.size();
    }
}`
};

export function Dashboard() {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [comparePair, setComparePair] = useState<{ fileA: string, fileB: string, similarity: number } | null>(null);

  const handlePreview = (filename: string) => {
    setPreviewFile(filename);
  };

  const handleCompare = (pair: typeof mockPairs[0]) => {
    setComparePair({
      fileA: pair.fileA,
      fileB: pair.fileB,
      similarity: pair.similarity
    });
  };

  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Analysis Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time insights into code similarity patterns and AI detection results
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            icon={FileText}
            label="Total Files"
            value={45}
            sublabel="analyzed"
            variant="default"
            delay={0}
          />
          <StatCard
            icon={AlertTriangle}
            label="High Risk"
            value={8}
            sublabel="pairs detected"
            variant="danger"
            delay={100}
          />
          <StatCard
            icon={AlertCircle}
            label="Medium Risk"
            value={12}
            sublabel="pairs detected"
            variant="warning"
            delay={200}
          />
          <StatCard
            icon={CheckCircle}
            label="Low Risk"
            value={25}
            sublabel="pairs detected"
            variant="success"
            delay={300}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Network Graph */}
          <div className="lg:col-span-3">
            <NetworkGraph />
          </div>

          {/* Suspicious Pairs List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                High Risk Pairs
              </h3>
              <select className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground">
                <option>Similarity ↓</option>
                <option>AI Pattern ↓</option>
                <option>File Name</option>
              </select>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {mockPairs.map((pair, index) => (
                <SimilarityPairCard
                  key={index}
                  {...pair}
                  index={index}
                  onPreview={handlePreview}
                  onCompare={() => handleCompare(pair)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <CodeEditorDialog
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          filename={previewFile || ''}
          code={previewFile ? (mockCode[previewFile] || '# No code available for this mock') : ''}
          language={previewFile?.endsWith('.py') ? 'python' : previewFile?.endsWith('.java') ? 'java' : 'cpp'}
        />

        <CodeComparisonDialog
          open={!!comparePair}
          onOpenChange={(open) => !open && setComparePair(null)}
          fileA={comparePair?.fileA || ''}
          fileB={comparePair?.fileB || ''}
          codeA={comparePair ? (mockCode[comparePair.fileA] || '# Original code\ndef dummy(): pass') : ''}
          codeB={comparePair ? (mockCode[comparePair.fileB] || '# Copied code\ndef dummy(): pass') : ''}
          similarity={comparePair?.similarity || 0}
        />
      </div>
    </section>
  );
}
