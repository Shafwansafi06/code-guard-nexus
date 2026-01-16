import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Shield, Info } from 'lucide-react';
import { AIDetectionResponse } from '@/lib/api';

interface AIDetectionCardProps {
  detection: AIDetectionResponse;
  studentName?: string;
}

export function AIDetectionCard({ detection, studentName }: AIDetectionCardProps) {
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500';
    if (score >= 0.6) return 'bg-orange-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>AI Detection Analysis</CardTitle>
          </div>
          {getRiskIcon(detection.risk_level)}
        </div>
        {studentName && (
          <CardDescription>Analysis for {studentName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Level Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Risk Level</span>
          <Badge variant={getRiskColor(detection.risk_level)}>
            {detection.risk_level.toUpperCase()}
          </Badge>
        </div>

        {/* Risk Description */}
        <p className="text-sm text-muted-foreground">
          {detection.risk_description}
        </p>

        {/* AI Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">AI-Generated Likelihood</span>
            <span className="text-muted-foreground">
              {(detection.ai_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor(detection.ai_score)} transition-all`}
              style={{ width: `${detection.ai_score * 100}%` }}
            />
          </div>
        </div>

        {/* Human Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Human-Written Likelihood</span>
            <span className="text-muted-foreground">
              {(detection.human_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${detection.human_score * 100}%` }}
            />
          </div>
        </div>

        {/* Confidence Score */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Confidence</span>
            <span className="font-bold text-foreground">
              {(detection.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Note / Model Info */}
        {detection.note && (
          <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary/80 leading-relaxed italic">
              {detection.note}
            </p>
          </div>
        )}

        {/* Classification */}
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <span className="text-sm font-medium">Classification</span>
          <Badge variant={detection.is_ai ? 'destructive' : 'secondary'}>
            {detection.is_ai ? 'AI-Generated' : 'Human-Written'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
