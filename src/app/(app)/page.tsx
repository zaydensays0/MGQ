
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script'; // Import the Script component
import { ContentSelectionForm, type FormValues } from '@/components/content-selection-form';
import { generateQuestions, type GenerateQuestionsInput } from '@/ai/flows/generate-questions';
import { regenerateQuestion, type RegenerateQuestionInput, type RegenerateQuestionOutput } from '@/ai/flows/regenerate-question';
import { useToast } from '@/hooks/use-toast';
import type { QuestionContext, GeneratedQuestionAnswerPair, GradeLevelNCERT, QuestionTypeNCERT } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Sparkles } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const QuestionListSkeleton = () => (
  <div className="space-y-6 mt-8">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-10 w-1/4" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    {/* For MCQs, options would be here */}
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

const DynamicQuestionList = dynamic(() => import('@/components/question-list').then(mod => mod.QuestionList), {
  loading: () => <QuestionListSkeleton />,
  ssr: false 
});

export default function ExamPrepPage() {
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionAnswerPair[]>([]);
  const [currentContext, setCurrentContext] = useState<QuestionContext | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = async (data: FormValues) => {
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
      questionType: data.questionType as QuestionTypeNCERT, // Cast here
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
    if (!context) { // Ensure context is available
        toast({
            title: "Regeneration Error",
            description: "Question context is missing for regeneration.",
            variant: "destructive",
        });
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
      <div className="flex flex-col items-center">
        <ContentSelectionForm onSubmit={handleFormSubmit} isGenerating={isGenerating} />

        {error && (
          <Alert variant="destructive" className="mt-8 w-full max-w-2xl">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isGenerating && !error && <QuestionListSkeleton />}

        {!isGenerating && generatedQuestions.length > 0 && currentContext && (
          <div className="mt-12 w-full max-w-4xl">
            <DynamicQuestionList
              questions={generatedQuestions}
              questionContext={currentContext}
              onRegenerateQuestion={handleRegenerateQuestion}
            />
          </div>
        )}
        
        {!isGenerating && generatedQuestions.length === 0 && currentContext && !error && (
           <Alert className="mt-8 w-full max-w-2xl">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>No Questions Yet</AlertTitle>
            <AlertDescription>
              No questions were generated for the selected criteria. You can try different options or subjects.
            </AlertDescription>
          </Alert>
        )}

        {!isGenerating && !currentContext && !error && (
           <Alert className="mt-8 w-full max-w-lg text-center border-dashed">
             <Sparkles className="h-5 w-5 mx-auto mb-2 text-primary" />
            <AlertTitle className="font-headline text-xl">Ready to Generate?</AlertTitle>
            <AlertDescription className="mt-1">
             Fill out the form above to start creating questions with MGQs!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Added scripts using next/script */}
      <Script id="atoptions-config" strategy="afterInteractive">
        {`
          window.atOptions = {
            'key' : '0762c37cdf81985c469d1cebece2886f',
            'format' : 'iframe',
            'height' : 300,
            'width' : 160,
            'params' : {}
          };
        `}
      </Script>
      <Script
        id="highperformanceformat-invoke"
        src="//www.highperformanceformat.com/0762c37cdf81985c469d1cebece2886f/invoke.js"
        strategy="afterInteractive"
      />

      {/* New set of scripts */}
      <Script id="atoptions-config-2" strategy="afterInteractive">
        {`
          window.atOptions = {
            'key' : 'a050636a31b3077dc1bbe04ffd14a25a',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        `}
      </Script>
      <Script
        id="highperformanceformat-invoke-2"
        src="//www.highperformanceformat.com/a050636a31b3077dc1bbe04ffd14a25a/invoke.js"
        strategy="afterInteractive"
      />

      {/* Third set of scripts */}
      <Script
        id="profitableratecpm-invoke"
        src="//pl26817799.profitableratecpm.com/557a252c055ae7b7626b87b6a2c95d51/invoke.js"
        strategy="lazyOnload" // Use lazyOnload for async scripts that don't block rendering
        async // The original script had async
        data-cfasync="false" // The original script had data-cfasync
      />
      <div id="container-557a252c055ae7b7626b87b6a2c95d51"></div>
    </div>
  );
}
