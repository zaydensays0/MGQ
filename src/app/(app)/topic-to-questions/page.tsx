'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Sparkles, Loader2, Terminal, ShieldCheck, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { topicToQuestions } from '@/ai/flows/doubt-to-mcq';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { TopicToQuestionsInput, GeneratedTopicQuestion, RecheckAnswerOutput, QuestionTypeNCERT, GradeLevelNCERT, GeneratedQuestionAnswerPair } from '@/types';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_LEVELS } from '@/lib/constants';

const QuestionDisplay = ({
  question,
  index,
  topic,
  gradeLevel,
  onSave,
  isSaved,
}: {
  question: GeneratedTopicQuestion;
  index: number;
  topic: string;
  gradeLevel: GradeLevelNCERT;
  onSave: (question: GeneratedTopicQuestion) => void;
  isSaved: boolean;
}) => {
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const { handleCorrectAnswer, addWrongQuestion } = useUser();
  const { toast } = useToast();

  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);
  
  const isMCQ = question.type === 'multiple_choice';
  const isTrueFalse = question.type === 'true_false';
  const isAssertionReason = question.type === 'assertion_reason';
  const isInteractive = isMCQ || isTrueFalse || isAssertionReason;

  const checkAnswer = (answer: string) => {
    if (isAttempted) return;

    setUserAnswer(answer);
    setIsAttempted(true);

    if (answer.trim().toLowerCase() === question.answer.toLowerCase()) {
      handleCorrectAnswer(50);
      toast({ title: 'Correct!', description: 'Great job!' });
    } else {
      toast({ title: "Incorrect!", description: `The correct answer is: ${question.answer}`, variant: 'destructive' });
      addWrongQuestion({
        questionText: question.question,
        userAnswer: answer,
        correctAnswer: question.answer,
        options: question.options,
        explanation: question.explanation,
        context: {
          gradeLevel: gradeLevel,
          subject: 'Topic Practice',
          chapter: topic,
          questionType: question.type as QuestionTypeNCERT,
        }
      });
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
        gradeLevel: gradeLevel,
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
  
  const renderQuestionText = () => {
    if (isAssertionReason && question.question.includes('\\n')) {
      const parts = question.question.split('\\n');
      return (
        <div className="font-semibold space-y-1">
          <p>{parts[0]}</p>
          <p>{parts[1]}</p>
        </div>
      );
    }
    return <p className="font-semibold">{question.question.replace('[BLANK]', '__________')}</p>;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
        <CardDescription>Type: <span className="capitalize">{question.type.replace(/_/g, ' ')}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderQuestionText()}
        
        {isInteractive && question.options?.map((option, i) => {
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
        
        {!isInteractive && !showAnswer && (
          <Button variant="outline" onClick={() => setShowAnswer(true)} className="w-full">
            <Eye className="mr-2 h-4 w-4" /> Show Answer
          </Button>
        )}
      </CardContent>

      {(isAttempted || showAnswer) && (
        <CardFooter className="flex-col items-start gap-4 p-4 pt-0 border-t mt-4">
          {(showAnswer && !isInteractive) && (
             <div className="w-full mt-4 p-3 rounded-md border bg-secondary/30 border-input">
                <p className="text-sm font-semibold mb-1 text-primary">
                    Correct Answer:
                </p>
                <p className="text-foreground/90 leading-relaxed">{question.answer}</p>
            </div>
          )}
          <Accordion type="single" collapsible className="w-full" defaultValue={showAnswer ? "item-1" : undefined}>
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
  const [numberOfQuestions, setNumberOfQuestions] = useState<string>('5');
  const [isComprehensive, setIsComprehensive] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
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
    if (isComprehensive && !gradeLevel) {
      toast({ title: 'Class Required', description: 'Please select a class for comprehensive mode.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedQuestions([]);

    const input: TopicToQuestionsInput = {
        topic,
        isComprehensive,
    };
    
    const num = parseInt(numberOfQuestions, 10);

    if (isComprehensive) {
        input.gradeLevel = gradeLevel as GradeLevelNCERT;
    } else {
        if(isNaN(num) || num < 1) {
            toast({ title: 'Invalid Number', description: 'Please enter a valid number of questions.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        input.numberOfQuestions = num;
    }

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

  const transformToSavedQuestion = (q: GeneratedTopicQuestion): Omit<SavedQuestion, 'id' | 'timestamp'> => ({
    text: q.question,
    answer: q.answer,
    options: q.options,
    explanation: q.explanation,
    questionType: q.type as QuestionTypeNCERT,
    gradeLevel: (isComprehensive && gradeLevel ? gradeLevel : '10'),
    subject: 'Topic Practice',
    chapter: topic,
  });

  const getContextForSaving = (q: GeneratedTopicQuestion) => ({
    gradeLevel: (isComprehensive && gradeLevel ? gradeLevel : '10') as GradeLevelNCERT,
    subject: 'Topic Practice',
    chapter: topic,
    questionType: q.type as QuestionTypeNCERT,
  });

  const handleSaveQuestion = (questionToSave: GeneratedTopicQuestion) => {
    const context = getContextForSaving(questionToSave);
    if (!isSaved(questionToSave.question, context)) {
      addQuestion(transformToSavedQuestion(questionToSave));
      toast({ title: "Question Saved!", description: "This question has been added to your collection." });
    } else {
      toast({ title: "Already Saved", description: "This question is already in your saved list." });
    }
  };
  
  const handleSaveAll = () => {
    if (generatedQuestions.length > 0) {
      const questionsToSave = generatedQuestions.map(transformToSavedQuestion);
      const context = getContextForSaving(generatedQuestions[0]);
      addMultipleQuestions(questionsToSave as GeneratedQuestionAnswerPair[], context);
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
            
            <div className="space-y-2 rounded-md border p-4">
                <div className="flex items-center space-x-2">
                    <Switch id="comprehensive-mode" checked={isComprehensive} onCheckedChange={setIsComprehensive} />
                    <Label htmlFor="comprehensive-mode" className="text-base">Comprehensive Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">Let AI generate all necessary questions to master the topic.</p>
            </div>

            {isComprehensive ? (
                <div className="space-y-2">
                    <Label htmlFor="grade-level">Class</Label>
                    <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevelNCERT)} required={isComprehensive}>
                        <SelectTrigger><SelectValue placeholder="Select Class for comprehensive mode" /></SelectTrigger>
                        <SelectContent>
                            {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="num-questions">Number of Questions</Label>
                    <Input id="num-questions" type="number" min="1" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(e.target.value)} disabled={isLoading} />
                </div>
            )}
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
              gradeLevel={(isComprehensive && gradeLevel ? gradeLevel : '10')}
              onSave={handleSaveQuestion}
              isSaved={isSaved(q.question, getContextForSaving(q))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
