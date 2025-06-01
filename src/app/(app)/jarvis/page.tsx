
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, Sparkles, Loader2, Terminal, Save, CheckCircle } from 'lucide-react';
import { askJarvis, type AskJarvisInput, type AskJarvisOutput } from '@/ai/flows/ask-jarvis';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useJarvisSaved } from '@/contexts/jarvis-saved-context';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading answer...</p>,
  ssr: false
});

export default function JarvisPage() {
  const [userQuestion, setUserQuestion] = useState('');
  const [jarvisAnswer, setJarvisAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addExchange, isSaved: isExchangeSaved } = useJarvisSaved();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) {
      toast({
        title: 'Empty Question',
        description: 'Please enter your question for Jarvis.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setJarvisAnswer(null);

    const input: AskJarvisInput = { userQuestion };

    try {
      const result: AskJarvisOutput = await askJarvis(input);
      if (result && result.jarvisAnswer) {
        setJarvisAnswer(result.jarvisAnswer);
        toast({
          title: 'Jarvis Responded!',
          description: "Here's what Jarvis has to say.",
        });
      } else {
        throw new Error('No answer received from Jarvis.');
      }
    } catch (err) {
      console.error('Error getting answer from Jarvis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Could not get an answer from Jarvis. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      // setUserQuestion(''); // Question is cleared only after saving or if not saved
    }
  };

  const handleSaveResponse = () => {
    if (userQuestion && jarvisAnswer) {
      if (!isExchangeSaved(userQuestion, jarvisAnswer)) {
        addExchange({ userQuestion, jarvisAnswer });
        toast({
          title: 'Response Saved!',
          description: 'This conversation with Jarvis has been saved.',
        });
        setUserQuestion(''); // Clear question after successful save
      } else {
        toast({
          title: 'Already Saved',
          description: 'This response has already been saved.',
          variant: 'default',
        });
      }
    }
  };
  
  const currentExchangeIsSaved = userQuestion && jarvisAnswer ? isExchangeSaved(userQuestion, jarvisAnswer) : false;


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Bot className="w-8 h-8 mr-3 text-primary" />
          Ask Jarvis
        </h1>
        <p className="text-muted-foreground mt-1">
          Jarvis is here to help. Ask any question, study-related or otherwise!
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>What's on your mind?</CardTitle>
          <CardDescription>
            Type your question below, and Jarvis will do its best to answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jarvisQuestion">Your Question</Label>
              <Textarea
                id="jarvisQuestion"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="e.g., What is the theory of relativity? or What's the weather like today?"
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
              {isLoading ? 'Jarvis is thinking...' : 'Ask Jarvis'}
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

      {jarvisAnswer && !isLoading && (
        <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-primary" />
              Jarvis's Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <DynamicReactMarkdown>{jarvisAnswer}</DynamicReactMarkdown>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t">
            <Button
              onClick={handleSaveResponse}
              disabled={currentExchangeIsSaved}
              variant={currentExchangeIsSaved ? "secondary" : "default"}
            >
              {currentExchangeIsSaved ? (
                <CheckCircle className="mr-2 h-5 w-5" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {currentExchangeIsSaved ? 'Saved' : 'Save Response'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
