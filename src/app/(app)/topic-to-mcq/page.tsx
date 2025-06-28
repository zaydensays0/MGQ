'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Sparkles, Loader2, Terminal, ShieldCheck, Save, CheckCircle } from 'lucide-react';
import { topicToQuestions } from '@/ai/flows/doubt-to-mcq';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { TopicToQuestionsInput, GeneratedTopicQuestion, RecheckAnswerOutput, QuestionTypeNCERT } from '@/types';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

const QuestionDisplay = ({
  question,
  index,
  topic,
  onSave,
  isSaved,
}: {
  question: GeneratedTopicQuestion;
  index: number;
  topic: string;
  onSave: (question: GeneratedTopicQuestion) => void;
  isSaved: boolean;
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isAttempted, setIsAttempted] = useState(false);
  const { handleCorrectAnswer } = useUser();
  const { toast } = useToast();

  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);
  
  const isMCQ = question.type === 'multiple_choice';
  const isTrueFalse = question.type === 'true_false';

  const checkAnswer = (answer: string) => {
    if (isAttempted) return;

    setUserAnswer(answer);
    setIsAttempted(true);

    if (answer.trim().toLowerCase() === question.answer.toLowerCase()) {
      handleCorrectAnswer(50);
      toast({ title: 'Correct!', description: 'Great job!' });
    } else {
      toast({ title: "Incorrect!", description: `The correct answer is: ${question.answer}`, variant: 'destructive' });
    }
  };

  const handleRecheck = async () => {
    setIsRechecking(true);
    setRecheckResult(null);
    try {
      const result = await recheckAnswer({
        question: question.question,
        originalAnswer: question.answer,
        options: question.options,
        gradeLevel: '10', // Default for topic-based questions
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
      toast({ title: "Recheck Failed", description: "Could not verify the answer at this time.", variant: "destructive" });
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
        <CardDescription>Type: <span className="capitalize">{question.type.replace(/_/g, ' ')}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-semibold">{question.question.replace('[BLANK]', '__________')}</p>
        
        {/* Render options for MCQ and True/False */}
        {(isMCQ || isTrueFalse) && question.options?.map((option, i) => {
            const isSelected = userAnswer === option;
            const isCorrect = question.answer === option;
            let variant: "outline" | "default" | "destructive" = "outline";
            if (isAttempted) {
                if (isCorrect) variant = 'default';
                else if (isSelected && !isCorrect) variant = 'destructive';
            }
            return (
                <Button key={i} variant={variant} className="w-full justify-start text-left h-auto p-3" onClick={() => checkAnswer(option)} disabled={isAttempted}>
                    {option}
                </Button>
            );
        })}

        {/* Render input for other types */}
        {(question.type === 'short_answer' || question.type === 'fill_in_the_blanks') && (
            <div className="flex gap-2">
                <Input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer..." disabled={isAttempted} />
                <Button onClick={() => checkAnswer(userAnswer)} disabled={isAttempted}>Submit</Button>
            </div>
        )}
      </CardContent>

      {isAttempted && (
        <CardFooter className="flex-col items-start gap-4 p-4 pt-0 border-t mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Why is this the answer?</AccordionTrigger>
              <AccordionContent>{question.explanation}</AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex w-full justify-between items-center">
            <Button size="sm" variant="ghost" onClick={handleRecheck} disabled={isRechecking || !!recheckResult}>
              {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {isRechecking ? 'Verifying...' : 'Recheck AI Answer'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onSave(question)} disabled={isSaved}>
              {isSaved ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
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

export default function TopicToQuestionsPage() {
  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedTopicQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addQuestion, addMultipleQuestions, isSaved } = useSavedQuestions();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({ title: 'Empty Topic', description: 'Please enter a topic.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedQuestions([]);

    const input: TopicToQuestionsInput = { topic, numberOfQuestions };

    try {
      const result = await topicToQuestions(input);
      if (result && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        toast({ title: 'Questions Generated!', description: `Here are ${result.questions.length} questions to practice.` });
      } else {
        throw new Error('No questions received from AI.');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({ title: 'Error', description: `Could not generate questions. ${errorMessage}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const transformToSavedQuestion = (q: GeneratedTopicQuestion) => ({
    text: q.question,
    answer: q.answer,
    options: q.options,
    questionType: q.type as QuestionTypeNCERT, // Assuming types align
  });

  const getContextForSaving = (q: GeneratedTopicQuestion) => ({
    gradeLevel: '10' as '10', // Default grade
    subject: 'Topic Practice',
    chapter: topic,
    questionType: q.type as QuestionTypeNCERT,
  });

  const handleSaveQuestion = (questionToSave: GeneratedTopicQuestion) => {
    const context = getContextForSaving(questionToSave);
    if (!isSaved(questionToSave.question, context)) {
      addQuestion({
        ...transformToSavedQuestion(questionToSave),
        ...context,
      });
      toast({ title: "Question Saved!", description: "This question has been added to your collection." });
    } else {
      toast({ title: "Already Saved", description: "This question is already in your saved list." });
    }
  };
  
  const handleSaveAll = () => {
    const questionsToSave = generatedQuestions.map(transformToSavedQuestion);
    // Use the context of the first question for the batch
    if (generatedQuestions.length > 0) {
      const context = getContextForSaving(generatedQuestions[0]);
      addMultipleQuestions(questionsToSave, context);
      toast({ title: 'All Questions Saved', description: 'All generated questions have been added to your collection.' });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Lightbulb className="w-8 h-8 mr-3 text-primary" />
          Topic to Questions
        </h1>
        <p className="text-muted-foreground mt-1">
          Turn any topic or concept into a quick, mixed-style practice quiz.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>What's on your mind?</CardTitle>
          <CardDescription>
            Type a concept you're stuck on or any topic below. We'll generate various questions to help you practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-input">Your Topic</Label>
              <Textarea id="topic-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., The laws of motion, or carbon and its compounds" rows={4} className="text-base" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-questions">Number of Questions (1-10)</Label>
              <Input id="num-questions" type="number" min="1" max="10" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
              {isLoading ? 'Generating...' : 'Generate Questions'}
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
          <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </CardContent>
        </Card>
      )}

      {generatedQuestions.length > 0 && !isLoading && (
        <div className="mt-8 w-full max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-headline font-semibold">Practice Questions</h2>
            <Button onClick={handleSaveAll} variant="outline">
              <Save className="mr-2 h-4 w-4"/> Save All
            </Button>
          </div>
          {generatedQuestions.map((q, index) => (
            <QuestionDisplay 
              key={index} 
              question={q} 
              index={index} 
              topic={topic}
              onSave={handleSaveQuestion}
              isSaved={isSaved(q.question, getContextForSaving(q))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
