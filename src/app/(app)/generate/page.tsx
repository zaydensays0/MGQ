'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, FileText, MessageCircle, BarChart2, ChevronRight, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FeatureCard = ({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) => {
  const router = useRouter();
  return (
    <Link href={href} className="block hover:scale-[1.02] transition-transform duration-200">
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="bg-primary/20 dark:bg-primary/10 text-primary rounded-lg p-3 mb-4">
            {icon}
          </div>
          <h3 className="font-bold text-lg text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

const ChallengeBanner = () => (
    <Link href="/mock-test" className="block hover:scale-[1.01] transition-transform duration-200">
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-foreground p-3 rounded-lg mr-4">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-card-foreground">Challenge</h3>
                        <p className="text-sm text-muted-foreground">Challenge your friends</p>
                    </div>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
        </Card>
    </Link>
);

export default function DashboardPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
           <div className="text-center my-8 md:my-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    The smartest way to prepare for Classes 9 to 12
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Instantly generate questions, get expert help, and challenge your friends with AI-powered mock tests.
                </p>
                <Button size="lg" variant="accent" className="mt-8" onClick={() => router.push('/mock-test')}>
                    Start Test
                </Button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
                <FeatureCard 
                    icon={<Check className="w-8 h-8"/>}
                    title="Mock Tests"
                    description="AI-generated practice tests"
                    href="/mock-test"
                />
                 <FeatureCard 
                    icon={<FileText className="w-8 h-8"/>}
                    title="Notes"
                    description="Study material for all subjects"
                    href="/notes"
                />
                 <FeatureCard 
                    icon={
                        <span className="font-extrabold text-3xl h-8 w-8 flex items-center justify-center">G</span>
                    }
                    title="Grammar"
                    description="Grammar checking tool"
                    href="/grammar"
                />
                 <FeatureCard 
                    icon={<MessageCircle className="w-8 h-8"/>}
                    title="Ask an Expert"
                    description="Chat with subject experts"
                    href="/subject-expert"
                />
           </div>

           <div className="my-10">
                <ChallengeBanner />
           </div>
        </div>
    );
}
