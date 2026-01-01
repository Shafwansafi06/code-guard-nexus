import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, Video, MessageCircle, Mail, FileText, Zap, Shield, Brain, Network } from 'lucide-react';

const faqs = [
  {
    question: "How does AI-generated code detection work?",
    answer: "Our AI detection uses machine learning models trained on millions of code samples to identify patterns typical of ChatGPT, GitHub Copilot, and other AI assistants. It analyzes coding style, variable naming, comment patterns, and structural characteristics."
  },
  {
    question: "What file formats are supported?",
    answer: "CodeGuard AI supports Python (.py), Java (.java), C++ (.cpp), C (.c), JavaScript (.js), TypeScript (.ts), Go (.go), Rust (.rs), and many more. You can upload individual files, ZIP archives, or entire folders."
  },
  {
    question: "How is the similarity percentage calculated?",
    answer: "Similarity is calculated using a combination of lexical (text-based), syntactic (structure-based), and semantic (meaning-based) analysis. The final score is a weighted average that accounts for variable renaming, code restructuring, and other obfuscation techniques."
  },
  {
    question: "Can I compare submissions across different semesters?",
    answer: "Yes! Pro and Enterprise plans include cross-semester comparison. This helps detect cases where students copy from previous years' submissions."
  },
  {
    question: "How do I export reports for academic integrity committees?",
    answer: "Click the 'Export Report' button on any analysis results page. You can generate PDF reports with executive summaries, detailed findings, and side-by-side code comparisons."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. All submissions are encrypted at rest and in transit. We never share your data with third parties, and you can delete all your data at any time. We're SOC 2 Type II compliant."
  },
];

const guides = [
  { icon: Zap, title: "Quick Start Guide", description: "Get up and running in 5 minutes" },
  { icon: Brain, title: "Understanding AI Detection", description: "Learn how we detect AI-generated code" },
  { icon: Network, title: "Network Analysis", description: "Interpret collaboration graphs" },
  { icon: FileText, title: "Generating Reports", description: "Create professional PDF reports" },
];

export default function Help() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground">Find answers, learn best practices, and get support.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search for help..." 
            className="pl-12 py-6 text-lg"
          />
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guides.map((guide, index) => (
            <button
              key={index}
              className="p-5 rounded-xl glass-hover text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <guide.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1">{guide.title}</h3>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="p-6 rounded-xl glass">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl glass-hover text-center">
            <Video className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium mb-1">Video Tutorials</h3>
            <p className="text-sm text-muted-foreground mb-3">Watch step-by-step guides</p>
            <Button variant="outline" size="sm">Watch Now</Button>
          </div>
          
          <div className="p-6 rounded-xl glass-hover text-center">
            <MessageCircle className="w-8 h-8 text-secondary mx-auto mb-3" />
            <h3 className="font-medium mb-1">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">Chat with our support team</p>
            <Button variant="outline" size="sm">Start Chat</Button>
          </div>
          
          <div className="p-6 rounded-xl glass-hover text-center">
            <Mail className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-medium mb-1">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">Get help via email</p>
            <Button variant="outline" size="sm">Contact Us</Button>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="p-6 rounded-xl gradient-card border border-border/50 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is available Monday-Friday, 9am-6pm EST.
          </p>
          <Button variant="hero">Contact Support</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
