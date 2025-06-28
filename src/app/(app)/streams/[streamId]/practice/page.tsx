'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Sparkles, Terminal } from 'lucide-react';
import type { StreamQuestion, StreamId } from '@/types';
import { generateStreamQuestions } from '@/ai/flows/generate-stream-questions';
import { StreamPracticeSession } from '@/components/stream-practice-session';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { STREAMS } from '@/lib/constants';

function PracticePageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    
    const streamId = params.streamId as StreamId;
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const category = searchParams.get('category'); // e.g., "Class 11", "Physical Chemistry"

    const [questions, setQuestions] = useState<StreamQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numberOfQuestions, setNumberOfQuestions] = useState(10);
    
    const streamDetails = STREAMS.find(s => s.id === streamId);

    const handleGenerate = async () => {
        if (!streamId || !subject || !chapter || !streamDetails) return;
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        try {
            const result = await generateStreamQuestions({
                streamId,
                streamName: streamDetails.name,
                subject,
                chapter,
                numberOfQuestions,
            });
            if (result && result.questions.length > 0) {
                setQuestions(result.questions);
            } else {
                throw new Error("AI failed to generate questions for this topic.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!streamId || !subject || !chapter || !category || !streamDetails) {
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
                     <p className="text-muted-foreground">Generating your {streamDetails.name} practice session... this may take a moment.</p>
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
        return <StreamPracticeSession questions={questions} context={{ streamId, subject, chapter, category }} />;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto text-center shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Ready to Practice?</CardTitle>
                <CardDescription>
                    You are about to start a practice session for:
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1 text-lg font-semibold">
                    <p className="text-primary">{streamDetails.name}</p>
                    <p className="capitalize text-base">{subject} ({category})</p>
                    <p className="text-base">Topic: {chapter}</p>
                </div>
                <div className="max-w-xs mx-auto pt-4">
                  <Input
                    id="num-questions"
                    type="number"
                    min="1"
                    value={numberOfQuestions}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      setNumberOfQuestions(isNaN(num) ? 1 : num);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Number of questions to generate</p>
                </div>
                <Button onClick={handleGenerate} size="lg" className="mt-6">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Practice Session
                </Button>
            </CardContent>
        </Card>
    )
}

export default function StreamPracticePage() {
  const params = useParams();
  const streamId = params.streamId as StreamId;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/streams/${streamId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chapter Selection
        </Link>
      </Button>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <PracticePageContent />
      </Suspense>
    </div>
  );
}
