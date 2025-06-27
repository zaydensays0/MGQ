
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
import { ClipboardCheck, Loader2, Sparkles, Trophy, Save, ShieldCheck } from 'lucide-react';

type TestState = 'setup' | 'testing' | 'results';

interface TestAnswer {
    question: MockTestQuestion;
    userAnswer: string;
    isCorrect: boolean;
    earnedXp: number;
}

const difficultyLevels = [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', 'label': 'Hard' }] as const;
type Difficulty = typeof difficultyLevels[number]['value'];

const setupSchema = z.object({
    gradeLevel: z.enum(GRADE_LEVELS),
    subject: z.string().min(1, "Please select a subject."),
    chapters: z.string().min(1, "Please enter at least one chapter."),
    numberOfQuestions: z.coerce.number().min(5, "Minimum 5 questions."),
    difficulty: z.enum(['easy', 'medium', 'hard']),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function MockTestPage() {
    const [testState, setTestState] = useState<TestState>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [testQuestions, setTestQuestions] = useState<MockTestQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<TestAnswer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { user, handleCorrectAnswer, trackStats, addWrongQuestion } = useUser();
    const { addMultipleQuestions } = useSavedQuestions();
    const { toast } = useToast();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            chapters: '',
            numberOfQuestions: 10,
            difficulty: 'medium',
        },
    });

    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement) {
            if (isLoading && testState === 'setup') {
                audioElement.play().catch(error => {
                    console.error("Audio play failed.", error);
                });
            } else {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
        }
    }, [isLoading, testState]);

    const handleStartTest = async (data: SetupFormValues) => {
        setIsLoading(true);
        const input: GenerateMockTestInput = {
            ...data,
            gradeLevel: parseInt(data.gradeLevel, 10),
        };

        try {
            const result = await generateMockTest(input);
            if (!result || result.questions.length === 0) {
                toast({ title: 'Error', description: 'Could not generate test questions for the given criteria.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }
            setTestQuestions(result.questions);
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
        const earnedXp = isCorrect ? (currentQuestion.type === 'multiple_choice' ? 300 : 200) : 0;
        
        if (isCorrect) {
            handleCorrectAnswer(earnedXp);
            new Audio('/sounds/correct.mp3').play();
        } else {
            toast({
                title: "Incorrect",
                description: `The correct answer was: "${currentQuestion.answer}"`,
                variant: "destructive"
            });
            new Audio('/sounds/incorrect.mp3').play();
            // Save the wrong question
            addWrongQuestion({
                questionText: currentQuestion.text,
                userAnswer: selectedOption,
                correctAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                explanation: `This question was part of a mock test on ${form.getValues('chapters')}.`,
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
            // Track stats at the end of the test
            const correctCount = newAnswers.filter(a => a.isCorrect).length;
            const accuracy = correctCount / testQuestions.length;
            
            trackStats({ 
                mockTestsCompleted: 1, 
                perfectMockTests: accuracy === 1 ? 1 : 0,
                accuracy: accuracy,
                isFirstTest: user?.stats.mockTestsCompleted === 0,
            });
        }
    };
    
    const handleSaveQuestions = (type: 'correct' | 'incorrect') => {
        const questionsToSave = userAnswers
            .filter(answer => type === 'correct' ? answer.isCorrect : !answer.isCorrect)
            .map(answer => {
                const { question } = answer;
                return {
                    question: question.text,
                    answer: question.answer,
                    options: question.options
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
        toast({ title: 'Questions Saved!', description: `${questionsToSave.length} ${type} questions have been added to your collection.` });
    };

    const handleRecheckAnswer = async (index: number, answer: TestAnswer) => {
        setRecheckStates(prev => ({...prev, [index]: {loading: true, result: null}}));
        const testContext = form.getValues();
        try {
            const result = await recheckAnswer({
                question: answer.question.text,
                originalAnswer: answer.question.answer,
                gradeLevel: testContext.gradeLevel,
                subject: testContext.subject,
                chapter: testContext.chapters,
            });
            setRecheckStates(prev => ({...prev, [index]: {loading: false, result}}));
            toast({
                title: "Recheck Complete",
                description: result.isCorrect ? "The original answer was confirmed correct." : "A correction was found.",
            });
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
        form.reset();
    };

    const SetupView = (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <ClipboardCheck className="w-6 h-6 mr-3 text-primary" />
                    Mock Test Setup
                </CardTitle>
                <CardDescription>Let’s test your memory! Answer questions from real chapters, earn XP, and save what you got wrong for revision!</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(handleStartTest)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller name="gradeLevel" control={form.control} render={({ field, fieldState }) => (
                            <div className="space-y-1.5">
                                <Label htmlFor="gradeLevel">Grade Level</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id="gradeLevel"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent></Select>
                                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                            </div>
                        )} />
                        <Controller name="subject" control={form.control} render={({ field, fieldState }) => (
                             <div className="space-y-1.5">
                                <Label htmlFor="subject">Subject</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id="subject"><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
                                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                            </div>
                        )} />
                    </div>
                     <Controller name="chapters" control={form.control} render={({ field, fieldState }) => (
                        <div className="space-y-1.5">
                            <Label htmlFor="chapters">Chapters (comma-separated)</Label>
                            <Input id="chapters" placeholder="e.g., Life Processes, Control and Coordination" {...field} />
                            {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                        </div>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (
                            <div className="space-y-1.5">
                                <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                                <Input id="numberOfQuestions" type="number" min="5" {...field} />
                                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                            </div>
                        )} />
                        <Controller name="difficulty" control={form.control} render={({ field, fieldState }) => (
                            <div className="space-y-1.5">
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="difficulty"><SelectValue placeholder="Select Difficulty" /></SelectTrigger>
                                    <SelectContent>
                                        {difficultyLevels.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                            </div>
                        )} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Test...</> : <><Sparkles className="mr-2 h-4 w-4" /> Start Mock Test</>}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );

    const TestingView = () => {
        const currentQuestion = testQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;

        return (
            <Card className="w-full max-w-xl mx-auto shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                        <span>{currentQuestion.type === 'multiple_choice' ? '300 XP' : '200 XP'}</span>
                    </div>
                    <Progress value={progress} className="mt-2" />
                    <CardTitle className="pt-4 text-xl">{currentQuestion.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                         <Button
                            key={index}
                            variant="outline"
                            className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`}
                            onClick={() => setSelectedOption(option)}
                        >
                           {currentQuestion.type === 'multiple_choice' && <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>}
                           {option}
                        </Button>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextQuestion} className="w-full">
                        {currentQuestionIndex < testQuestions.length - 1 ? 'Next Question' : 'Finish Test'}
                    </Button>
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
                     <Alert>
                        <AlertTitle className="text-2xl font-bold text-primary">You earned {totalXp.toLocaleString()} XP!</AlertTitle>
                        <AlertDescription>You answered {correctAnswers} out of {testQuestions.length} questions correctly.</AlertDescription>
                    </Alert>
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-center">Review Your Answers</h3>
                        {userAnswers.map((answer, index) => {
                            const recheckState = recheckStates[index] || { loading: false, result: null };
                            return (
                                <div key={index} className={`p-4 rounded-lg border ${answer.isCorrect ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950'}`}>
                                    <p className="font-semibold">{index + 1}. {answer.question.text}</p>
                                    <p className="text-sm mt-2">Your answer: <span className="font-medium">{answer.userAnswer}</span></p>
                                    {!answer.isCorrect && <p className="text-sm">Correct answer: <span className="font-medium">{answer.question.answer}</span></p>}
                                    <div className="flex justify-end mt-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleRecheckAnswer(index, answer)} disabled={recheckState.loading || !!recheckState.result}>
                                            {recheckState.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                                            {recheckState.loading ? 'Verifying...' : 'Recheck AI Answer'}
                                        </Button>
                                    </div>
                                    {recheckState.result && (
                                        <Alert className="mt-2" variant={recheckState.result.isCorrect ? 'default' : 'destructive'}>
                                            <ShieldCheck className="h-4 w-4" />
                                            <AlertTitle>{recheckState.result.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                                            <AlertDescription className="space-y-1">
                                                <p>{recheckState.result.explanation}</p>
                                                {!recheckState.result.isCorrect && <p><b>Corrected:</b> {recheckState.result.correctAnswer}</p>}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-4 pt-4 border-t">
                        <Button onClick={() => handleSaveQuestions('correct')} variant="outline"><Save className="mr-2 h-4 w-4" /> Save Correct</Button>
                        <Button onClick={() => handleSaveQuestions('incorrect')} variant="destructive"><Save className="mr-2 h-4 w-4" /> Save Incorrect</Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={restartTest} className="w-full">Take Another Test</Button>
                </CardFooter>
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
            <audio ref={audioRef} src="/sounds/generating-music.mp3" loop />
            {renderContent()}
        </div>
    );
}
