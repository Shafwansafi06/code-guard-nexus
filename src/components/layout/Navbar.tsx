import { useState } from 'react';
import { Shield, LayoutDashboard, Search, History, Settings, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, href: '#dashboard' },
  { label: 'Analysis', icon: <Search className="w-4 h-4" />, href: '#analysis' },
  { label: 'History', icon: <History className="w-4 h-4" />, href: '#history' },
  { label: 'Settings', icon: <Settings className="w-4 h-4" />, href: '#settings' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border/50">
      <div className="container h-full mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-primary">Code</span>
            <span className="text-foreground">Guard</span>
            <span className="text-secondary ml-1">AI</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                activeItem === item.label
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" className="hidden sm:flex">
            Start Scan
          </Button>
          <Button variant="glass" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 glass border-b border-border/50 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveItem(item.label);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                  activeItem === item.label
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <Button variant="hero" className="mt-2">
              Start Scan
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
