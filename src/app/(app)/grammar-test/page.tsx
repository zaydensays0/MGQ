'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateGrammarTest } from '@/ai/flows/generate-grammar-test';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { GradeLevelNCERT, GrammarQuestionType, GrammarTestQuestion, GenerateGrammarTestInput, QuestionContext, QuestionTypeNCERT, RecheckAnswerOutput } from '@/types';
import { GRADE_LEVELS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SpellCheck, Loader2, Sparkles, Trophy, Save, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
    numberOfQuestions: z.coerce.number().min(3, "Minimum 3 questions."),
});

type SetupFormValues = z.infer<typeof setupSchema>;

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
                        <Input id="numberOfQuestions" type="number" min="3" {...field} />
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

const ResultsView = ({ userAnswers, testQuestions, restartTest, onSave, onRecheck, recheckStates, testContext }: {
    userAnswers: TestAnswer[];
    testQuestions: GrammarTestQuestion[];
    restartTest: () => void;
    onSave: (filter: 'correct' | 'incorrect' | 'all') => void;
    onRecheck: (index: number, answer: TestAnswer) => void;
    recheckStates: Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>;
    testContext: SetupFormValues;
}) => {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const totalXp = userAnswers.reduce((sum, a) => sum + a.earnedXp, 0);

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                <CardTitle className="text-3xl font-headline mt-2">Test Complete!</CardTitle>
                <CardDescription className="text-lg">Here are your grammar test results.</CardDescription>
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
                                <Accordion type="single" collapsible className="w-full mt-2">
                                  <AccordionItem value="explanation" className="border-none">
                                    <AccordionTrigger className="text-xs p-2">View Explanation</AccordionTrigger>
                                    <AccordionContent className="p-2">
                                      {answer.question.explanation}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                                <div className="flex justify-end mt-2">
                                    <Button size="sm" variant="ghost" onClick={() => onRecheck(index, answer)} disabled={recheckState.loading || !!recheckState.result}>
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
                <div className="space-y-2 pt-4 border-t">
                    <Label className="text-muted-foreground text-center block">Save Questions for Revision</Label>
                    <div className="flex flex-col sm:flex-row justify-center gap-2">
                        <Button onClick={() => onSave('incorrect')} variant="destructive" size="sm"><Save className="mr-2 h-4 w-4" /> Save Incorrect</Button>
                        <Button onClick={() => onSave('correct')} variant="outline" size="sm"><Save className="mr-2 h-4 w-4" /> Save Correct</Button>
                        <Button onClick={() => onSave('all')} variant="secondary" size="sm"><Save className="mr-2 h-4 w-4" /> Save All</Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={restartTest} className="w-full">Take Another Test</Button>
            </CardFooter>
        </Card>
    );
};


export default function GrammarTestPage() {
    const [testState, setTestState] = useState<TestState>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [testQuestions, setTestQuestions] = useState<GrammarTestQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<TestAnswer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [directAnswer, setDirectAnswer] = useState('');
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});

    const { handleCorrectAnswer, trackStats, addWrongQuestion } = useUser();
    const { addMultipleQuestions } = useSavedQuestions();
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
        } else {
            toast({
                title: "Incorrect",
                description: `The correct answer was: "${currentQuestion.answer}"`,
                variant: "destructive"
            });
            const { gradeLevel, topic } = form.getValues();
            addWrongQuestion({
                questionText: currentQuestion.text,
                userAnswer: userAnswer,
                correctAnswer: currentQuestion.answer,
                options: currentQuestion.options,
                explanation: currentQuestion.explanation,
                context: {
                    gradeLevel: gradeLevel,
                    subject: 'English Grammar',
                    chapter: topic,
                    questionType: questionType as QuestionTypeNCERT,
                }
            });
        }

        setUserAnswers(prev => [...prev, { question: currentQuestion, userAnswer: userAnswer, isCorrect, earnedXp }]);
        trackStats({ grammarQuestionsCompleted: 1 });

        setSelectedOption(null);
        setDirectAnswer('');

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setTestState('results');
        }
    };

    const handleSaveQuestions = (filter: 'correct' | 'incorrect' | 'all') => {
        const { gradeLevel, topic } = form.getValues();

        const questionsToSave = userAnswers
            .filter(answer => {
                if (filter === 'all') return true;
                return filter === 'correct' ? answer.isCorrect : !answer.isCorrect;
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
            toast({ title: 'Nothing to Save', description: `You have no ${filter} questions to save from this test.` });
            return;
        }

        const questionType = form.getValues('questionType');
        const mappedQuestionType: QuestionTypeNCERT = questionType === 'direct_answer' ? 'short_answer' : questionType;

        const context: QuestionContext = {
            gradeLevel: gradeLevel as GradeLevelNCERT,
            subject: 'English Grammar',
            chapter: topic,
            questionType: mappedQuestionType,
        };

        addMultipleQuestions(questionsToSave, context);
        toast({ title: 'Questions Saved!', description: `${questionsToSave.length} ${filter} questions have been added to your saved questions.` });
    };

    const handleRecheckAnswer = async (index: number, answer: TestAnswer) => {
        setRecheckStates(prev => ({...prev, [index]: {loading: true, result: null}}));
        const testContext = form.getValues();
        try {
            const result = await recheckAnswer({
                question: answer.question.text,
                originalAnswer: answer.question.answer,
                gradeLevel: testContext.gradeLevel,
                subject: 'English Grammar',
                chapter: testContext.topic,
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
                    onSave={handleSaveQuestions}
                    onRecheck={handleRecheckAnswer}
                    recheckStates={recheckStates}
                    testContext={form.getValues()}
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
