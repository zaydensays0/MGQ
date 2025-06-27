
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import type { WrongQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RotateCcw, Check, X, ClipboardX, Trash, Award, Filter, FileQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const WrongQuestionCard = ({ question, onMastered }: { question: WrongQuestion, onMastered: (id: string) => void }) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrectOnRetry, setIsCorrectOnRetry] = useState(false);
  const { toast } = useToast();

  const handleRetry = () => {
    if (!userAnswer.trim()) {
      toast({ title: 'Please enter an answer.', variant: 'destructive' });
      return;
    }
    setIsAttempted(true);
    if (userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
      setIsCorrectOnRetry(true);
      toast({ title: "Correct!", description: "You've mastered this question. It will be removed from this list." });
      new Audio('/sounds/correct.mp3').play();
      // Delay removal to allow user to see the "Mastered" state
      setTimeout(() => onMastered(question.id), 2000);
    } else {
      toast({ title: "Not quite", description: `That's not the correct answer. Try again or review the explanation.`, variant: 'destructive' });
      new Audio('/sounds/incorrect.mp3').play();
    }
  };

  const isMCQ = question.context.questionType === 'multiple_choice' || question.context.questionType === 'true_false' || question.context.questionType === 'assertion_reason';

  return (
    <Card className={`transition-all duration-500 ${isCorrectOnRetry ? 'bg-green-100 dark:bg-green-900/50 border-green-500' : ''}`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold leading-relaxed whitespace-pre-wrap">{question.questionText}</CardTitle>
        <CardDescription className="text-xs">
          Incorrectly answered {formatDistanceToNow(new Date(question.attemptedAt), { addSuffix: true })} | {question.context.subject} - {question.context.chapter}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Your Answer</AlertTitle>
          <AlertDescription>{question.userAnswer}</AlertDescription>
        </Alert>
        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-300">
          <Check className="h-4 w-4" />
          <AlertTitle>Correct Answer</AlertTitle>
          <AlertDescription>{question.correctAnswer}</AlertDescription>
        </Alert>
        {question.explanation && (
            <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">View Explanation</summary>
                <p className="mt-2 p-2 bg-muted/50 rounded-md">{question.explanation}</p>
            </details>
        )}
      </CardContent>
      <CardFooter>
        {isCorrectOnRetry ? (
          <div className="w-full text-center font-bold text-green-600 flex items-center justify-center">
            <Award className="mr-2 h-5 w-5" /> Mastered!
          </div>
        ) : (
          <div className="w-full space-y-2">
            <Label className="text-sm font-medium">Retry Question</Label>
            {isMCQ && question.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt) => (
                  <Button 
                    key={opt} 
                    variant={userAnswer === opt ? 'default' : 'outline'}
                    onClick={() => setUserAnswer(opt)}
                    className="h-auto whitespace-normal justify-start text-left"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            ) : (
                <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full p-2 border rounded-md bg-background" placeholder="Type your answer..."/>
            )}
            <Button onClick={handleRetry} className="w-full mt-2" disabled={isAttempted && !isCorrectOnRetry}>Retry</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};


export default function WrongQuestionsPage() {
    const { user, wrongQuestions, removeWrongQuestion, clearAllWrongQuestions, isGuest } = useUser();
    const [showLoginPrompt, setShowLoginPrompt] = useState(isGuest);

    const [subjectFilter, setSubjectFilter] = useState('all');
    const [chapterFilter, setChapterFilter] = useState('all');
    
    const subjects = useMemo(() => [...new Set(wrongQuestions.map(q => q.context.subject))], [wrongQuestions]);
    const chapters = useMemo(() => {
        if (subjectFilter === 'all') return [];
        return [...new Set(wrongQuestions.filter(q => q.context.subject === subjectFilter).map(q => q.context.chapter))];
    }, [wrongQuestions, subjectFilter]);

    const filteredQuestions = useMemo(() => {
        return wrongQuestions.filter(q => {
            const subjectMatch = subjectFilter === 'all' || q.context.subject === subjectFilter;
            const chapterMatch = chapterFilter === 'all' || q.context.chapter === chapterFilter;
            return subjectMatch && chapterMatch;
        });
    }, [wrongQuestions, subjectFilter, chapterFilter]);

    if (isGuest) {
      return <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />;
    }
    
    if (!user) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all questions from this list?")) {
            clearAllWrongQuestions();
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-bold flex items-center">
                    <RotateCcw className="w-8 h-8 mr-3 text-primary" />
                    Recently Wrong Questions
                    </h1>
                    <p className="text-muted-foreground mt-1">
                    Review and master the questions you found tricky.
                    </p>
                </div>
                {wrongQuestions.length > 0 && (
                     <Button onClick={handleClearAll} variant="destructive" size="sm">
                        <Trash className="mr-2 h-4 w-4" />
                        Clear All
                    </Button>
                )}
            </div>

            {wrongQuestions.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5"/> Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Filter by Subject</Label>
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Filter by Chapter</Label>
                             <Select value={chapterFilter} onValueChange={setChapterFilter} disabled={subjectFilter === 'all'}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Chapters</SelectItem>
                                    {chapters.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {filteredQuestions.length === 0 ? (
                 <Alert className="max-w-xl mx-auto text-center border-dashed py-10">
                    <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <AlertTitle className="font-headline text-2xl">All Clear!</AlertTitle>
                    <AlertDescription className="mt-1">
                        {wrongQuestions.length > 0 ? "No questions match your current filters." : "You haven't gotten any questions wrong recently. Keep up the great work!"}
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredQuestions.map(q => (
                        <WrongQuestionCard key={q.id} question={q} onMastered={removeWrongQuestion} />
                    ))}
                </div>
            )}
        </div>
    );
}

