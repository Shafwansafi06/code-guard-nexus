import { useEffect, useRef } from 'react';
import { Settings, Download, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'original' | 'copied' | 'ai' | 'independent';
  label: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

const mockNodes: Node[] = [
  { id: '1', x: 200, y: 150, type: 'original', label: 'student_a.py' },
  { id: '2', x: 350, y: 100, type: 'copied', label: 'student_b.py' },
  { id: '3', x: 400, y: 220, type: 'ai', label: 'student_c.py' },
  { id: '4', x: 150, y: 280, type: 'independent', label: 'student_d.py' },
  { id: '5', x: 300, y: 300, type: 'copied', label: 'student_e.py' },
  { id: '6', x: 500, y: 180, type: 'independent', label: 'student_f.py' },
  { id: '7', x: 450, y: 320, type: 'ai', label: 'student_g.py' },
];

const mockEdges: Edge[] = [
  { source: '1', target: '2', weight: 0.92 },
  { source: '1', target: '5', weight: 0.78 },
  { source: '2', target: '3', weight: 0.65 },
  { source: '3', target: '7', weight: 0.85 },
  { source: '4', target: '5', weight: 0.45 },
  { source: '5', target: '7', weight: 0.55 },
];

const typeColors: Record<string, string> = {
  original: '#00F0FF',
  copied: '#FF4757',
  ai: '#B24BF3',
  independent: '#2ECC71',
};

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw edges
      mockEdges.forEach(edge => {
        const source = mockNodes.find(n => n.id === edge.source);
        const target = mockNodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${edge.weight * 0.5})`;
        ctx.lineWidth = edge.weight * 3;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time * 10;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      mockNodes.forEach((node, i) => {
        const floatY = Math.sin(time + i * 0.5) * 3;
        const y = node.y + floatY;

        // Glow
        const gradient = ctx.createRadialGradient(node.x, y, 0, node.x, y, 30);
        gradient.addColorStop(0, typeColors[node.type] + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, y, 30, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = typeColors[node.type];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, y + 28);
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
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
      <div className="relative h-[400px] bg-background/50">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 border-t border-border/50">
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
