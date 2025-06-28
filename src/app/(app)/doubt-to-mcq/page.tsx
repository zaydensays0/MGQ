
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Sparkles, Loader2, Terminal, ShieldCheck } from 'lucide-react';
import { topicToMcq } from '@/ai/flows/doubt-to-mcq';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useUser } from '@/contexts/user-context';
import { type TopicToMcqInput, McqSchema, type RecheckAnswerOutput } from '@/types';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { playSound } from '@/lib/sounds';

type Mcq = z.infer<typeof McqSchema>;

const McqDisplayCard = ({ mcq, index, topic }: { mcq: Mcq, index: number, topic: string }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAttempted, setIsAttempted] = useState(false);
    const { user, handleCorrectAnswer } = useUser();
    const { toast } = useToast();
    
    const [isRechecking, setIsRechecking] = useState(false);
    const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);

    const handleSelect = (option: string) => {
        if (isAttempted) return;
        
        setIsAttempted(true);
        setSelectedOption(option);
        
        if (option === mcq.answer) {
            handleCorrectAnswer(50); // Give some XP for this
            playSound('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3b93f1aby.mp3');
        } else {
            toast({ title: "Incorrect!", description: `The correct answer is: ${mcq.answer}`, variant: 'destructive' });
            playSound('https://cdn.pixabay.com/download/audio/2022/03/07/audio_c898c8c882.mp3');
        }
    };

    const handleRecheck = async () => {
        setIsRechecking(true);
        setRecheckResult(null);
        try {
            const result = await recheckAnswer({
                question: mcq.question,
                originalAnswer: mcq.answer,
                options: mcq.options,
                gradeLevel: user?.class || '10',
                subject: 'General Knowledge',
                chapter: topic,
            });
            setRecheckResult(result);
            toast({
                title: "Recheck Complete",
                description: result.isCorrect ? "The original answer was confirmed correct." : "A correction was found.",
            });
        } catch (error) {
            console.error("Recheck error:", error);
            toast({
                title: "Recheck Failed",
                description: "Could not verify the answer at this time.",
                variant: "destructive"
            });
        } finally {
            setIsRechecking(false);
        }
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="font-semibold">{mcq.question}</p>
                <div className="space-y-2">
                    {mcq.options.map((option, i) => {
                        const isSelected = selectedOption === option;
                        const isCorrect = mcq.answer === option;
                        
                        let variant: "outline" | "default" | "destructive" = "outline";

                        if (isAttempted) {
                            if (isCorrect) {
                                variant = 'default';
                            } else if (isSelected && !isCorrect) {
                                variant = 'destructive';
                            }
                        }

                        return (
                            <Button 
                                key={i} 
                                variant={variant}
                                className="w-full justify-start text-left h-auto p-3"
                                onClick={() => handleSelect(option)}
                                disabled={isAttempted}
                            >
                                <span className="flex-grow">{option}</span>
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
            {isAttempted && (
                <CardFooter className="flex-col items-start gap-4 p-4 pt-0 border-t mt-4">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Why is this the answer?</AccordionTrigger>
                            <AccordionContent>
                                {mcq.explanation}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRecheck}
                        disabled={isRechecking || !!recheckResult}
                        className="w-full justify-center"
                    >
                        {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        {isRechecking ? 'Verifying...' : 'Recheck AI Answer'}
                    </Button>
                    {recheckResult && (
                         <Alert className="mt-2" variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
                            <ShieldCheck className="h-4 w-4" />
                            <AlertTitle>{recheckResult.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                            <AlertDescription className="space-y-1">
                                <p>{recheckResult.explanation}</p>
                                {!recheckResult.isCorrect && <p><b>Corrected:</b> {recheckResult.correctAnswer}</p>}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};


export default function TopicToMcqPage() {
  const [topic, setTopic] = useState('');
  const [mcqs, setMcqs] = useState<Mcq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: 'Empty Topic',
        description: 'Please enter a topic to generate questions.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setMcqs([]);

    const input: TopicToMcqInput = { topic };

    try {
      const result = await topicToMcq(input);
      if (result && result.questions.length > 0) {
        setMcqs(result.questions);
        toast({
          title: 'MCQs Generated!',
          description: "Here are some questions to practice.",
        });
      } else {
        throw new Error('No questions received from AI.');
      }
    } catch (err) {
      console.error('Error generating MCQs:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Could not generate questions. ${errorMessage}`,
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
          <Lightbulb className="w-8 h-8 mr-3 text-primary" />
          Topic to MCQ
        </h1>
        <p className="text-muted-foreground mt-1">
          Turn any topic or concept into a quick practice quiz.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>What's the topic?</CardTitle>
          <CardDescription>
            Type a concept you're stuck on or any topic below. We'll generate some MCQs to help you practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-input">Your Topic</Label>
              <Textarea
                id="topic-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The difference between mitosis and meiosis, or what are non-cooperation movements?"
                rows={5}
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
              {isLoading ? 'Generating Quiz...' : 'Generate MCQs'}
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

      {mcqs.length > 0 && !isLoading && (
        <div className="mt-8 w-full max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-headline font-semibold text-center">Practice Questions</h2>
            {mcqs.map((mcq, index) => (
                <McqDisplayCard key={index} mcq={mcq} index={index} topic={topic} />
            ))}
        </div>
      )}
    </div>
  );
}
