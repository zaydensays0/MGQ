
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMockTest } from '@/ai/flows/generate-mock-test';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { GradeLevelNCERT, QuestionTypeNCERT, GenerateMockTestInput, MockTestQuestion } from '@/types';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Loader2, Sparkles, Trophy, Save } from 'lucide-react';

type TestState = 'setup' | 'testing' | 'results';

interface TestAnswer {
    question: MockTestQuestion;
    userAnswer: string;
    isCorrect: boolean;
    earnedXp: number;
}

const difficultyLevels = [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }] as const;
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

    const { handleCorrectAnswer } = useUser();
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
            handleCorrectAnswer(earnedXp); // Pass base XP, context will add streak bonus
        }

        setUserAnswers(prev => [...prev, { question: currentQuestion, userAnswer: selectedOption, isCorrect, earnedXp }]);

        setSelectedOption(null); // Reset selection for next question

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setTestState('results');
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
            questionType: 'multiple_choice' as QuestionTypeNCERT, // Generic context type
        };

        addMultipleQuestions(questionsToSave, context);
        toast({ title: 'Questions Saved!', description: `${questionsToSave.length} ${type} questions have been added to your collection.` });
    };

    const restartTest = () => {
        setTestState('setup');
        setTestQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
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
            <Card className="w-full max-w-xl mx-auto shadow-lg text-center">
                <CardHeader>
                    <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                    <CardTitle className="text-3xl font-headline mt-2">Test Complete!</CardTitle>
                    <CardDescription className="text-lg">Great job! Here are your results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert>
                        <AlertTitle className="text-2xl font-bold text-primary">You earned {totalXp.toLocaleString()} XP!</AlertTitle>
                        <AlertDescription>You answered {correctAnswers} out of {testQuestions.length} questions correctly.</AlertDescription>
                    </Alert>
                    <div className="flex justify-center gap-4">
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
            {renderContent()}
        </div>
    );
}
