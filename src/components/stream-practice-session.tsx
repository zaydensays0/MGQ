'use client';

import { useState } from 'react';
import type { StreamQuestion, RecheckAnswerOutput, StreamId, QuestionTypeNCERT, StreamQuestionType } from '@/types';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ChevronsLeft, ChevronsRight, Eye, EyeOff, Lightbulb, RotateCw, ShieldCheck, Loader2 } from 'lucide-react';

type AnswerStatus = {
    isCorrect: boolean;
    userAnswer: string;
};

export const StreamPracticeSession = ({ questions, context }: { 
    questions: StreamQuestion[], 
    context: { streamId: StreamId, subject: string, chapter: string, category: string } 
}) => {
    const { handleCorrectAnswer, addWrongQuestion } = useUser();
    const { toast } = useToast();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerStatus>>({});
    const [visibility, setVisibility] = useState<Record<number, { answer?: boolean, solution?: boolean }>>({});
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});

    const currentQuestion = questions[currentQuestionIndex];
    const isAttempted = answers[currentQuestionIndex] !== undefined;

    const handleAnswerSelect = (selectedOption: string) => {
        if (isAttempted) return;

        const isCorrect = selectedOption.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
        
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: { isCorrect, userAnswer: selectedOption } }));
        
        if (isCorrect) {
            toast({ title: "Correct!", description: "+500 XP", className: "bg-success text-success-foreground border-transparent" });
            handleCorrectAnswer(500);
            new Audio('/sounds/correct.mp3').play();
        } else {
            toast({ title: "Incorrect!", description: `The correct answer is: ${currentQuestion.answer}`, variant: "destructive" });
            new Audio('/sounds/incorrect.mp3').play();
            addWrongQuestion({
                questionText: currentQuestion.text,
                userAnswer: selectedOption,
                correctAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                explanation: currentQuestion.explanation,
                context: {
                    gradeLevel: context.category,
                    subject: context.subject,
                    chapter: context.chapter,
                    questionType: currentQuestion.type as StreamQuestionType,
                    streamId: context.streamId,
                }
            });
        }
    };
    
    const handleRecheck = async () => {
        setRecheckStates(prev => ({ ...prev, [currentQuestionIndex]: { loading: true, result: null } }));
        try {
            const result = await recheckAnswer({
                question: currentQuestion.text,
                originalAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                gradeLevel: context.category,
                subject: context.subject,
                chapter: context.chapter,
            });
            setRecheckStates(prev => ({ ...prev, [currentQuestionIndex]: { loading: false, result } }));
            toast({ title: "Recheck Complete" });
        } catch (error) {
            setRecheckStates(prev => ({ ...prev, [currentQuestionIndex]: { loading: false, result: null } }));
            toast({ title: "Recheck Failed", variant: "destructive" });
        }
    };

    const navigate = (direction: number) => {
        const newIndex = currentQuestionIndex + direction;
        if (newIndex >= 0 && newIndex < questions.length) {
            setCurrentQuestionIndex(newIndex);
        }
    };
    
    const getOptionStyle = (option: string) => {
        if (!isAttempted) return 'outline';
        const answerData = answers[currentQuestionIndex];
        const isCorrectOption = option.toLowerCase() === currentQuestion.answer.toLowerCase();
        
        if (isCorrectOption) return 'default';
        if (answerData.userAnswer === option && !answerData.isCorrect) return 'destructive';
        return 'outline';
    };

    const toggleVisibility = (field: 'answer' | 'solution') => {
        setVisibility(prev => ({
            ...prev,
            [currentQuestionIndex]: {
                ...prev[currentQuestionIndex],
                [field]: !prev[currentQuestionIndex]?.[field]
            }
        }));
    };

    const recheckState = recheckStates[currentQuestionIndex] || { loading: false, result: null };
    const currentVisibility = visibility[currentQuestionIndex] || {};

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                            <CardDescription>Subject: <span className="capitalize">{context.subject}</span> | Topic: {context.chapter}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{currentQuestion.difficulty}</Badge>
                            <Badge variant="outline" className="capitalize">{currentQuestion.type.replace(/_/g, ' ')}</Badge>
                        </div>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-base font-semibold leading-relaxed whitespace-pre-wrap">{currentQuestion.text}</p>
                    
                    {currentQuestion.type.includes('mcq') && (
                        <div className="space-y-2">
                            {currentQuestion.options?.map((option, index) => (
                                <Button key={index} variant={getOptionStyle(option)} className="w-full justify-start items-start text-left h-auto p-3 whitespace-normal"
                                    onClick={() => handleAnswerSelect(option)} disabled={isAttempted}>
                                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                                    <span className="text-left">{option}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                    
                    {(currentQuestion.type === 'numerical' || currentQuestion.type === 'integer') && (
                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" onClick={() => toggleVisibility('answer')}>
                                    {currentVisibility.answer ? <EyeOff/> : <Eye/>}
                                    {currentVisibility.answer ? 'Hide' : 'Show'} Answer
                                </Button>
                                <Button variant="outline" onClick={handleRecheck} disabled={recheckState.loading || !!recheckState.result}>
                                    {recheckState.loading ? <Loader2 className="animate-spin" /> : <RotateCw/>}
                                    Recheck Answer
                                </Button>
                                <Button variant="outline" onClick={() => toggleVisibility('solution')}>
                                    {currentVisibility.solution ? <EyeOff/> : <Lightbulb/>}
                                    {currentVisibility.solution ? 'Hide' : 'Show'} Solution
                                </Button>
                            </div>
                            
                            {currentVisibility.answer && (
                                <Alert>
                                    <AlertTitle className="font-semibold">Final Answer</AlertTitle>
                                    <AlertDescription className="text-lg font-bold font-mono">{currentQuestion.answer}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {(isAttempted || currentVisibility.solution) && (
                        <Accordion type="single" collapsible defaultValue={(isAttempted || currentVisibility.solution) ? "explanation" : undefined}>
                            <AccordionItem value="explanation">
                                <AccordionTrigger>
                                    <div className="flex items-center">
                                        <Lightbulb className="mr-2 h-4 w-4" /> Explanation / Solution
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">{currentQuestion.explanation}</div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                     {recheckState.result && (
                        <Alert variant={recheckState.result.isCorrect ? 'default' : 'destructive'}>
                            <ShieldCheck className="h-4 w-4" />
                            <AlertTitle>Verification Result</AlertTitle>
                            <AlertDescription>
                                <p>{recheckState.result.explanation}</p>
                                {!recheckState.result.isCorrect && <p className="mt-2 font-semibold">Corrected Answer: {recheckState.result.correctAnswer}</p>}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => navigate(-1)} disabled={currentQuestionIndex === 0}>
                        <ChevronsLeft className="mr-2" /> Previous
                    </Button>
                    <Button onClick={() => navigate(1)} disabled={currentQuestionIndex === questions.length - 1}>
                        Next <ChevronsRight className="ml-2" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
