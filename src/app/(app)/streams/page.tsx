'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { STREAMS } from '@/lib/constants';
import { Target } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { useState } from 'react';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';
import type { Stream } from '@/types';


const StreamCard = ({ stream }: { stream: Stream }) => {
    const { isGuest } = useUser();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isGuest) {
            e.preventDefault();
            setShowLoginPrompt(true);
        }
    };

    return (
        <>
            <Link href={`/streams/${stream.id}`} onClick={handleClick} className="block group">
                <Card className="h-full transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 group-hover:-translate-y-1">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                <stream.icon className="w-7 h-7 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-bold">{stream.name}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>{stream.description}</CardDescription>
                    </CardContent>
                </Card>
            </Link>
            {/* The dialog is controlled by the `open` state, and does not need a visible trigger */}
            <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
                <div/>
            </LoginPromptDialog>
        </>
    );
};


export default function StreamsPage() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Target className="w-8 h-8 mr-3 text-primary" />
                    Study Streams
                </h1>
                <p className="text-muted-foreground mt-1">
                    Choose your exam or academic stream for focused preparation.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {STREAMS.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                ))}
            </div>
        </div>
    );
}
