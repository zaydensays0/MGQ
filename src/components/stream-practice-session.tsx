
'use client';

import { useState } from 'react';
import type { StreamQuestion, RecheckAnswerOutput, StreamId, AnyQuestionType, SavedQuestion } from '@/types';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ChevronsLeft, ChevronsRight, Eye, EyeOff, Lightbulb, RotateCw, ShieldCheck, Loader2, Save, CheckCircle, Star } from 'lucide-react';
import { Input } from './ui/input';

type AnswerStatus = {
    isCorrect: boolean;
    userAnswer: string;
};

export const StreamPracticeSession = ({ questions, context }: { 
    questions: StreamQuestion[], 
    context: { streamId: StreamId, subject: string, chapter: string, level: string } 
}) => {
    const { handleCorrectAnswer, addWrongQuestion } = useUser();
    const { addQuestion, isSaved } = useSavedQuestions();
    const { toast } = useToast();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, AnswerStatus>>({});
    const [visibility, setVisibility] = useState<Record<number, { answer?: boolean, solution?: boolean }>>({});
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});
    const [difficultyMarkers, setDifficultyMarkers] = useState<Record<number, boolean>>({});
    const [userNumericalInput, setUserNumericalInput] = useState('');

    const currentQuestion = questions[currentQuestionIndex];
    const isAttempted = answers[currentQuestionIndex] !== undefined;

    const handleAnswerSelect = (selectedAnswer: string) => {
        if (isAttempted) return;

        const isCorrect = selectedAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
        
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: { isCorrect, userAnswer: selectedAnswer } }));
        
        if (isCorrect) {
            toast({ title: "Correct!", description: "+500 XP", className: "bg-success text-success-foreground border-transparent" });
            handleCorrectAnswer(500);
            new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3b93f1aby.mp3').play();
        } else {
            toast({ title: "Incorrect!", description: `The correct answer is: ${currentQuestion.answer}`, variant: "destructive" });
            new Audio('https://cdn.pixabay.com/download/audio/2022/03/07/audio_c898c8c882.mp3').play();
            addWrongQuestion({
                questionText: currentQuestion.text,
                userAnswer: selectedAnswer,
                correctAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                explanation: currentQuestion.explanation,
                context: {
                    gradeLevel: context.level,
                    subject: context.subject,
                    chapter: context.chapter,
                    questionType: currentQuestion.type as AnyQuestionType,
                    streamId: context.streamId,
                }
            });
        }
        setUserNumericalInput(''); // Clear input after submission
    };
    
    const handleRecheck = async () => {
        setRecheckStates(prev => ({ ...prev, [currentQuestionIndex]: { loading: true, result: null } }));
        try {
            const result = await recheckAnswer({
                question: currentQuestion.text,
                originalAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                gradeLevel: context.level,
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
            setUserNumericalInput('');
            setRecheckStates({});
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

    const toggleDifficultyMarker = () => {
        setDifficultyMarkers(prev => ({
            ...prev,
            [currentQuestionIndex]: !prev[currentQuestionIndex]
        }))
    };
    
    const handleSaveQuestion = () => {
        const questionToSave: Omit<SavedQuestion, 'id' | 'timestamp'> = {
            text: currentQuestion.text,
            answer: currentQuestion.answer,
            options: currentQuestion.options,
            explanation: currentQuestion.explanation,
            questionType: currentQuestion.type,
            gradeLevel: context.level,
            subject: context.subject,
            chapter: context.chapter,
            streamId: context.streamId
        };
        addQuestion(questionToSave);
        toast({ title: 'Question Saved!', description: 'Added to your saved questions for revision.' });
    };

    const recheckState = recheckStates[currentQuestionIndex] || { loading: false, result: null };
    const currentVisibility = visibility[currentQuestionIndex] || {};
    const questionIsSaved = isSaved(currentQuestion.text, { 
        gradeLevel: context.level,
        subject: context.subject,
        chapter: context.chapter,
        questionType: currentQuestion.type,
        streamId: context.streamId,
    });

    const isNumerical = currentQuestion.type === 'numerical' || currentQuestion.type === 'integer';

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
                            {difficultyMarkers[currentQuestionIndex] && <Badge variant="destructive"><Star className="w-3 h-3 mr-1" /> Difficult</Badge>}
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
                    
                    {isNumerical && (
                         <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="text" 
                                    placeholder="Enter your numerical answer" 
                                    value={userNumericalInput}
                                    onChange={(e) => setUserNumericalInput(e.target.value)}
                                    disabled={isAttempted}
                                />
                                <Button onClick={() => handleAnswerSelect(userNumericalInput)} disabled={isAttempted || !userNumericalInput}>Submit</Button>
                            </div>
                            {isAttempted && (
                                <Alert variant={answers[currentQuestionIndex]?.isCorrect ? 'default' : 'destructive'} className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-300">
                                    <AlertTitle>{answers[currentQuestionIndex]?.isCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
                                    <AlertDescription>The correct answer is: <strong>{currentQuestion.answer}</strong></AlertDescription>
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
                <CardFooter className="flex flex-col gap-4">
                    <div className="flex flex-wrap justify-center gap-2 w-full">
                        <Button variant="outline" size="sm" onClick={handleRecheck} disabled={recheckState.loading || !!recheckState.result}>
                            {recheckState.loading ? <Loader2 className="animate-spin" /> : <RotateCw />}
                            {recheckState.loading ? 'Verifying...' : 'Recheck Answer'}
                        </Button>
                        {isNumerical && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => toggleVisibility('answer')}>
                                    {currentVisibility.answer ? <EyeOff/> : <Eye/>}
                                    {currentVisibility.answer ? 'Hide' : 'Show'} Answer
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => toggleVisibility('solution')}>
                                    {currentVisibility.solution ? <EyeOff/> : <Lightbulb/>}
                                    {currentVisibility.solution ? 'Hide' : 'Show'} Solution
                                </Button>
                            </>
                        )}
                        <Button variant="outline" size="sm" onClick={handleSaveQuestion} disabled={questionIsSaved}>
                            {questionIsSaved ? <CheckCircle /> : <Save />}
                            {questionIsSaved ? 'Saved' : 'Save for Revision'}
                        </Button>
                         <Button variant={difficultyMarkers[currentQuestionIndex] ? 'destructive' : 'outline'} size="sm" onClick={toggleDifficultyMarker}>
                            <Star />
                            Mark as Difficult
                        </Button>
                    </div>
                     <div className="flex justify-between items-center w-full pt-4 border-t">
                        <Button variant="outline" onClick={() => navigate(-1)} disabled={currentQuestionIndex === 0}>
                            <ChevronsLeft className="mr-2" /> Previous
                        </Button>
                        <Button onClick={() => navigate(1)} disabled={currentQuestionIndex === questions.length - 1}>
                            Next <ChevronsRight className="ml-2" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};
