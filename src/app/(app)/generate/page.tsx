
'use client';

import { useState, useEffect } from 'react';
import {
  ContentSelectionForm,
  type FormValues,
} from '@/components/content-selection-form';
import { QuestionList } from '@/components/question-list';
import { generateQuestions } from '@/ai/flows/generate-questions';
import { regenerateQuestion } from '@/ai/flows/regenerate-question';
import type {
  GeneratedQuestionAnswerPair,
  QuestionContext,
  GradeLevelNCERT,
  QuestionTypeNCERT,
} from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function GeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionAnswerPair[]>([]);
  const [questionContext, setQuestionContext] = useState<QuestionContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleGenerate = async (data: FormValues) => {
    if (!isOnline) {
      toast({
        title: 'You are offline',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedQuestions([]);
    
    const context: QuestionContext = {
      gradeLevel: data.gradeLevel as GradeLevelNCERT,
      subject: data.subject,
      chapter: data.chapter,
      questionType: data.questionType as QuestionTypeNCERT,
    };
    setQuestionContext(context);
    
    try {
      const result = await generateQuestions({
        gradeLevel: parseInt(data.gradeLevel, 10),
        subject: data.subject,
        chapter: data.chapter,
        questionType: data.questionType as QuestionTypeNCERT,
        numberOfQuestions: parseInt(data.numberOfQuestions, 10),
      });

      if (result && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        toast({
          title: 'Questions Generated!',
          description: `Successfully generated ${result.questions.length} questions.`,
        });
      } else {
        setError('The AI could not generate questions for the given topic. Please try a different chapter or subject.');
      }
    } catch (err) {
      console.error('Generation Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate questions. ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (originalQuestion: string, originalOptions?: string[]) => {
    if (!questionContext) {
      toast({
        title: 'Error',
        description: 'Question context is missing. Cannot regenerate.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const result = await regenerateQuestion({
        ...questionContext,
        originalQuestion,
        originalOptions,
      });

      if (result) {
        const newQuestionPair: GeneratedQuestionAnswerPair = {
          question: result.regeneratedQuestion,
          answer: result.regeneratedAnswer,
          options: result.regeneratedOptions,
        };

        setGeneratedQuestions((prev) =>
          prev.map((q) =>
            q.question === originalQuestion ? newQuestionPair : q
          )
        );

        return {
          question: result.regeneratedQuestion,
          answer: result.regeneratedAnswer,
          options: result.regeneratedOptions,
        };
      }
      return null;
    } catch (err) {
      console.error('Regeneration Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        title: 'Regeneration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-8">
        <ContentSelectionForm
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
          isOnline={isOnline}
        />
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {generatedQuestions.length > 0 && questionContext && (
          <QuestionList
            questions={generatedQuestions}
            questionContext={questionContext}
            onRegenerateQuestion={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
}
