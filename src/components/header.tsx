
'use client';

import Link from 'next/link';
import { Sparkles, Menu, Bot, BookOpenCheck, FileText, MessageSquareQuote, Archive, Brain, History } from 'lucide-react'; // Added History
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle'; 

const navLinks = [
  { href: '/jarvis', label: 'Jarvis', icon: Bot },
  { href: '/jarvis-saved', label: 'Jarvis Archive', icon: Archive },
  { href: '/', label: 'Generate Questions', icon: Sparkles },
  { href: '/saved', label: 'Saved Questions', icon: BookOpenCheck },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/grammar', label: 'Grammar Helper', icon: MessageSquareQuote },
  { href: '/subject-expert', label: 'Subject Expert', icon: Brain },
  { href: '/subject-expert-saved', label: 'Expert Archive', icon: History }, // Added
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-baseline space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-bold sm:inline-block text-lg font-headline">
              MGQs
            </span>
            <span className="text-xs -mt-1 inline-block">
              <span className="font-bold text-red-600 dark:text-red-500">MEHDI</span>{' '}
              <span className="text-muted-foreground">
                <span className="font-bold text-primary">G</span>ave{' '}
                <span className="font-bold text-primary">Q</span>uestions
              </span>
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex flex-1 items-center space-x-4 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.icon && <link.icon className="mr-2 h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] p-6">
                 <SheetHeader className="mb-4">
                  <SheetTitle asChild>
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-bold text-md font-headline">MGQs</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center text-base font-medium transition-colors hover:text-primary py-2 px-2 rounded-md",
                        pathname === link.href ? "text-primary bg-muted" : "text-foreground/80 hover:bg-muted/50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                    >
                      {link.icon && <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pt-6">
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
