import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Brain, 
  Network, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Clock,
  Users,
  AlertTriangle,
  Zap,
  Lock,
  BarChart3,
  Quote
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

const testimonials = [
  {
    quote: "Saved me 10 hours on the last assignment! Finally caught students using ChatGPT.",
    author: "Dr. Sarah Chen",
    role: "CS Professor, Stanford University",
  },
  {
    quote: "The network analysis feature is incredible. I can see exactly who copied from whom.",
    author: "Prof. Michael Roberts",
    role: "Department Head, MIT",
  },
  {
    quote: "Essential tool for the age of AI. Our department now requires it for all courses.",
    author: "Dr. Emily Johnson",
    role: "Academic Integrity Officer, Berkeley",
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['50 files/month', '1 course', 'Basic AI detection', 'Email support'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited files', 'Unlimited courses', 'Full AI detection', 'Network analysis', 'Priority support', 'Export reports'],
    cta: 'Start 14-Day Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'White-label option', 'SSO integration', 'Dedicated support', 'Custom training', 'API access'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const logos = [
  { name: 'MIT', abbr: 'MIT' },
  { name: 'Stanford', abbr: 'STANFORD' },
  { name: 'Berkeley', abbr: 'BERKELEY' },
  { name: 'Carnegie Mellon', abbr: 'CMU' },
  { name: 'Georgia Tech', abbr: 'GT' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Shield className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 w-8 h-8 text-primary animate-pulse-glow rounded-full" />
              </div>
              <span className="text-xl font-bold">
                Code<span className="text-primary">Guard</span> AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">Try Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 particles-bg" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                Trusted by 1,000+ CS Professors Worldwide
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Stop Spending{' '}
              <span className="gradient-text">5 Hours</span>
              <br />
              Grading Assignments
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-up stagger-1">
              Detect plagiarism and AI-generated code in{' '}
              <span className="text-primary font-semibold">5 minutes</span>.
              <br />
              Built for the ChatGPT era.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up stagger-2">
              <Link to="/signup">
                <Button variant="hero" size="lg" className="gap-2 text-lg px-8">
                  Start Free Scan
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="gap-2 text-lg px-8">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-slide-up stagger-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>AI-Generated Code Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Collaboration Network Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Export-Ready Reports</span>
              </div>
            </div>
          </div>

          {/* Product Screenshot Preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-slide-up stagger-4">
            <div className="relative rounded-xl overflow-hidden glass p-2">
              <div className="rounded-lg overflow-hidden border border-border/50 bg-background-secondary">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background-tertiary/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                  <span className="ml-4 text-xs text-muted-foreground font-mono">dashboard.codeguard.ai</span>
                </div>
                <div className="aspect-video bg-gradient-to-br from-background-secondary to-background-tertiary flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border/50 bg-background-secondary/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">Trusted by leading universities worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {logos.map((logo) => (
              <div key={logo.name} className="text-2xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                {logo.abbr}
              </div>
            ))}
          </div>
        </div>
      </section>

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
      <section className="py-20">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-xl ${
                  plan.popular 
                    ? 'gradient-border glow-primary' 
                    : 'glass'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-hero text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? 'hero' : 'outline'} 
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Professors
            </h2>
            <p className="text-muted-foreground">
              Join thousands of educators saving time every semester
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 rounded-xl glass-hover"
              >
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-foreground-secondary mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
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
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
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
