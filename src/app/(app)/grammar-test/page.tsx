'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateGrammarTest } from '@/ai/flows/generate-grammar-test';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';
import type { GradeLevelNCERT, GrammarQuestionType, GrammarTestQuestion, GenerateGrammarTestInput } from '@/types';
import { GRADE_LEVELS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SpellCheck, Loader2, Sparkles, Trophy } from 'lucide-react';

type TestState = 'setup' | 'testing' | 'results';

interface TestAnswer {
    question: GrammarTestQuestion;
    userAnswer: string;
    isCorrect: boolean;
    earnedXp: number;
}

const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice (MCQ)' },
    { value: 'true_false', label: 'True/False' },
    { value: 'direct_answer', label: 'Direct Answer' }
] as const;

const setupSchema = z.object({
    topic: z.string().min(3, "Please enter a valid grammar topic."),
    gradeLevel: z.enum(GRADE_LEVELS),
    questionType: z.enum(['multiple_choice', 'true_false', 'direct_answer']),
    numberOfQuestions: z.coerce.number().min(3, "Minimum 3 questions.").max(15, "Maximum 15 questions."),
});

type SetupFormValues = z.infer<typeof setupSchema>;


// --- View Components (moved outside main component) ---

const SetupView = ({ form, handleStartTest, isLoading }: {
    form: any;
    handleStartTest: (data: SetupFormValues) => void;
    isLoading: boolean;
}) => (
    <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
                <SpellCheck className="w-6 h-6 mr-3 text-primary" />
                Grammar Test
            </CardTitle>
            <CardDescription>Test your knowledge on any English grammar topic.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleStartTest)}>
            <CardContent className="space-y-4">
                <Controller name="topic" control={form.control} render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                        <Label htmlFor="topic">Grammar Topic</Label>
                        <Input id="topic" placeholder="e.g., Tenses, Prepositions, Active Voice" {...field} />
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Controller name="gradeLevel" control={form.control} render={({ field, fieldState }) => (
                        <div className="space-y-1.5">
                            <Label htmlFor="gradeLevel">Class Level</Label>
                            <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id="gradeLevel"><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent></Select>
                            {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                        </div>
                    )} />
                    <Controller name="questionType" control={form.control} render={({ field, fieldState }) => (
                         <div className="space-y-1.5">
                            <Label htmlFor="questionType">Question Type</Label>
                            <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger id="questionType"><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent>{questionTypes.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}</SelectContent></Select>
                            {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                        </div>
                    )} />
                </div>
                 <Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (
                    <div className="space-y-1.5">
                        <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                        <Input id="numberOfQuestions" type="number" min="3" max="15" {...field} />
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                )} />
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Test...</> : <><Sparkles className="mr-2 h-4 w-4" /> Start Test</>}
                </Button>
            </CardFooter>
        </form>
    </Card>
);

const TestingView = ({
    testQuestions,
    currentQuestionIndex,
    form,
    selectedOption,
    setSelectedOption,
    directAnswer,
    setDirectAnswer,
    handleNextQuestion
}: {
    testQuestions: GrammarTestQuestion[];
    currentQuestionIndex: number;
    form: any;
    selectedOption: string | null;
    setSelectedOption: React.Dispatch<React.SetStateAction<string | null>>;
    directAnswer: string;
    setDirectAnswer: React.Dispatch<React.SetStateAction<string>>;
    handleNextQuestion: () => void;
}) => {
    const currentQuestion = testQuestions[currentQuestionIndex];
    const questionType = form.getValues('questionType');
    const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                    <span>150 XP</span>
                </div>
                <Progress value={progress} className="mt-2" />
                <CardTitle className="pt-4 text-xl">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {questionType === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
                     <Button key={index} variant="outline" className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => setSelectedOption(option)}>
                       <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>{option}
                    </Button>
                ))}
                {questionType === 'true_false' && ['True', 'False'].map(option => (
                    <Button key={option} variant="outline" className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => setSelectedOption(option)}>
                        {option}
                    </Button>
                ))}
                {questionType === 'direct_answer' && (
                    <Textarea placeholder="Type your answer here..." value={directAnswer} onChange={e => setDirectAnswer(e.target.value)} />
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleNextQuestion} className="w-full">
                    {currentQuestionIndex < testQuestions.length - 1 ? 'Next Question' : 'Finish Test'}
                </Button>
            </CardFooter>
        </Card>
    );
};

const ResultsView = ({ userAnswers, testQuestions, restartTest }: {
    userAnswers: TestAnswer[];
    testQuestions: GrammarTestQuestion[];
    restartTest: () => void;
}) => {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const totalXp = userAnswers.reduce((sum, a) => sum + a.earnedXp, 0);

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg text-center">
            <CardHeader>
                <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                <CardTitle className="text-3xl font-headline mt-2">Test Complete!</CardTitle>
                <CardDescription className="text-lg">Here are your grammar test results.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Alert>
                    <AlertTitle className="text-2xl font-bold text-primary">You earned {totalXp.toLocaleString()} XP!</AlertTitle>
                    <AlertDescription>You answered {correctAnswers} out of {testQuestions.length} questions correctly.</AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button onClick={restartTest} className="w-full">Take Another Test</Button>
            </CardFooter>
        </Card>
    );
};


// --- Main Page Component ---
export default function GrammarTestPage() {
    const [testState, setTestState] = useState<TestState>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [testQuestions, setTestQuestions] = useState<GrammarTestQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<TestAnswer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [directAnswer, setDirectAnswer] = useState('');

    const { handleCorrectAnswer } = useUser();
    const { toast } = useToast();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            topic: '',
            numberOfQuestions: 5,
            questionType: 'multiple_choice',
        },
    });

    const handleStartTest = async (data: SetupFormValues) => {
        setIsLoading(true);
        const input: GenerateGrammarTestInput = {
            ...data,
            questionType: data.questionType as GrammarQuestionType,
        };

        try {
            const result = await generateGrammarTest(input);
            if (!result || result.questions.length === 0) {
                toast({ title: 'Error', description: 'Could not generate test questions for the given topic.', variant: 'destructive' });
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
        const questionType = form.getValues('questionType');
        const userAnswer = questionType === 'direct_answer' ? directAnswer : selectedOption;

        if (userAnswer === null || userAnswer.trim() === '') {
            toast({ title: 'No Answer', description: 'Please provide an answer before proceeding.', variant: 'destructive' });
            return;
        }

        const currentQuestion = testQuestions[currentQuestionIndex];
        const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
        const earnedXp = isCorrect ? 150 : 0;
        
        if (isCorrect) {
            handleCorrectAnswer(earnedXp);
        }

        setUserAnswers(prev => [...prev, { question: currentQuestion, userAnswer: userAnswer, isCorrect, earnedXp }]);

        // Reset for next question
        setSelectedOption(null);
        setDirectAnswer('');

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setTestState('results');
        }
    };

    const restartTest = () => {
        setTestState('setup');
        setTestQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        form.reset();
    };

    const renderContent = () => {
        switch(testState) {
            case 'testing': return (
                <TestingView
                    testQuestions={testQuestions}
                    currentQuestionIndex={currentQuestionIndex}
                    form={form}
                    selectedOption={selectedOption}
                    setSelectedOption={setSelectedOption}
                    directAnswer={directAnswer}
                    setDirectAnswer={setDirectAnswer}
                    handleNextQuestion={handleNextQuestion}
                />
            );
            case 'results': return (
                <ResultsView
                    userAnswers={userAnswers}
                    testQuestions={testQuestions}
                    restartTest={restartTest}
                />
            );
            case 'setup':
            default:
                return (
                    <SetupView
                        form={form}
                        handleStartTest={handleStartTest}
                        isLoading={isLoading}
                    />
                );
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            {renderContent()}
        </div>
    );
}
