
'use client';

import Link from 'next/link';
import {
  Sparkles,
  BookMarked,
  FileText,
  PenSquare,
  Layers,
  MessageSquare,
  SpellCheck,
  History,
  Bot,
  Archive,
  Trophy,
  User,
  Heart,
  LayoutGrid,
  CheckSquare,
  Lightbulb,
  Target,
  RotateCw
} from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import type { LucideIcon } from 'lucide-react';

// Custom icon for Grammar to match the design
const GrammarIcon = () => (<span className="text-2xl font-bold text-primary">G</span>);

const features: { title: string; href: string; icon: React.ReactNode; description: string; }[] = [
  { title: 'Study Streams', href: '/streams', icon: <Target className="w-6 h-6 text-primary" />, description: 'Focused prep for competitive exams.' },
  { title: 'Mock Tests', href: '/mock-test', icon: <CheckSquare className="w-6 h-6 text-primary" />, description: 'AI-generated practice tests.' },
  { title: 'Wrong Questions', href: '/wrong-questions', icon: <RotateCw className="w-6 h-6 text-primary" />, description: 'Practice the questions you got wrong.' },
  { title: 'Generate Questions', href: '/generate', icon: <Sparkles className="w-6 h-6 text-primary" />, description: 'Create custom questions on any topic with AI.' },
  { title: 'Topic to Questions', href: '/topic-to-questions', icon: <Lightbulb className="w-6 h-6 text-primary" />, description: 'Turn any topic into a quick practice quiz.' },
  { title: 'Notes', href: '/notes', icon: <FileText className="w-6 h-6 text-primary" />, description: 'Create and organize your personal study notes.' },
  { title: 'Grammar', href: '/grammar', icon: <GrammarIcon />, description: 'Your personal grammar checking tool.' },
  { title: 'Ask an Expert', href: '/subject-expert', icon: <MessageSquare className="w-6 h-6 text-primary" />, description: 'Chat with subject experts for any topic.' },
  { title: 'AI Notes Generator', href: '/notes-ai', icon: <PenSquare className="w-6 h-6 text-primary" />, description: 'Let AI generate or summarize notes for you.' },
  { title: 'Ask Jarvis', href: '/jarvis', icon: <Bot className="w-6 h-6 text-primary" />, description: 'A general-purpose AI assistant for any query.' },
  { title: 'Flashcards', href: '/flashcards', icon: <Layers className="w-6 h-6 text-primary" />, description: 'Study with smart, auto-generated flashcards.' },
  { title: 'Grammar Test', href: '/grammar-test', icon: <SpellCheck className="w-6 h-6 text-primary" />, description: 'Sharpen your grammar with targeted tests.' },
  { title: 'Saved Questions', href: '/saved', icon: <BookMarked className="w-6 h-6 text-primary" />, description: 'Review and manage all your saved questions.' },
  { title: 'Expert Archive', href: '/subject-expert-saved', icon: <History className="w-6 h-6 text-primary" />, description: 'Revisit your saved chats with the Expert AI.' },
  { title: 'Jarvis Archive', href: '/jarvis-saved', icon: <Archive className="w-6 h-6 text-primary" />, description: 'Access your saved conversations with Jarvis.' },
  { title: 'Leaderboard', href: '/leaderboard', icon: <Trophy className="w-6 h-6 text-primary" />, description: 'See how you rank against other students.' },
  { title: 'Account', href: '/account', icon: <User className="w-6 h-6 text-primary" />, description: 'Manage your profile, stats, and preferences.' },
  { title: 'Support Us', href: '/donation', icon: <Heart className="w-6 h-6 text-primary" />, description: 'Help us improve with a small donation.' },
];

const FeatureCard = ({ feature }: { feature: typeof features[0] }) => {
    return (
        <Link href={feature.href} className="block group">
            <div className="p-6 h-full transition-shadow duration-300 group-hover:shadow-xl shadow-md bg-card rounded-2xl border border-transparent hover:border-primary/20">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-6">
                    {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
        </Link>
    );
};

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
          <FeatureCard key={feature.href} feature={feature} />
        ))}
      </div>
    </div>
  );
}
