
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ContentSelectionForm, type FormValues } from '@/components/content-selection-form';
import { generateQuestions, type GenerateQuestionsInput } from '@/ai/flows/generate-questions';
import { regenerateQuestion, type RegenerateQuestionInput, type RegenerateQuestionOutput } from '@/ai/flows/regenerate-question';
import { useToast } from '@/hooks/use-toast';
import type { QuestionContext, GeneratedQuestionAnswerPair, GradeLevelNCERT, QuestionTypeNCERT } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Sparkles, WifiOff, Bot } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const QuestionListSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-10 w-1/4" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(i => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="space-y-2 mt-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
    </div>
    <Skeleton className="h-4 w-full mt-2" /> 
    <Skeleton className="h-4 w-3/4" />
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-8 w-28" /> 
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

const ResultsPlaceholder = () => (
  <Card className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed bg-muted/50 shadow-none">
    <CardHeader className="text-center">
      <div className="mx-auto bg-background p-4 rounded-full mb-4 w-fit shadow-md">
        <Bot className="w-12 h-12 text-primary" />
      </div>
      <CardTitle className="text-2xl font-headline">Your Questions Appear Here</CardTitle>
      <CardDescription>Fill out the form on the left to get started.</CardDescription>
    </CardHeader>
  </Card>
);

const DynamicQuestionList = dynamic(() => import('@/components/question-list').then(mod => mod.QuestionList), {
  loading: () => <QuestionListSkeleton />,
  ssr: false 
});

export default function ExamPrepPage() {
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionAnswerPair[]>([]);
  const [currentContext, setCurrentContext] = useState<QuestionContext | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStatusChange = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', handleStatusChange);
      window.addEventListener('offline', handleStatusChange);
      handleStatusChange();
      return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
      };
    }
  }, []);
  
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isGenerating) {
        audioElement.play().catch(error => {
          console.error("Audio play failed. User interaction may be required to enable autoplay.", error);
        });
      } else {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    }
  }, [isGenerating]);

  const handleFormSubmit = async (data: FormValues) => {
    if (!isOnline) {
      toast({
        title: "You are offline",
        description: "This feature requires an internet connection. You can still view your saved questions.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedQuestions([]); 
    
    const contextData: QuestionContext = {
      gradeLevel: data.gradeLevel as GradeLevelNCERT,
      subject: data.subject,
      chapter: data.chapter,
      questionType: data.questionType as QuestionTypeNCERT,
    };
    setCurrentContext(contextData);

    const input: GenerateQuestionsInput = {
      gradeLevel: parseInt(data.gradeLevel, 10),
      subject: data.subject,
      chapter: data.chapter,
      questionType: data.questionType as QuestionTypeNCERT,
      numberOfQuestions: parseInt(data.numberOfQuestions, 10),
    };

    try {
      const result = await generateQuestions(input);
      if (result && result.questions) {
        setGeneratedQuestions(result.questions);
        if (result.questions.length === 0) {
          toast({
            title: "No Questions Generated",
            description: "The AI couldn't generate questions for the given criteria. Try adjusting your selections.",
          });
        } else {
           toast({
            title: "Questions Generated!",
            description: `${result.questions.length} question-answer pairs are ready.`,
          });
        }
      } else {
        throw new Error('No questions returned from AI');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate questions. ${errorMessage}`);
      toast({
        title: "Generation Failed",
        description: `Could not generate questions. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateQuestion = async (
    originalQuestionText: string, 
    originalOptions?: string[],
    context?: QuestionContext
  ): Promise<{ question: string; answer: string; options?: string[] } | null> => {
    if (!isOnline) {
      toast({ title: "Offline", description: "This feature requires internet.", variant: "destructive" });
      return null;
    }
    if (!context) {
        toast({ title: "Regeneration Error", description: "Question context is missing.", variant: "destructive" });
        return null;
    }

    const input: RegenerateQuestionInput = {
      gradeLevel: context.gradeLevel, 
      subject: context.subject,
      chapter: context.chapter,
      questionType: context.questionType, 
      originalQuestion: originalQuestionText,
      originalOptions: context.questionType === 'multiple_choice' ? originalOptions : undefined,
    };

    try {
      const result: RegenerateQuestionOutput = await regenerateQuestion(input);
      if (result && result.regeneratedQuestion && result.regeneratedAnswer) {
        const updatedQuestionPair = { 
          question: result.regeneratedQuestion, 
          answer: result.regeneratedAnswer,
          options: result.regeneratedOptions 
        };
        setGeneratedQuestions(prevQuestions => 
          prevQuestions.map(qaPair => 
            qaPair.question === originalQuestionText 
              ? updatedQuestionPair
              : qaPair
          )
        );
        return updatedQuestionPair;
      }
      return null;
    } catch (err) {
      console.error('Error regenerating question:', err);
      toast({
        title: "Regeneration Failed",
        description: "Could not regenerate the question.",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <audio ref={audioRef} src="/sounds/generating-music.mp3" loop />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          <ContentSelectionForm onSubmit={handleFormSubmit} isGenerating={isGenerating} isOnline={isOnline} />
        </div>

        {/* Results Column */}
        <div className="lg:col-span-3">
          {isGenerating ? (
            <QuestionListSkeleton />
          ) : error ? (
            <Alert variant="destructive" className="w-full">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : generatedQuestions.length > 0 && currentContext ? (
            <DynamicQuestionList
              questions={generatedQuestions}
              questionContext={currentContext}
              onRegenerateQuestion={handleRegenerateQuestion}
            />
          ) : (
             <ResultsPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
