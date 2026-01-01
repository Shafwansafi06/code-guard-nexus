import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CodeComparison } from '@/components/comparison/CodeComparison';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <Dashboard />
        <CodeComparison />
      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-border/50 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                © 2026 CodeGuard AI. Built for the future of academic integrity.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-mono">v1.0.0-hackathon</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
