import { FileCode, AlertTriangle, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimilarityPairCardProps {
  fileA: string;
  fileB: string;
  similarity: number;
  matches: string[];
  aiPattern?: number;
  index?: number;
}

export function SimilarityPairCard({
  fileA,
  fileB,
  similarity,
  matches,
  aiPattern,
  index = 0
}: SimilarityPairCardProps) {
  const getRiskLevel = () => {
    if (similarity >= 85) return 'high';
    if (similarity >= 60) return 'medium';
    return 'low';
  };

  const risk = getRiskLevel();

  const riskStyles = {
    high: 'similarity-card high-risk',
    medium: 'similarity-card medium-risk',
    low: 'similarity-card low-risk',
  };

  const riskBadgeStyles = {
    high: 'bg-destructive/20 text-destructive border-destructive/30',
    medium: 'bg-warning/20 text-warning border-warning/30',
    low: 'bg-success/20 text-success border-success/30',
  };

  return (
    <div
      className={cn(riskStyles[risk], "animate-slide-up")}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-semibold border",
          riskBadgeStyles[risk]
        )}>
          {risk === 'high' && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />}
          {similarity}% Similar
        </div>
        {aiPattern && aiPattern > 70 && (
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <Brain className="w-3.5 h-3.5" />
            <span>{aiPattern}% AI</span>
          </div>
        )}
      </div>

      {/* File Names */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileCode className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-mono text-foreground truncate">{fileA}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileCode className="w-4 h-4 text-accent flex-shrink-0" />
          <span className="text-sm font-mono text-foreground truncate">{fileB}</span>
        </div>
      </div>

      {/* Similarity Bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            risk === 'high' && "bg-gradient-to-r from-destructive to-accent",
            risk === 'medium' && "bg-gradient-to-r from-warning to-warning/70",
            risk === 'low' && "bg-gradient-to-r from-success to-success/70"
          )}
          style={{ width: `${similarity}%` }}
        />
      </div>

      {/* Matches */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {matches.map((match, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
          >
            {match}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          Preview
        </Button>
        <Button variant="default" size="sm" className="flex-1">
          Compare
        </Button>
        <Button variant="ghost" size="sm">
          Report
        </Button>
      </div>
    </div>
  );
}
