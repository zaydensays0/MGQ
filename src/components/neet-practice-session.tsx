
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { NeetQuestion, QuestionContext, QuestionTypeNCERT, RecheckAnswerOutput } from '@/types';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { BookMarked, Check, ChevronsLeft, ChevronsRight, Eye, Lightbulb, RotateCw, Sparkles, Trophy, X, CheckCircle, BookOpenCheck, EyeOff, Loader2 } from 'lucide-react';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

type AnswerStatus = {
    isCorrect: boolean;
    userAnswer: string;
};

type FilterStatus = 'all' | 'attempted' | 'not_attempted' | 'bookmarked';

export const NeetPracticeSession = ({ questions, context }: { questions: NeetQuestion[], context: { subject: string, classLevel: string, chapter: string } }) => {
    const { handleCorrectAnswer, trackStats } = useUser();
    const { addQuestion, isSaved } = useSavedQuestions();
    const { toast } = useToast();

    // Filters
    const [typeFilter, setTypeFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerStatus>>({});
    
    // State for numerical question visibility
    const [numericalVisibility, setNumericalVisibility] = useState<Record<number, { answer?: boolean, solution?: boolean }>>({});
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});

    
    const isQuestionBookmarked = (q: NeetQuestion) => isSaved(q.text, { ...context, questionType: q.type as QuestionTypeNCERT, gradeLevel: context.classLevel as any });
    
    const filteredQuestionIndices = useMemo(() => {
        return questions
            .map((_, index) => index)
            .filter(index => {
                const question = questions[index];
                const typeMatch = typeFilter === 'all' || question.type === typeFilter;
                const difficultyMatch = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
                
                let statusMatch = true;
                if (statusFilter === 'attempted') statusMatch = !!answers[index];
                if (statusFilter === 'not_attempted') statusMatch = !answers[index];
                if (statusFilter === 'bookmarked') statusMatch = isQuestionBookmarked(question);
                
                return typeMatch && difficultyMatch && statusMatch;
            });
    }, [questions, typeFilter, difficultyFilter, statusFilter, answers, isSaved, context]);

    useEffect(() => {
        setCurrentQuestionIndex(0);
    }, [typeFilter, difficultyFilter, statusFilter]);
    
    const activeQuestionIndex = filteredQuestionIndices[currentQuestionIndex];
    const currentQuestion = activeQuestionIndex !== undefined ? questions[activeQuestionIndex] : null;

    if (!currentQuestion) {
        return (
            <Card className="w-full max-w-2xl mx-auto text-center">
                 <CardHeader>
                     <CardTitle>No Matching Questions</CardTitle>
                     <CardDescription>
                         No questions match your current filter settings. Try adjusting the filters.
                     </CardDescription>
                 </CardHeader>
                 <CardContent>
                     <Button onClick={() => { setTypeFilter('all'); setDifficultyFilter('all'); setStatusFilter('all'); }}>
                         Reset Filters
                     </Button>
                 </CardContent>
            </Card>
        );
    }
    
    const isAttempted = answers[activeQuestionIndex] !== undefined;

    const handleAnswerSelect = (selectedOption: string) => {
        if (isAttempted) return;

        const isCorrect = selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();
        
        setAnswers(prev => ({ ...prev, [activeQuestionIndex]: { isCorrect, userAnswer: selectedOption } }));
        
        // For non-numerical, show explanation immediately
        if (currentQuestion.type !== 'numerical') {
            setNumericalVisibility(prev => ({ ...prev, [activeQuestionIndex]: { ...prev[activeQuestionIndex], solution: true }}));
        }

        if (isCorrect) {
            toast({ title: "Correct!", description: "+400 XP", className: "bg-success text-success-foreground border-transparent" });
            handleCorrectAnswer(400);
            new Audio('/sounds/correct.mp3').play();
        } else {
            toast({ title: "Incorrect!", description: `The correct answer is: ${currentQuestion.answer}`, variant: "destructive" });
            new Audio('/sounds/incorrect.mp3').play();
        }
    };
    
    const handleBookmark = () => {
        if (isQuestionBookmarked(currentQuestion)) {
            toast({ title: "Already bookmarked!" });
            return;
        }
        addQuestion({
            text: currentQuestion.text,
            answer: currentQuestion.answer,
            options: currentQuestion.options,
            questionType: currentQuestion.type as QuestionTypeNCERT,
            gradeLevel: context.classLevel as any,
            subject: context.subject,
            chapter: context.chapter,
        });
        toast({ title: "Bookmarked!", description: "Question saved for revision." });
    };

    const navigate = (direction: number) => {
        const newIndex = currentQuestionIndex + direction;
        if (newIndex >= 0 && newIndex < filteredQuestionIndices.length) {
            setCurrentQuestionIndex(newIndex);
        }
    };
    
    const getOptionStyle = (option: string) => {
        if (!isAttempted) return 'outline';
        const answerData = answers[activeQuestionIndex];
        const isCorrectOption = option.toLowerCase() === currentQuestion.answer.toLowerCase();
        
        if (isCorrectOption) return 'default';
        if (answerData.userAnswer === option && !answerData.isCorrect) return 'destructive';
        return 'outline';
    };

    const handleRecheck = async () => {
        if (!currentQuestion) return;
        setRecheckStates(prev => ({ ...prev, [activeQuestionIndex]: { loading: true, result: null } }));
        try {
            const result = await recheckAnswer({
                question: currentQuestion.text,
                originalAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                gradeLevel: context.classLevel as any,
                subject: context.subject,
                chapter: context.chapter,
            });
            setRecheckStates(prev => ({ ...prev, [activeQuestionIndex]: { loading: false, result } }));
            toast({ title: "Recheck Complete" });
        } catch (error) {
            setRecheckStates(prev => ({ ...prev, [activeQuestionIndex]: { loading: false, result: null } }));
            toast({ title: "Recheck Failed", variant: "destructive" });
        }
    };

    const toggleVisibility = (field: 'answer' | 'solution') => {
        setNumericalVisibility(prev => ({
            ...prev,
            [activeQuestionIndex]: {
                ...prev[activeQuestionIndex],
                [field]: !prev[activeQuestionIndex]?.[field]
            }
        }));
    };

    const recheckState = recheckStates[activeQuestionIndex] || { loading: false, result: null };
    const visibility = numericalVisibility[activeQuestionIndex] || {};

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1.5">
                        <Label>Question Type</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="mcq">MCQ</SelectItem><SelectItem value="assertion_reason">Assertion/Reason</SelectItem><SelectItem value="numerical">Numerical</SelectItem></SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Difficulty</Label>
                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}><SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Difficulties</SelectItem><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}><SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Questions</SelectItem>
                                <SelectItem value="attempted">Attempted</SelectItem>
                                <SelectItem value="not_attempted">Not Attempted</SelectItem>
                                <SelectItem value="bookmarked">Bookmarked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Question {currentQuestionIndex + 1} of {filteredQuestionIndices.length}</CardTitle>
                            <CardDescription>Subject: <span className="capitalize">{context.subject}</span> | Chapter: {context.chapter}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{currentQuestion.difficulty}</Badge>
                            <Badge variant="outline" className="capitalize">{currentQuestion.type.replace('_', ' ')}</Badge>
                        </div>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / filteredQuestionIndices.length) * 100} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-base font-semibold leading-relaxed whitespace-pre-wrap">{currentQuestion.text}</p>
                    
                    {currentQuestion.type !== 'numerical' && (
                        <div className="space-y-2">
                            {currentQuestion.options?.map((option, index) => (
                                <Button
                                    key={index}
                                    variant={getOptionStyle(option)}
                                    className="w-full justify-start items-start text-left h-auto p-3 whitespace-normal"
                                    onClick={() => handleAnswerSelect(option)}
                                    disabled={isAttempted}
                                >
                                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                                    <span className="text-left">{option}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                    
                    {currentQuestion.type === 'numerical' && (
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" onClick={() => toggleVisibility('answer')}>
                                    {visibility.answer ? <EyeOff/> : <Eye/>}
                                    {visibility.answer ? 'Hide' : 'Show'} Answer
                                </Button>
                                <Button variant="outline" onClick={handleRecheck} disabled={recheckState.loading || !!recheckState.result}>
                                    {recheckState.loading ? <Loader2 className="animate-spin" /> : <RotateCw/>}
                                    Recheck Answer
                                </Button>
                                <Button variant="outline" onClick={() => toggleVisibility('solution')}>
                                    {visibility.solution ? <EyeOff/> : <BookOpenCheck/>}
                                    {visibility.solution ? 'Hide' : 'Show'} Solution
                                </Button>
                            </div>
                            
                            {visibility.answer && (
                                <Alert>
                                    <AlertTitle className="font-semibold">Final Answer</AlertTitle>
                                    <AlertDescription className="text-lg font-bold font-mono">{currentQuestion.answer}</AlertDescription>
                                </Alert>
                            )}
                            
                            {recheckState.result && (
                                <Alert variant={recheckState.result.isCorrect ? 'default' : 'destructive'}>
                                    <RotateCw className="h-4 w-4" />
                                    <AlertTitle>Verification Result</AlertTitle>
                                    <AlertDescription>
                                        <p>{recheckState.result.explanation}</p>
                                        {!recheckState.result.isCorrect && <p className="mt-2 font-semibold">Corrected Answer: {recheckState.result.correctAnswer}</p>}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {(isAttempted || visibility.solution) && (
                        <Accordion type="single" collapsible value={visibility.solution ? "item-1" : ""} onValueChange={(v) => toggleVisibility('solution')}>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex items-center">
                                        <Lightbulb className="mr-2 h-4 w-4" /> Explanation
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="prose prose-sm max-w-none dark:prose-invert">
                                    {currentQuestion.explanation}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => navigate(-1)} disabled={currentQuestionIndex === 0}>
                        <ChevronsLeft className="mr-2" /> Previous
                    </Button>
                    <Button variant="ghost" onClick={handleBookmark}>
                        {isQuestionBookmarked(currentQuestion) ? <CheckCircle className="mr-2 text-green-500" /> : <BookMarked className="mr-2" />}
                        {isQuestionBookmarked(currentQuestion) ? "Bookmarked" : "Bookmark"}
                    </Button>
                    <Button onClick={() => navigate(1)} disabled={currentQuestionIndex === filteredQuestionIndices.length - 1}>
                        Next <ChevronsRight className="ml-2" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
