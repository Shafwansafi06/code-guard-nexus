import { useEffect, useState } from 'react';
import { Shield, Sparkles, Zap, Code2 } from 'lucide-react';
import { UploadZone } from '@/components/upload/UploadZone';
import { AdvancedOptions } from '@/components/upload/AdvancedOptions';
import { Button } from '@/components/ui/button';

const tagline = "Detect Plagiarism in the Age of ChatGPT";

export function HeroSection() {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= tagline.length) {
        setDisplayedText(tagline.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
        setIsTypingDone(true);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background Effects */}
      <div className="particles-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card pointer-events-none" />
      
      {/* Floating Elements */}
      <div className="absolute top-32 left-[10%] opacity-20 animate-float">
        <Code2 className="w-16 h-16 text-primary" />
      </div>
      <div className="absolute top-48 right-[15%] opacity-20 animate-float" style={{ animationDelay: '1s' }}>
        <Sparkles className="w-12 h-12 text-secondary" />
      </div>
      <div className="absolute bottom-32 left-[20%] opacity-20 animate-float" style={{ animationDelay: '2s' }}>
        <Zap className="w-10 h-10 text-accent" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Logo Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Shield className="w-20 h-20 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150" />
          </div>
        </div>

        {/* ASCII-style Title */}
        <div className="mb-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            <span className="gradient-text">Code</span>
            <span className="text-foreground">Guard</span>
            <span className="text-secondary ml-2">AI</span>
          </h1>
        </div>

        {/* Animated Tagline */}
        <div className="h-8 mb-8">
          <p className="text-xl md:text-2xl text-muted-foreground">
            {displayedText}
            <span className={`inline-block w-0.5 h-6 bg-primary ml-1 ${isTypingDone ? 'animate-pulse' : ''}`} />
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in" style={{ animationDelay: '1.5s' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">10M+</span> Files Analyzed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">98.7%</span> Accuracy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">500+</span> Institutions
            </span>
          </div>
        </div>

        {/* Upload Zone */}
        <UploadZone />

        {/* Advanced Options */}
        <AdvancedOptions />

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button variant="glass">
            <Sparkles className="w-4 h-4 mr-2" />
            View Demo
          </Button>
          <Button variant="ghost">
            Scan History
          </Button>
          <Button variant="ghost">
            Settings
          </Button>
        </div>
      </div>
    </section>
  );
}
