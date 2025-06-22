'use client';

import Link from 'next/link';
import { Sparkles, Menu, Bot, BookOpenCheck, FileText, MessageSquareQuote, Archive, Brain, History, User, Users, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle'; 
import { useUser } from '@/contexts/user-context';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/saved', label: 'Saved Questions', icon: BookOpenCheck },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/community', label: 'Community', icon: Users },
];

const moreToolsLinks = [
  { href: '/grammar', label: 'Grammar Helper', icon: MessageSquareQuote },
  { href: '/subject-expert', label: 'Subject Expert', icon: Brain },
  { href: '/subject-expert-saved', label: 'Expert Archive', icon: History },
  { href: '/jarvis', label: 'Jarvis', icon: Bot },
  { href: '/jarvis-saved', label: 'Jarvis Archive', icon: Archive },
];


export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isInitialized } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/generate" className="mr-6 flex items-baseline space-x-2">
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60 p-0 h-auto px-2 py-1">
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        More Tools
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {moreToolsLinks.map((link) => (
                         <DropdownMenuItem key={link.href} asChild>
                             <Link href={link.href} className="w-full flex">
                                <link.icon className="mr-2 h-4 w-4" />
                                {link.label}
                             </Link>
                         </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <ThemeToggle />
           <div className="hidden md:block">
              {isInitialized && user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-9 w-9 cursor-pointer">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/account" className="w-full flex"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                  <Skeleton className="h-9 w-9 rounded-full" />
              )}
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] p-6 flex flex-col">
                 <SheetHeader className="mb-4">
                  <SheetTitle asChild>
                    <Link href="/generate" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-bold text-md font-headline">MGQs</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-3">
                  {[...navLinks, ...moreToolsLinks].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center text-base font-medium transition-colors hover:text-primary py-2 px-2 rounded-md",
                        pathname === link.href ? "text-primary bg-muted" : "text-foreground/80 hover:bg-muted/50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon && <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto pt-6 border-t">
                  {isInitialized && user ? (
                      <div>
                        <Link href="/account" className="flex items-center p-2 rounded-md hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
                            <Avatar className="h-9 w-9 mr-3">
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.username}</p>
                                <p className="text-sm text-muted-foreground">View Account</p>
                            </div>
                        </Link>
                      </div>
                  ) : (
                      <div className="flex items-center p-2">
                          <Skeleton className="h-9 w-9 rounded-full mr-3" />
                          <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-20" />
                          </div>
                      </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
