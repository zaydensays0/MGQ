
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Sparkles, Terminal } from 'lucide-react';
import type { NeetQuestion } from '@/types';
import { generateNeetQuestions } from '@/ai/flows/generate-neet-questions';
import { NeetPracticeSession } from '@/components/neet-practice-session';
import { Skeleton } from '@/components/ui/skeleton';

function PracticePageContent() {
    const searchParams = useSearchParams();
    const subject = searchParams.get('subject');
    const classLevel = searchParams.get('class');
    const chapter = searchParams.get('chapter');

    const [questions, setQuestions] = useState<NeetQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!subject || !classLevel || !chapter) return;
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        try {
            const result = await generateNeetQuestions({
                subject,
                classLevel,
                chapter,
            });
            if (result && result.questions.length > 0) {
                setQuestions(result.questions);
            } else {
                throw new Error("AI failed to generate questions for this chapter.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!subject || !classLevel || !chapter) {
        return (
             <div className="text-center">
                 <Alert variant="destructive">
                     <AlertTitle>Missing Information</AlertTitle>
                     <AlertDescription>Chapter details not found. Please go back and select a chapter.</AlertDescription>
                 </Alert>
            </div>
        )
    }

    if (isLoading) {
        return (
             <Card className="w-full max-w-4xl mx-auto">
                 <CardHeader>
                     <Skeleton className="h-8 w-3/4" />
                     <Skeleton className="h-4 w-1/2" />
                 </CardHeader>
                 <CardContent className="text-center space-y-4">
                     <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                     <p className="text-muted-foreground">Generating your NEET practice session... this may take a moment.</p>
                 </CardContent>
             </Card>
        )
    }

    if (error) {
        return (
             <Alert variant="destructive">
                 <Terminal className="h-4 w-4" />
                 <AlertTitle>Generation Failed</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
             </Alert>
        )
    }
    
    if (questions.length > 0) {
        return <NeetPracticeSession questions={questions} context={{ subject, classLevel, chapter }} />;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto text-center shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Ready to Practice?</CardTitle>
                <CardDescription>
                    You are about to start a practice session for:
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-1 text-lg font-semibold">
                    <p>Class {classLevel}</p>
                    <p className="capitalize">{subject}</p>
                    <p>Chapter: {chapter}</p>
                </div>
                <Button onClick={handleGenerate} size="lg" className="mt-6">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Practice Session
                </Button>
            </CardContent>
        </Card>
    )

}

export default function NeetPracticePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/streams/neet">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chapter Selection
        </Link>
      </Button>
      <Suspense fallback={<div>Loading...</div>}>
        <PracticePageContent />
      </Suspense>
    </div>
  );
}
