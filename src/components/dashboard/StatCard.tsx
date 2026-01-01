import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  sublabel: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, sublabel, variant = 'default', delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const variantStyles = {
    default: 'border-primary/30 hover:border-primary/50',
    danger: 'border-destructive/30 hover:border-destructive/50',
    warning: 'border-warning/30 hover:border-warning/50',
    success: 'border-success/30 hover:border-success/50',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    danger: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  };

  const valueStyles = {
    default: 'text-primary',
    danger: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
  };

  return (
    <div className={cn(
      "stat-card border animate-fade-in",
      variantStyles[variant]
    )} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          iconStyles[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      
      <div className="mt-4">
        <div className={cn(
          "text-4xl font-bold font-mono",
          valueStyles[variant]
        )}>
          {displayValue}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{sublabel}</p>
      </div>
    </div>
  );
}
