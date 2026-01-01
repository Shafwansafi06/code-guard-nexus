import { useState } from 'react';
import { ChevronDown, Cpu, Globe, Brain, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const languages = [
  { id: 'python', label: 'Python', checked: true },
  { id: 'java', label: 'Java', checked: true },
  { id: 'cpp', label: 'C++', checked: true },
  { id: 'javascript', label: 'JavaScript', checked: false },
  { id: 'typescript', label: 'TypeScript', checked: false },
  { id: 'go', label: 'Go', checked: false },
  { id: 'rust', label: 'Rust', checked: false },
];

const algorithms = [
  { id: 'dbscan', label: 'DBSCAN', description: 'Density-based clustering' },
  { id: 'hierarchical', label: 'Hierarchical', description: 'Tree-based clustering' },
  { id: 'kmeans', label: 'K-Means', description: 'Centroid clustering' },
];

export function AdvancedOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const [sensitivity, setSensitivity] = useState([85]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('hierarchical');
  const [selectedLanguages, setSelectedLanguages] = useState(
    languages.filter(l => l.checked).map(l => l.id)
  );

  const toggleLanguage = (id: string) => {
    setSelectedLanguages(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <span>Advanced Options</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Options Panel */}
      {isOpen && (
        <div className="mt-4 glass rounded-xl p-6 space-y-6 animate-fade-in">
          {/* Sensitivity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Detection Sensitivity</span>
              </div>
              <span className="text-sm font-mono text-primary">{sensitivity}%</span>
            </div>
            <Slider
              value={sensitivity}
              onValueChange={setSensitivity}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher sensitivity catches more potential matches but may include false positives
            </p>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Languages to Analyze</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => toggleLanguage(lang.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border transition-all duration-200",
                    selectedLanguages.includes(lang.id)
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Detection Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-secondary" />
              <div>
                <span className="text-sm font-medium text-foreground">AI Detection</span>
                <p className="text-xs text-muted-foreground">Detect AI-generated code patterns</p>
              </div>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>

          {/* Algorithm Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Clustering Algorithm</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {algorithms.map(algo => (
                <button
                  key={algo.id}
                  onClick={() => setSelectedAlgorithm(algo.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all duration-200",
                    selectedAlgorithm === algo.id
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    selectedAlgorithm === algo.id ? "text-primary" : "text-foreground"
                  )}>
                    {algo.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{algo.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Button */}
          <Button variant="hero" size="lg" className="w-full">
            Scan All Files
          </Button>
        </div>
      )}
    </div>
  );
}
