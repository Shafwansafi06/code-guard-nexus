import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Brain, FileText, Network } from 'lucide-react';

// Simulated data for the preview
const mockStats = [
  { label: 'Files', value: 45, icon: FileText, color: 'text-primary' },
  { label: 'High Risk', value: 8, icon: AlertTriangle, color: 'text-destructive' },
  { label: 'AI Detected', value: 5, icon: Brain, color: 'text-warning' },
  { label: 'Clean', value: 32, icon: CheckCircle, color: 'text-success' },
];

const mockPairs = [
  { files: ['student_a.py', 'student_b.py'], similarity: 92, risk: 'high' },
  { files: ['student_c.java', 'student_d.java'], similarity: 87, risk: 'high' },
  { files: ['student_e.cpp', 'student_f.cpp'], similarity: 71, risk: 'medium' },
];

// Network graph nodes
const nodes = [
  { id: 1, x: 30, y: 40, size: 12, color: 'primary' },
  { id: 2, x: 70, y: 35, size: 10, color: 'destructive' },
  { id: 3, x: 50, y: 65, size: 11, color: 'destructive' },
  { id: 4, x: 25, y: 70, size: 9, color: 'success' },
  { id: 5, x: 75, y: 70, size: 10, color: 'warning' },
  { id: 6, x: 50, y: 30, size: 8, color: 'success' },
];

const edges = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 1, to: 3 },
  { from: 3, to: 5 },
  { from: 1, to: 4 },
  { from: 2, to: 6 },
];

export function DashboardPreview() {
  const [animatedValues, setAnimatedValues] = useState(mockStats.map(() => 0));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    mockStats.forEach((stat, index) => {
      const duration = 1500;
      const steps = 30;
      const increment = stat.value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          current = stat.value;
          clearInterval(interval);
        }
        setAnimatedValues(prev => {
          const newValues = [...prev];
          newValues[index] = Math.floor(current);
          return newValues;
        });
      }, duration / steps);
    });
  }, [isVisible]);

  return (
    <div className={`h-full flex flex-col transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {mockStats.map((stat, index) => (
          <div 
            key={index}
            className="p-2 rounded-lg bg-background-tertiary/50 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{animatedValues[index]}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-5 gap-2 p-3 pt-0">
        {/* Network Graph */}
        <div className="col-span-3 rounded-lg bg-background-tertiary/30 p-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            <Network className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Network Analysis</span>
          </div>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Edges */}
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth="0.5"
                  className="animate-fade-in"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                />
              );
            })}
            
            {/* Nodes */}
            {nodes.map((node, index) => (
              <g key={node.id} className="animate-scale-in" style={{ animationDelay: `${600 + index * 100}ms` }}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size / 2}
                  fill={`hsl(var(--${node.color}))`}
                  className="animate-pulse-glow"
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size / 2 + 2}
                  fill="none"
                  stroke={`hsl(var(--${node.color}) / 0.3)`}
                  strokeWidth="1"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Suspicious Pairs */}
        <div className="col-span-2 rounded-lg bg-background-tertiary/30 p-2">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-muted-foreground">High Risk Pairs</span>
          </div>
          
          <div className="space-y-1.5">
            {mockPairs.map((pair, index) => (
              <div 
                key={index}
                className={`p-1.5 rounded bg-background/50 border-l-2 animate-slide-up ${
                  pair.risk === 'high' ? 'border-l-destructive' : 'border-l-warning'
                }`}
                style={{ animationDelay: `${1000 + index * 150}ms` }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] font-medium ${
                    pair.risk === 'high' ? 'text-destructive' : 'text-warning'
                  }`}>
                    {pair.similarity}% Match
                  </span>
                </div>
                <p className="text-[8px] text-muted-foreground truncate">
                  {pair.files.join(' ↔ ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
