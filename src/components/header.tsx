
'use client';

import Link from 'next/link';
import {
  Sparkles, Menu, Bot, BookOpenCheck, FileText, MessageSquareQuote, Archive, Brain, History, User, PenSquare, ClipboardCheck, Heart, LogOut, Layers, SpellCheck, GraduationCap, LogIn, Trophy, LayoutGrid, Award, Lightbulb, Target, RotateCw, Ticket, Building, FileQuestion
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle'; 
import { useUser, getXpForLevel } from '@/contexts/user-context';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from './ui/progress';
import { BADGE_DEFINITIONS } from '@/lib/constants';

const mainFeatures = [
  { href: '/home', label: 'Dashboard', icon: LayoutGrid },
  { href: '/streams', label: 'Study Streams', icon: Target },
  { href: '/board-exams', label: 'Board Exams', icon: Building },
  { href: '/mock-test', label: 'Mock Tests', icon: ClipboardCheck },
  { href: '/generate', label: 'Generate Questions', icon: Sparkles },
  { href: '/wrong-questions', label: 'Wrong Questions', icon: RotateCw },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const allToolsLinks = [
  { href: '/rewards/spin-wheel', label: 'Spin The Wheel', icon: Ticket },
  { href: '/achievements', label: 'Achievements', icon: Award },
  { href: '/saved', label: 'Saved Questions', icon: BookOpenCheck },
  { href: '/saved-board-questions', label: 'Board Saver', icon: FileQuestion },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/notes-ai', label: 'AI Notes Generator', icon: PenSquare },
  { href: '/grammar', label: 'Grammar Helper', icon: MessageSquareQuote },
  { href: '/grammar-test', label: 'Grammar Test', icon: SpellCheck },
  { href: '/topic-to-questions', label: 'Topic to Questions', icon: Lightbulb },
  { href: '/subject-expert', label: 'Ask an Expert', icon: Brain },
  { href: '/subject-expert-saved', label: 'Expert Archive', icon: History },
  { href: '/jarvis', label: 'Jarvis', icon: Bot },
  { href: '/jarvis-saved', label: 'Jarvis Archive', icon: Archive },
  { href: '/donation', label: 'Donate', icon: Heart },
];

const UserProgress = ({ user }: { user: NonNullable<ReturnType<typeof useUser>['user']> }) => {
    const { currentLevelStart, nextLevelTarget } = getXpForLevel(user.level);
    const xpProgress = ((user.xp - currentLevelStart) / (nextLevelTarget - currentLevelStart)) * 100;

    return (
        <div className="px-2 py-1.5 text-sm">
            <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold">Level {user.level}</span>
                <span className="text-xs text-muted-foreground font-medium">{user.xp.toLocaleString()} / {nextLevelTarget.toLocaleString()} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
        </div>
    );
};

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isInitialized, logout } = useUser();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 max-w-screen-2xl items-center justify-between">
        
        {/* LEFT SECTION */}
        <div className="flex items-center">
          <Link href="/home" className="mr-6 flex items-center space-x-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <div>
              <span className="font-bold sm:inline-block text-xl font-headline">
                MGQ
              </span>
              <p className="text-xs text-primary font-bold tracking-wide -mt-1">
                MEHDI Gave Question
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
            {mainFeatures.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    {link.label}
                </Link>
            ))}
          </nav>
        </div>
        
        {/* RIGHT SECTION */}
        <div className="flex items-center justify-end space-x-2 md:space-x-4">
          <ThemeToggle />
           <div>
              {!isInitialized ? (
                 <Skeleton className="h-10 w-24 rounded-md" />
              ) : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-offset-2 ring-offset-background ring-primary">
                            <AvatarImage src={user.avatarUrl} alt={user.fullName} data-ai-hint="student avatar" />
                            <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <UserProgress user={user} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="w-full flex">
                            <User className="mr-2 h-4 w-4" />Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" className="font-bold">
                    <Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Sign In</Link>
                </Button>
              )}
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent focus-visible:ring-primary" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 flex flex-col bg-card">
                 <SheetHeader className="p-4 border-b">
                  <SheetTitle asChild>
                    <Link href="/home" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <GraduationCap className="h-7 w-7 text-primary" />
                        <div>
                          <span className="font-bold text-lg font-headline text-foreground">MGQ</span>
                          <p className="text-xs text-primary font-bold tracking-wide -mt-1">MEHDI Gave Question</p>
                        </div>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {isInitialized && user ? (
                  <>
                    <div className="p-4 border-b">
                        <div>
                          <Link href="/account" className="flex items-center p-2 rounded-md hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
                              <Avatar className="h-9 w-9 mr-3">
                                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                  <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-foreground">{user.fullName}</p>
                                      {(() => {
                                          const badgeInfo = user.equippedBadge ? BADGE_DEFINITIONS[user.equippedBadge] : null;
                                          if (!badgeInfo) return null;
                                          return (
                                            <badgeInfo.icon className="w-4 h-4 text-primary" />
                                          );
                                      })()}
                                  </div>
                                  <p className="text-sm text-muted-foreground">View Account</p>
                              </div>
                          </Link>
                          <div className="mt-2">
                              <UserProgress user={user} />
                          </div>
                        </div>
                    </div>
                    <nav className="flex flex-col space-y-1 p-4 flex-grow overflow-y-auto">
                      <p className="text-xs font-semibold text-muted-foreground px-2 pt-2 pb-1 uppercase">Features</p>
                      {[...mainFeatures].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center text-base font-medium transition-colors hover:text-primary py-2 px-2 rounded-md text-foreground/80 hover:bg-muted"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                          {link.label}
                        </Link>
                      ))}
                       <p className="text-xs font-semibold text-muted-foreground px-2 pt-4 pb-1 uppercase">All Tools</p>
                       {[...allToolsLinks].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center text-base font-medium transition-colors hover:text-primary py-2 px-2 rounded-md text-foreground/80 hover:bg-muted"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="p-4 border-t">
                        <Button variant="ghost" className="w-full justify-start text-foreground/80" onClick={handleLogout}>
                            <LogOut className="mr-3 h-5 w-5"/> Logout
                        </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 flex flex-col gap-4">
                     <Button asChild className="w-full" variant="accent" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4"/> Login / Sign Up</Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
