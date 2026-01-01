import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Hero2 } from '@/components/ui/hero-2-1';
import { 
  Shield, 
  Brain, 
  Network, 
  FileText, 
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Generated Code Detection',
    description: 'Catch ChatGPT, Copilot, and other AI-written code with our advanced ML models trained on millions of samples.',
    color: 'text-primary',
  },
  {
    icon: Network,
    title: 'Collaboration Network Analysis',
    description: 'Visualize who copied from whom with interactive network graphs that reveal hidden patterns.',
    color: 'text-secondary',
  },
  {
    icon: FileText,
    title: 'Export-Ready Reports',
    description: 'Generate professional PDF reports for academic integrity committees in one click.',
    color: 'text-accent',
  },
];

const problems = [
  { icon: Clock, text: '5+ hours per assignment checking submissions manually' },
  { icon: Brain, text: 'Students using ChatGPT - nearly impossible to prove' },
  { icon: AlertTriangle, text: 'Traditional tools miss sophisticated cheaters' },
  { icon: Network, text: 'No way to track collaboration networks' },
];

const steps = [
  { step: 1, title: 'Upload', description: 'Drag & drop all student submissions' },
  { step: 2, title: 'Analyze', description: 'AI scans for plagiarism & AI patterns' },
  { step: 3, title: 'Review', description: 'Interactive dashboard shows results' },
  { step: 4, title: 'Export', description: 'Generate professional reports' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Hero2 Component */}
      <Hero2 />

      {/* Problem Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              The Modern Professor's Dilemma
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Traditional plagiarism tools weren't built for the AI age.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {problems.map((problem, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-xl glass-hover animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <problem.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="text-foreground-secondary">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Catch Cheaters
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powered by advanced machine learning and natural language processing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-xl glass-hover text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                  index === 0 ? 'bg-primary/10' : index === 1 ? 'bg-secondary/10' : 'bg-accent/10'
                }`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              From upload to report in under 5 minutes
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-hero flex items-center justify-center text-2xl font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-secondary/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl gradient-hero relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Save Time This Semester?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join 1,000+ professors who trust CodeGuard AI for their plagiarism detection needs.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 text-lg px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/60 text-sm mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">
                  Code<span className="text-primary">Guard</span> AI
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Advanced code plagiarism detection for the AI era.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              © 2026 CodeGuard AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
