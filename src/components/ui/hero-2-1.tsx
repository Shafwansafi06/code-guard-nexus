"use client";

import { useState } from "react";
import { ArrowRight, Menu, X, Shield, Play, CheckCircle, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "./button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient background with grain effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xl font-bold">
                  Code<span className="text-primary">Guard</span> AI
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <div className="flex gap-6">
                  <NavItem label="Features" />
                  <NavItem label="How It Works" />
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

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Toggle menu</span>
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Menu with animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-0 z-40 md:hidden"
            >
              <div className="absolute inset-0 bg-background/95 backdrop-blur-md pt-20">
                <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
                  <Link to="/" className="flex items-center gap-2">
                    <Shield className="w-7 h-7 text-primary" />
                    <span className="text-lg font-bold">
                      Code<span className="text-primary">Guard</span> AI
                    </span>
                  </Link>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-6 h-6 text-foreground" />
                  </button>
                </div>

                <div className="px-4 py-6 space-y-4">
                  <MobileNavItem label="Features" />
                  <MobileNavItem label="How It Works" />

                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <Link to="/login" className="block">
                      <Button variant="outline" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/signup" className="block">
                      <Button variant="hero" className="w-full">Get Started Free</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center pt-28 pb-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">
              Built for the AI era — Detect ChatGPT code instantly
            </span>
          </div>
        </motion.div>

        {/* Hero section */}
        <div className="container mx-auto px-4 pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-tight"
          >
            Stop Spending{" "}
            <span className="gradient-text">5 Hours</span>
            <br />
            Grading Assignments
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-6"
          >
            Detect plagiarism and AI-generated code in{" "}
            <span className="text-primary font-semibold">5 minutes</span>.
            Our tool redefines academic integrity for professors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link to="/signup">
              <Button variant="hero" size="lg" className="gap-2 text-lg px-8">
                Start Your Free Scan
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="glass" size="lg" className="gap-2 text-lg px-8">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative mt-16 max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-60" />
            
            {/* Hero Image */}
            <div className="relative rounded-xl overflow-hidden glass p-2">
              <div className="rounded-lg overflow-hidden border border-border/50 bg-background-secondary">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background-tertiary/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                  <span className="ml-4 text-xs text-muted-foreground font-mono">dashboard.codeguard.ai</span>
                </div>
                <div className="aspect-video bg-gradient-to-br from-background-secondary to-background-tertiary">
                  <DashboardPreview />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

function NavItem({ label }: { label: string }) {
  return (
    <a 
      href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {label}
    </a>
  );
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <a 
      href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="flex items-center justify-between py-3 text-lg text-foreground border-b border-border/30"
    >
      {label}
      <ArrowRight className="w-5 h-5 text-muted-foreground" />
    </a>
  );
}

export { Hero2 };
