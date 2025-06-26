'use client';

import Link from 'next/link';
import {
  Sparkles,
  BookMarked,
  ClipboardCheck,
  FileText,
  PenSquare,
  Layers,
  MessageSquareQuote,
  SpellCheck,
  Brain,
  History,
  Bot,
  Archive,
  Trophy,
  User,
  Heart,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/user-context';

const features = [
  // Core AI Tools
  { title: 'Generate Questions', href: '/generate', icon: Sparkles, description: 'Create custom questions on any topic with AI.' },
  { title: 'AI Notes Generator', href: '/notes-ai', icon: PenSquare, description: 'Let AI generate or summarize notes for you.' },
  { title: 'Ask an Expert', href: '/subject-expert', icon: Brain, description: 'Get detailed answers on specific chapters.' },
  { title: 'Ask Jarvis', href: '/jarvis', icon: Bot, description: 'A general-purpose AI assistant for any query.' },
  // Practice & Test
  { title: 'Mock Tests', href: '/mock-test', icon: ClipboardCheck, description: 'Take AI-generated mock tests to prepare.' },
  { title: 'Flashcards', href: '/flashcards', icon: Layers, description: 'Study with smart, auto-generated flashcards.' },
  { title: 'Grammar Test', href: '/grammar-test', icon: SpellCheck, description: 'Sharpen your grammar with targeted tests.' },
  { title: 'Grammar Helper', href: '/grammar', icon: MessageSquareQuote, description: 'Get instant answers to grammar questions.' },
  // Content & Management
  { title: 'Saved Questions', href: '/saved', icon: BookMarked, description: 'Review and manage all your saved questions.' },
  { title: 'My Notes', href: '/notes', icon: FileText, description: 'Create and organize your personal study notes.' },
  { title: 'Expert Archive', href: '/subject-expert-saved', icon: History, description: 'Revisit your saved chats with the Expert AI.' },
  { title: 'Jarvis Archive', href: '/jarvis-saved', icon: Archive, description: 'Access your saved conversations with Jarvis.' },
  // Community & Profile
  { title: 'Leaderboard', href: '/leaderboard', icon: Trophy, description: 'See how you rank against other students.' },
  { title: 'Account', href: '/account', icon: User, description: 'Manage your profile, stats, and preferences.' },
  { title: 'Support Us', href: '/donation', icon: Heart, description: 'Help us improve with a small donation.' },
];

export default function HomePage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <LayoutGrid className="w-8 h-8 mr-3 text-primary" />
          Welcome, {user?.fullName.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here are all the tools available to help you excel. What would you like to do today?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.href} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300 bg-card/50 dark:bg-card/80">
            <CardHeader>
              <feature.icon className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={feature.href}>
                  Go to Feature <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}