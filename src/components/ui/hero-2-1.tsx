import { useState } from "react";
import { ArrowRight, Menu, X, Shield, Play, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "./button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Warm gradient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-[hsl(35_100%_50%_/_0.15)] rounded-full blur-[150px]" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-[hsl(340_65%_50%_/_0.12)] rounded-full blur-[130px]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[hsl(280_60%_50%_/_0.08)] rounded-full blur-[120px]" />
      </div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  CodeGuard AI
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <div className="flex gap-6">
                  <NavItem label="Features" />
                  <NavItem label="How It Works" />
                </div>

                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-full px-6">
                    Login
                  </Button>
                </Link>
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
              <div className="absolute inset-0 bg-background/98 backdrop-blur-md pt-20">
                <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
                  <Link to="/" className="flex items-center gap-2">
                    <Shield className="w-7 h-7 text-primary" />
                    <span className="text-lg font-semibold">CodeGuard AI</span>
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
                      <Button variant="outline" className="w-full rounded-full">Login</Button>
                    </Link>
                    <Link to="/signup" className="block">
                      <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
                        Get Started Free
                      </Button>
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
          className="flex justify-center pt-28 pb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              Join the revolution today!
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Hero section */}
        <div className="container mx-auto px-4 pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-[1.1] tracking-tight"
          >
            Unbeatable Detection for{" "}
            <span className="gradient-text">Academic Integrity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6"
          >
            Delivering unmatched plagiarism detection every day at unbeatable speed.
            Our tool redefines academic integrity. Now!!!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90">
                Start Your 7 Day Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full px-8 gap-2">
              <Play className="w-4 h-4" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
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
            {/* Dashboard Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl">
              <div className="aspect-[16/10]">
                <DashboardPreview />
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
      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm"
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
