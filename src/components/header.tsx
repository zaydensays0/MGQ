
'use client';

import Link from 'next/link';
import { Sparkles, Menu, Bot, BookOpenCheck, FileText, MessageSquareQuote, Archive, Brain, History, User, Users, LayoutGrid, Trophy, PenSquare, ClipboardCheck, Heart, MessageSquare, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle'; 
import { useUser, getXpForLevel } from '@/contexts/user-context';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/generate', label: 'Generate', icon: Sparkles },
  { href: '/saved', label: 'Saved Questions', icon: BookOpenCheck },
  { href: '/notes', label: 'Notes', icon: FileText },
];

const moreToolsLinks = [
  { href: '/mock-test', label: 'Mock Test', icon: ClipboardCheck },
  { href: '/notes-ai', label: 'AI Notes Generator', icon: PenSquare },
  { href: '/grammar', label: 'Grammar Helper', icon: MessageSquareQuote },
  { href: '/subject-expert', label: 'Subject Expert', icon: Brain },
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
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isInitialized, logout } = useUser();

  const handleLogout = () => {
    logout();
    // In a real app with a login page, you'd redirect.
    // Here we just reload to reset to the default user state.
    window.location.reload(); 
  };

  const getIsActive = (href: string) => {
    if (href === '/groups') {
      return pathname.startsWith('/groups');
    }
    return pathname.startsWith(href);
  };


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
        
        {isInitialized && user && (
          <nav className="hidden md:flex flex-1 items-center space-x-4 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center transition-colors hover:text-foreground/80",
                  getIsActive(link.href) ? "text-foreground" : "text-foreground/60"
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
        )}

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <ThemeToggle />
           <div className="hidden md:block">
              {!isInitialized || !user ? (
                 <Skeleton className="h-9 w-9 rounded-full" />
              ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-9 w-9 cursor-pointer">
                            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                            <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <UserProgress user={user} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/account" className="w-full flex"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
              <SheetContent side="right" className="w-[260px] p-0 flex flex-col">
                 <SheetHeader className="p-6 pb-2">
                  <SheetTitle asChild>
                    <Link href="/generate" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-bold text-md font-headline">MGQs</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                {isInitialized && user ? (
                  <>
                    <div className="p-6 pt-0 border-b">
                        <div>
                          <Link href="/account" className="flex items-center p-2 rounded-md hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
                              <Avatar className="h-9 w-9 mr-3">
                                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                  <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-semibold">{user.fullName}</p>
                                  <p className="text-sm text-muted-foreground">View Account</p>
                              </div>
                          </Link>
                          <div className="mt-2">
                              <UserProgress user={user} />
                          </div>
                        </div>
                    </div>
                    <nav className="flex flex-col space-y-3 p-6 flex-grow overflow-y-auto">
                      {[...navLinks, ...moreToolsLinks].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center text-base font-medium transition-colors hover:text-primary py-2 px-2 rounded-md",
                            getIsActive(link.href) ? "text-primary bg-muted" : "text-foreground/80 hover:bg-muted/50"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="border-t p-4">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground text-center">Loading user...</p>
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
