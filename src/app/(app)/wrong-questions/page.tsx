
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import type { WrongQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RotateCcw, Check, X, ClipboardX, Trash, Award, Filter, FileQuestion, TestTube, ChevronsRight, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { LoginPromptDialog } from '@/components/login-prompt-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const WrongQuestionCard = ({ question }: { question: WrongQuestion }) => {
  return (
    <Card>
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
    </Card>
  );
};


// --- New Test Session Components ---
const TestSessionView = ({ 
    session, 
    onAnswer,
    onExit
}: { 
    session: { questions: WrongQuestion[], currentIndex: number },
    onAnswer: (questionId: string, userAnswer: string, isCorrect: boolean) => void,
    onExit: () => void,
}) => {
    const question = session.questions[session.currentIndex];
    const [selectedOption, setSelectedOption] = useState('');

    const handleNext = () => {
        if (!selectedOption) {
            alert("Please select an answer.");
            return;
        }
        const isCorrect = selectedOption.toLowerCase() === question.correctAnswer.toLowerCase();
        onAnswer(question.id, selectedOption, isCorrect);
        setSelectedOption('');
    };

    const isMCQ = question.context.questionType === 'multiple_choice' || question.context.questionType === 'true_false' || question.context.questionType === 'assertion_reason';
    const progress = ((session.currentIndex + 1) / session.questions.length) * 100;

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Question {session.currentIndex + 1} of {session.questions.length}</span>
                    <Button variant="ghost" size="sm" onClick={onExit}>Exit Test</Button>
                </div>
                <Progress value={progress} className="mt-2" />
                <CardTitle className="pt-4 text-xl">{question.questionText}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {isMCQ && question.options ? (
                    question.options.map((option, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`}
                            onClick={() => setSelectedOption(option)}
                        >
                           <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>{option}
                        </Button>
                    ))
                ) : (
                    <input type="text" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} className="w-full p-2 border rounded-md bg-background" placeholder="Type your answer..."/>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleNext} className="w-full">
                    {session.currentIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Test'}
                    <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const TestResultsView = ({ masteredCount, totalCount, onExit }: { masteredCount: number, totalCount: number, onExit: () => void }) => (
    <Card className="w-full max-w-xl mx-auto shadow-lg text-center">
        <CardHeader>
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <CardTitle className="text-3xl font-headline mt-2">Re-attempt Complete!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg">
                You mastered <span className="font-bold text-primary">{masteredCount}</span> out of {totalCount} questions.
            </p>
            <p className="text-muted-foreground mt-1">
                Corrected questions have been removed from your list. Keep practicing!
            </p>
        </CardContent>
        <CardFooter>
            <Button onClick={onExit} className="w-full">Return to Wrong Questions List</Button>
        </CardFooter>
    </Card>
);

export default function WrongQuestionsPage() {
    const { user, wrongQuestions, removeWrongQuestion, clearAllWrongQuestions, isGuest } = useUser();
    const [showLoginPrompt, setShowLoginPrompt] = useState(isGuest);

    const [subjectFilter, setSubjectFilter] = useState('all');
    const [chapterFilter, setChapterFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
    
    const [isTestMode, setIsTestMode] = useState(false);
    const [testSession, setTestSession] = useState<{
        questions: WrongQuestion[];
        currentIndex: number;
        answers: { questionId: string, wasCorrect: boolean }[];
    } | null>(null);

    const { toast } = useToast();

    // Reset chapter filter when subject changes
    useEffect(() => {
        setChapterFilter('all');
    }, [subjectFilter]);

    const subjects = useMemo(() => [...new Set(wrongQuestions.map(q => q.context.subject))], [wrongQuestions]);
    const chapters = useMemo(() => {
        if (subjectFilter === 'all') return [];
        return [...new Set(wrongQuestions.filter(q => q.context.subject === subjectFilter).map(q => q.context.chapter))];
    }, [wrongQuestions, subjectFilter]);

    const filteredQuestions = useMemo(() => {
        return wrongQuestions
            .filter(q => {
                const subjectMatch = subjectFilter === 'all' || q.context.subject === subjectFilter;
                const chapterMatch = chapterFilter === 'all' || q.context.chapter === chapterFilter;
                return subjectMatch && chapterMatch;
            })
            .sort((a, b) => {
                if (sortOrder === 'recent') {
                    return b.attemptedAt - a.attemptedAt;
                }
                return a.attemptedAt - b.attemptedAt;
            });
    }, [wrongQuestions, subjectFilter, chapterFilter, sortOrder]);

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

    const handleStartTest = () => {
        if (filteredQuestions.length === 0) {
            toast({ title: 'No questions to re-attempt in this filter.', variant: 'destructive' });
            return;
        }
        const shuffleArray = (array: any[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
        setTestSession({
            questions: shuffleArray([...filteredQuestions]),
            currentIndex: 0,
            answers: [],
        });
        setIsTestMode(true);
    };

    const handleTestAnswer = (questionId: string, userAnswer: string, wasCorrect: boolean) => {
        if (wasCorrect) {
            removeWrongQuestion(questionId);
            toast({ title: "Correct!", description: "This question has been mastered and removed." });
            new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3b93f1aby.mp3').play();
        } else {
            toast({ title: "Incorrect", description: "This question will remain in your list for now." , variant: 'destructive'});
            new Audio('https://cdn.pixabay.com/download/audio/2022/03/07/audio_c898c8c882.mp3').play();
        }
        setTestSession(prev => prev ? ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            answers: [...prev.answers, { questionId, wasCorrect }]
        }) : null);
    };

    const handleExitTest = () => {
        setIsTestMode(false);
        setTestSession(null);
    };
    
    const masteredCount = testSession?.answers.filter(a => a.wasCorrect).length || 0;

    // Main render logic
    if (isTestMode && testSession) {
        const isTestFinished = testSession.currentIndex >= testSession.questions.length;
        return (
            <div className="container mx-auto p-4 md:p-8">
                {isTestFinished ? (
                    <TestResultsView masteredCount={masteredCount} totalCount={testSession.questions.length} onExit={handleExitTest} />
                ) : (
                    <TestSessionView session={testSession} onAnswer={handleTestAnswer} onExit={handleExitTest} />
                )}
            </div>
        );
    }

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
                        <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5"/> Filters, Sorting & Re-attempt</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div className="space-y-1.5">
                            <Label>Sort By</Label>
                             <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'recent' | 'oldest')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Recent First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1.5 self-end">
                            <Button className="w-full" onClick={handleStartTest} disabled={filteredQuestions.length === 0}>
                                <TestTube className="mr-2 h-4 w-4" />
                                Re-attempt ({filteredQuestions.length})
                            </Button>
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
                        <WrongQuestionCard key={q.id} question={q} />
                    ))}
                </div>
            )}
        </div>
    );
}
