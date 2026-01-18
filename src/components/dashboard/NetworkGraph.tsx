import { useEffect, useRef } from 'react';
import { Settings, Download, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Node {
  id: string;
  x?: number;
  y?: number;
  type: 'original' | 'copied' | 'ai' | 'independent';
  label: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

interface NetworkGraphProps {
  nodes?: Node[];
  edges?: Edge[];
  height?: number;
}

const typeColors: Record<string, string> = {
  original: '#00F0FF',
  copied: '#FF4757',
  ai: '#B24BF3',
  independent: '#2ECC71',
};

export function NetworkGraph({ nodes = [], edges = [], height = 400 }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Initial project of nodes onto a circular or grid layout if no x,y
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const h = rect.height;

    const positionedNodes = nodes.map((node, i) => {
      if (node.x !== undefined && node.y !== undefined) return { ...node } as Required<Node>;

      // Simple circle layout
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = Math.min(width, h) * 0.35;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius
      } as Required<Node>;
    });

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, h);

      // Draw edges
      edges.forEach(edge => {
        const source = positionedNodes.find(n => n.id === edge.source);
        const target = positionedNodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${edge.weight * 0.5})`;
        ctx.lineWidth = Math.max(1, edge.weight * 4);
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time * 10;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      positionedNodes.forEach((node, i) => {
        const floatY = Math.sin(time + i * 0.5) * 3;
        const currentY = node.y + floatY;

        // Glow
        const gradient = ctx.createRadialGradient(node.x, currentY, 0, node.x, currentY, 30);
        gradient.addColorStop(0, (typeColors[node.type] || '#FFFFFF') + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, currentY, 30, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, currentY, 12, 0, Math.PI * 2);
        ctx.fillStyle = typeColors[node.type] || '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, currentY + 28);
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateSize);
    };
  }, [nodes, edges]);

  return (
    <div ref={containerRef} className="glass rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Collaboration Network</h3>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Graph */}
      <div className="relative flex-1 bg-background/20 min-h-[300px]" style={{ height: `${height}px` }}>
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No analysis data available</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 border-t border-border/50 bg-card/20">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
