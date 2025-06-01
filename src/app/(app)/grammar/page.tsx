
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquareQuote, Sparkles, Loader2, Terminal } from 'lucide-react';
import { answerGrammarQuestion, type AnswerGrammarQuestionInput, type AnswerGrammarQuestionOutput } from '@/ai/flows/answer-grammar-question';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading explanation...</p>,
  ssr: false
});

export default function GrammarHelperPage() {
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) {
      toast({
        title: 'Empty Question',
        description: 'Please enter your grammar question.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiAnswer(null);

    const input: AnswerGrammarQuestionInput = { userQuestion };

    try {
      const result: AnswerGrammarQuestionOutput = await answerGrammarQuestion(input);
      if (result && result.aiAnswer) {
        setAiAnswer(result.aiAnswer);
        toast({
          title: 'Answer Received!',
          description: "Here's the explanation for your grammar question.",
        });
      } else {
        throw new Error('No answer received from AI.');
      }
    } catch (err) {
      console.error('Error getting grammar answer:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Could not get an answer. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <MessageSquareQuote className="w-8 h-8 mr-3 text-primary" />
          Grammar Helper
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask any grammar-related question and get a clear explanation.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Ask a Grammar Question</CardTitle>
          <CardDescription>
            Type your question below, and Jarvis will help you understand the grammar concepts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grammarQuestion">Your Question</Label>
              <Textarea
                id="grammarQuestion"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="e.g., What is the difference between 'affect' and 'effect'?"
                rows={4}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Getting Answer...' : 'Ask Jarvis'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6 w-full max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !error && (
         <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </CardContent>
        </Card>
      )}

      {aiAnswer && !isLoading && (
        <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Jarvis's Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <DynamicReactMarkdown>{aiAnswer}</DynamicReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
