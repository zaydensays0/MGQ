
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMockTest } from '@/ai/flows/generate-mock-test';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { GradeLevelNCERT, QuestionTypeNCERT, GenerateMockTestInput, MockTestQuestion, RecheckAnswerOutput, UserStats } from '@/types';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Loader2, Sparkles, Trophy, Save, ShieldCheck, Timer } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';

type TestState = 'setup' | 'testing' | 'results';

interface TestAnswer {
    question: MockTestQuestion;
    userAnswer: string;
    isCorrect: boolean;
    earnedXp: number;
}

const difficultyLevels = [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', 'label': 'Hard' }] as const;

const setupSchema = z.object({
    gradeLevel: z.enum(GRADE_LEVELS),
    subject: z.string().min(1, "Please select a subject."),
    chapters: z.string().min(1, "Please enter at least one chapter."),
    numberOfQuestions: z.coerce.number().min(5, "Minimum 5 questions.").optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    isComprehensive: z.boolean().optional(),
}).refine(data => data.isComprehensive || (data.numberOfQuestions && data.numberOfQuestions > 0), {
    message: "Number of questions is required unless Comprehensive Mode is on.",
    path: ["numberOfQuestions"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export default function MockTestPage() {
    const [testState, setTestState] = useState<TestState>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [testQuestions, setTestQuestions] = useState<MockTestQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<TestAnswer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});
    const [time, setTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { user, handleCorrectAnswer, trackStats, addWrongQuestion } = useUser();
    const { addMultipleQuestions } = useSavedQuestions();
    const { toast } = useToast();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            chapters: '',
            numberOfQuestions: 10,
            difficulty: 'medium',
            isComprehensive: false,
        },
    });
    
    const { watch } = form;
    const isComprehensive = watch('isComprehensive');

    useEffect(() => {
        if (testState === 'testing') {
            timerRef.current = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [testState]);

    const handleStartTest = async (data: SetupFormValues) => {
        setIsLoading(true);
        const input: GenerateMockTestInput = {
            ...data,
            gradeLevel: parseInt(data.gradeLevel, 10),
            chapters: data.chapters.split(',').map(c => c.trim()),
            numberOfQuestions: data.isComprehensive ? 25 : data.numberOfQuestions!,
        };

        try {
            const result = await generateMockTest(input);
            if (!result || result.questions.length === 0) {
                toast({ title: 'Error', description: 'Could not generate test questions for the given criteria.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }
            setTestQuestions(result.questions);
            setTime(0);
            setTestState('testing');
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'An unexpected error occurred while generating the test.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextQuestion = () => {
        if (selectedOption === null) {
            toast({ title: 'No Answer', description: 'Please select an answer before proceeding.', variant: 'destructive' });
            return;
        }

        const currentQuestion = testQuestions[currentQuestionIndex];
        const isCorrect = selectedOption.toLowerCase() === currentQuestion.answer.toLowerCase();
        const earnedXp = isCorrect ? (currentQuestion.difficulty === 'hard' ? 400 : currentQuestion.difficulty === 'medium' ? 300 : 200) : 0;
        
        if (isCorrect) {
            handleCorrectAnswer(earnedXp);
        } else {
            toast({
                title: "Incorrect",
                description: `The correct answer was: "${currentQuestion.answer}"`,
                variant: "destructive"
            });
            addWrongQuestion({
                questionText: currentQuestion.text,
                userAnswer: selectedOption,
                correctAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                explanation: currentQuestion.explanation,
                context: {
                    gradeLevel: form.getValues('gradeLevel'),
                    subject: form.getValues('subject'),
                    chapter: form.getValues('chapters'),
                    questionType: currentQuestion.type as QuestionTypeNCERT,
                }
            });
        }

        const newAnswers = [...userAnswers, { question: currentQuestion, userAnswer: selectedOption, isCorrect, earnedXp }];
        setUserAnswers(newAnswers);
        setSelectedOption(null);

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setTestState('results');
            if (timerRef.current) clearInterval(timerRef.current);
            const correctCount = newAnswers.filter(a => a.isCorrect).length;
            const accuracy = correctCount / testQuestions.length;
            
            trackStats({ 
                mockTestsCompleted: 1, 
                perfectMockTests: accuracy === 1 ? 1 : 0,
            });
        }
    };
    
    const handleSaveQuestions = (type: 'correct' | 'incorrect' | 'all') => {
        const questionsToSave = userAnswers
            .filter(answer => {
                if (type === 'all') return true;
                return type === 'correct' ? answer.isCorrect : !answer.isCorrect;
            })
            .map(answer => {
                const { question } = answer;
                return {
                    question: question.text,
                    answer: question.answer,
                    options: question.options,
                    explanation: question.explanation,
                };
            });
        
        if (questionsToSave.length === 0) {
            toast({ title: 'Nothing to Save', description: `You have no ${type} questions to save from this test.` });
            return;
        }

        const context = {
            gradeLevel: form.getValues('gradeLevel'),
            subject: form.getValues('subject'),
            chapter: `[Test] ${form.getValues('chapters')}`,
            questionType: 'multiple_choice' as QuestionTypeNCERT,
        };

        addMultipleQuestions(questionsToSave, context);
    };

    const handleRecheckAnswer = async (index: number, answer: TestAnswer) => {
        setRecheckStates(prev => ({...prev, [index]: {loading: true, result: null}}));
        const testContext = form.getValues();
        try {
            const result = await recheckAnswer({
                question: answer.question.text,
                originalAnswer: answer.question.answer,
                options: answer.question.options,
                gradeLevel: testContext.gradeLevel,
                subject: testContext.subject,
                chapter: testContext.chapters,
            });
            setRecheckStates(prev => ({...prev, [index]: {loading: false, result}}));
            toast({ title: "Recheck Complete" });
        } catch (error) {
            setRecheckStates(prev => ({...prev, [index]: {loading: false, result: null}}));
            toast({ title: "Recheck Failed", variant: "destructive" });
        }
    }

    const restartTest = () => {
        setTestState('setup');
        setTestQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setRecheckStates({});
        setTime(0);
        form.reset();
    };

    const SetupView = (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <ClipboardCheck className="w-6 h-6 mr-3 text-primary" />
                    Mock Test Generator
                </CardTitle>
                <CardDescription>Configure your test, and we'll generate a unique set of questions to challenge you.</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(handleStartTest)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller name="gradeLevel" control={form.control} render={({ field, fieldState }) => (
                            <div className="space-y-1.5"><Label>Grade</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                        )} />
                        <Controller name="subject" control={form.control} render={({ field, fieldState }) => (
                             <div className="space-y-1.5"><Label>Subject</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                        )} />
                    </div>
                     <Controller name="chapters" control={form.control} render={({ field, fieldState }) => (
                        <div className="space-y-1.5"><Label>Chapters (comma-separated)</Label><Input placeholder="e.g., Life Processes, Control and Coordination" {...field} />{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                    )} />
                    <Controller name="difficulty" control={form.control} render={({ field, fieldState }) => (
                        <div className="space-y-1.5"><Label>Difficulty</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Difficulty" /></SelectTrigger><SelectContent>{difficultyLevels.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                    )} />
                     <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-2 rounded-md border p-4 flex-1"><div className="flex items-center space-x-2"><Controller name="isComprehensive" control={form.control} render={({ field }) => (<Switch id="comprehensive-mode" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="comprehensive-mode" className="text-base">Comprehensive Mode</Label></div><p className="text-xs text-muted-foreground">Generate all high-probability questions for the topic(s). (Sets question count to 25)</p></div>
                        {!isComprehensive && (<Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (<div className="space-y-1.5 flex-1"><Label>Number of Questions</Label><Input type="number" min="5" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />)}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Test...</> : <><Sparkles className="mr-2 h-4 w-4" /> Start Mock Test</>}</Button>
                </CardFooter>
            </form>
        </Card>
    );

    const TestingView = () => {
        const currentQuestion = testQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;
        const renderQuestionText = () => {
            if (currentQuestion.type === 'assertion_reason' && currentQuestion.text.includes('\\n')) {
              const parts = currentQuestion.text.split('\\n');
              return <div className="space-y-1"><p>{parts[0]}</p><p>{parts[1]}</p></div>;
            }
            return <p>{currentQuestion.text}</p>;
        };

        return (
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                        <div className="flex items-center gap-1 font-semibold"><Timer className="w-4 h-4" />{formatTime(time)}</div>
                    </div>
                    <Progress value={progress} className="mt-2" />
                    <CardTitle className="pt-4 text-xl">{renderQuestionText()}</CardTitle>
                    <CardDescription>Difficulty: <span className="capitalize">{currentQuestion.difficulty}</span> | Type: <span className="capitalize">{currentQuestion.type.replace(/_/g, " ")}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                         <Button key={index} variant="outline" className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => setSelectedOption(option)}>
                           {currentQuestion.type === 'multiple_choice' && <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>}
                           {option}
                        </Button>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextQuestion} className="w-full">{currentQuestionIndex < testQuestions.length - 1 ? 'Next Question' : 'Finish Test'}</Button>
                </CardFooter>
            </Card>
        );
    };

    const ResultsView = () => {
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const totalXp = userAnswers.reduce((sum, a) => sum + a.earnedXp, 0);

        return (
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                    <CardTitle className="text-3xl font-headline mt-2">Test Complete!</CardTitle>
                    <CardDescription className="text-lg">Great job! Here are your results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <Alert><div className="flex justify-between items-center"><div className="space-y-1"><AlertTitle className="text-xl font-bold text-primary">Score: {correctAnswers}/{testQuestions.length}</AlertTitle><AlertDescription>You earned {totalXp.toLocaleString()} XP in {formatTime(time)}!</AlertDescription></div><Trophy className="w-8 h-8 text-primary"/></div></Alert>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2"><h3 className="text-xl font-semibold text-center">Review Your Answers</h3>
                        {userAnswers.map((answer, index) => {
                            const recheckState = recheckStates[index] || { loading: false, result: null };
                            return (
                                <div key={index} className={`p-4 rounded-lg border ${answer.isCorrect ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950'}`}>
                                    <p className="font-semibold">{index + 1}. {answer.question.text}</p>
                                    <p className="text-sm mt-2">Your answer: <span className="font-medium">{answer.userAnswer}</span></p>
                                    {!answer.isCorrect && <p className="text-sm">Correct answer: <span className="font-medium">{answer.question.answer}</span></p>}
                                    <Accordion type="single" collapsible className="w-full mt-2"><AccordionItem value="explanation" className="border-none"><AccordionTrigger className="text-xs p-2">View Explanation</AccordionTrigger><AccordionContent className="p-2">{answer.question.explanation}</AccordionContent></AccordionItem></Accordion>
                                    <div className="flex justify-end mt-2"><Button size="sm" variant="ghost" onClick={() => handleRecheckAnswer(index, answer)} disabled={recheckState.loading || !!recheckState.result}>{recheckState.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}{recheckState.loading ? 'Verifying...' : 'Recheck AI Answer'}</Button></div>
                                    {recheckState.result && (<Alert className="mt-2" variant={recheckState.result.isCorrect ? 'default' : 'destructive'}><ShieldCheck className="h-4 w-4" /><AlertTitle>{recheckState.result.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle><AlertDescription className="space-y-1"><p>{recheckState.result.explanation}</p>{!recheckState.result.isCorrect && <p><b>Corrected:</b> {recheckState.result.correctAnswer}</p>}</AlertDescription></Alert>)}
                                </div>
                            );
                        })}
                    </div>
                    <div className="space-y-2 pt-4 border-t"><Label className="text-muted-foreground text-center block">Save Questions for Revision</Label><div className="flex flex-col sm:flex-row justify-center gap-2"><Button onClick={() => handleSaveQuestions('incorrect')} variant="destructive" size="sm"><Save className="mr-2 h-4 w-4" /> Save Incorrect</Button><Button onClick={() => handleSaveQuestions('correct')} variant="outline" size="sm"><Save className="mr-2 h-4 w-4" /> Save Correct</Button><Button onClick={() => handleSaveQuestions('all')} variant="secondary" size="sm"><Save className="mr-2 h-4 w-4" /> Save All</Button></div></div>
                </CardContent>
                <CardFooter><Button onClick={restartTest} className="w-full">Take Another Test</Button></CardFooter>
            </Card>
        );
    };

    const renderContent = () => {
        switch(testState) {
            case 'testing': return <TestingView />;
            case 'results': return <ResultsView />;
            case 'setup':
            default:
                return SetupView;
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            {renderContent()}
        </div>
    );
}
