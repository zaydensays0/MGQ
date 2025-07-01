
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
<<<<<<< HEAD
import type { GradeLevelNCERT, QuestionTypeNCERT, GenerateMockTestInput, MockTestQuestion, RecheckAnswerOutput, UserStats, GeneratedQuestionAnswerPair, AnyQuestionType } from '@/types';
=======
import type { GradeLevelNCERT, QuestionTypeNCERT, GenerateMockTestInput, MockTestQuestion, RecheckAnswerOutput, UserStats, GeneratedQuestionAnswerPair, SavedQuestion } from '@/types';
>>>>>>> f4c241b (Change the name of the section where board questions are saved to “Board)
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Loader2, Sparkles, Trophy, Save, ShieldCheck, Timer, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

type TestState = 'setup' | 'testing' | 'results';

interface TestAnswer {
    question: MockTestQuestion;
    userAnswer: string;
    isCorrect: boolean | null; // null for subjective questions
    earnedXp: number;
}

const difficultyLevels = [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', 'label': 'Hard' }] as const;

const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'assertion_reason', label: 'Assertion-Reason' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'long_answer', label: 'Long Answer' },
    { value: 'fill_in_the_blanks', label: 'Fill in the Blanks' },
] as const;


const setupSchema = z.object({
    gradeLevel: z.enum(GRADE_LEVELS),
    subject: z.string().min(1, "Please select a subject."),
    chapters: z.string().min(1, "Please enter at least one chapter."),
    numberOfQuestions: z.coerce.number().min(1, "Minimum 1 question.").optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    isComprehensive: z.boolean().optional(),
    questionTypes: z.array(z.string()).optional(),
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
    const [showSubjectiveAnswer, setShowSubjectiveAnswer] = useState(false);
    const [recheckStates, setRecheckStates] = useState<Record<number, {loading: boolean, result: RecheckAnswerOutput | null}>>({});
    const [time, setTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { user, handleCorrectAnswer, trackStats, addWrongQuestion } = useUser();
    const { addQuestion, isSaved } = useSavedQuestions();
    const { toast } = useToast();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            chapters: '',
            numberOfQuestions: 10,
            difficulty: 'medium',
            isComprehensive: false,
            questionTypes: [],
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
    
    useEffect(() => {
        setShowSubjectiveAnswer(false);
    }, [currentQuestionIndex]);

    const handleStartTest = async (data: SetupFormValues) => {
        setIsLoading(true);
        const input: GenerateMockTestInput = {
            ...data,
            gradeLevel: parseInt(data.gradeLevel, 10),
            chapters: data.chapters.split(',').map(c => c.trim()),
            numberOfQuestions: data.isComprehensive ? 25 : data.numberOfQuestions!,
            questionTypes: data.questionTypes as QuestionTypeNCERT[] | undefined
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
        const currentQuestion = testQuestions[currentQuestionIndex];
        const isObjective = ['multiple_choice', 'true_false', 'assertion_reason'].includes(currentQuestion.type);
        
        let userAnswer: string | null = null;
        let isCorrect: boolean | null = null;
        let earnedXp = 0;

        if (isObjective) {
            userAnswer = selectedOption;
            if (userAnswer === null || userAnswer.trim() === '') {
                toast({ title: 'No Answer', description: 'Please provide an answer before proceeding.', variant: 'destructive' });
                return;
            }
            isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
            earnedXp = isCorrect ? (currentQuestion.difficulty === 'hard' ? 400 : currentQuestion.difficulty === 'medium' ? 300 : 200) : 0;
            
            if (isCorrect) {
                handleCorrectAnswer(earnedXp);
            } else {
                toast({ title: "Incorrect", description: `The correct answer was: "${currentQuestion.answer}"`, variant: "destructive" });
                addWrongQuestion({
                    questionText: currentQuestion.text,
                    userAnswer: userAnswer,
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
        } else {
            // Subjective question, user just proceeds.
            userAnswer = "[viewed]"; // A placeholder to mark as attempted
            isCorrect = null;
            earnedXp = 50; // XP for reviewing the answer
            handleCorrectAnswer(earnedXp);
        }

        const newAnswers = [...userAnswers, { question: currentQuestion, userAnswer: userAnswer, isCorrect, earnedXp }];
        setUserAnswers(newAnswers);
        setSelectedOption(null);

        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setTestState('results');
            if (timerRef.current) clearInterval(timerRef.current);
            const objectiveAnswers = newAnswers.filter(a => a.isCorrect !== null);
            const correctCount = objectiveAnswers.filter(a => a.isCorrect).length;
            const accuracy = objectiveAnswers.length > 0 ? correctCount / objectiveAnswers.length : 1;
            
            trackStats({ 
                mockTestsCompleted: 1, 
                perfectMockTests: accuracy === 1 && objectiveAnswers.length > 0 ? 1 : 0,
            });
        }
    };
    
<<<<<<< HEAD
    const handleSaveQuestions = (type: 'correct' | 'incorrect' | 'all') => {
        const questionsToSave = userAnswers
            .filter(answer => {
                if (type === 'all') return true;
                if (answer.isCorrect === null) return false; // Don't save subjective for correct/incorrect filters
                return type === 'correct' ? answer.isCorrect : !answer.isCorrect;
            })
            .map(answer => answer.question);
        
        if (questionsToSave.length === 0) {
            toast({ title: 'Nothing to Save', description: `You have no ${type} questions to save from this test.` });
            return;
        }

        const formValues = form.getValues();
        let savedCount = 0;

        questionsToSave.forEach(q => {
            const questionContext = {
                gradeLevel: formValues.gradeLevel,
                subject: formValues.subject,
                chapter: `[Test] ${formValues.chapters}`,
                questionType: q.type as AnyQuestionType,
            };

            if (!isSaved(q.text, questionContext)) {
                addQuestion({
                    text: q.text,
                    answer: q.answer,
                    options: q.options,
                    explanation: q.explanation,
                    ...questionContext
                });
                savedCount++;
            }
        });

        if (savedCount > 0) {
            toast({ title: 'Questions Saved!', description: `${savedCount} unique question(s) have been added to your saved list.` });
        } else {
            toast({ title: "Already Saved", description: "All selected questions were already in your saved list." });
=======
    const handleSaveQuestion = (questionToSave: MockTestQuestion) => {
        const context = {
            gradeLevel: form.getValues('gradeLevel'),
            subject: form.getValues('subject'),
            chapter: `[Test] ${form.getValues('chapters')}`,
            questionType: questionToSave.type as QuestionTypeNCERT,
        };

        if (!isSaved(questionToSave.text, context)) {
            addQuestion({
                text: questionToSave.text,
                answer: questionToSave.answer,
                options: questionToSave.options,
                explanation: questionToSave.explanation,
                ...context
            });
            toast({ title: "Question Saved" });
        } else {
            toast({ title: "Already Saved" });
>>>>>>> f4c241b (Change the name of the section where board questions are saved to “Board)
        }
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
                        {!isComprehensive && (<Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (<div className="space-y-1.5 flex-1"><Label>Number of Questions</Label><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>)} />)}
                    </div>
                    <div className="space-y-2">
                        <Label>Question Types (optional)</Label>
                        <p className="text-xs text-muted-foreground">Select specific types, or leave blank for a random mix.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                            {questionTypes.map((type) => (
                                <Controller
                                    key={type.value}
                                    name="questionTypes"
                                    control={form.control}
                                    render={({ field }) => {
                                        return (
                                        <div className="flex items-center space-x-2 rounded-md border p-2 bg-muted/50">
                                            <Checkbox
                                                id={type.value}
                                                checked={field.value?.includes(type.value)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), type.value])
                                                    : field.onChange(field.value?.filter((value) => value !== type.value));
                                                }}
                                            />
                                            <Label htmlFor={type.value} className="text-sm font-normal">{type.label}</Label>
                                        </div>
                                        );
                                    }}
                                />
                            ))}
                        </div>
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
        const isObjective = ['multiple_choice', 'true_false', 'assertion_reason'].includes(currentQuestion.type);
        const isSubjective = ['short_answer', 'long_answer', 'fill_in_the_blanks'].includes(currentQuestion.type);
<<<<<<< HEAD

=======
>>>>>>> f4c241b (Change the name of the section where board questions are saved to “Board)

        const renderQuestionText = () => {
            if (currentQuestion.type === 'assertion_reason' && currentQuestion.text.includes('\\n')) {
              const parts = currentQuestion.text.split('\\n');
              return <div className="space-y-1"><p>{parts[0]}</p><p>{parts[1]}</p></div>;
            }
            return <p className="font-semibold">{currentQuestion.text.replace('[BLANK]', '__________')}</p>;
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
                    {isObjective ? (
                        currentQuestion.options?.map((option, index) => (
                             <Button key={index} variant="outline" className={`w-full justify-start text-left h-auto p-3 whitespace-normal ${selectedOption === option ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => setSelectedOption(option)}>
                               <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                               {option}
                            </Button>
                        ))
                    ) : null}
                    {isSubjective && (
                        <div className="space-y-4">
                            {!showSubjectiveAnswer && (
                                <Button variant="outline" type="button" onClick={() => setShowSubjectiveAnswer(true)} className="w-full">
                                    <Eye className="mr-2 h-4 w-4" /> Show Answer
                                </Button>
                            )}
                            {showSubjectiveAnswer && (
                                <Alert>
                                    <AlertTitle>Correct Answer</AlertTitle>
                                    <AlertDescription>{currentQuestion.answer}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextQuestion} className="w-full">{currentQuestionIndex < testQuestions.length - 1 ? 'Next Question' : 'Finish Test'}</Button>
                </CardFooter>
            </Card>
        );
    };

    const ResultsView = () => {
        const objectiveAnswers = userAnswers.filter(a => a.isCorrect !== null);
        const correctAnswers = objectiveAnswers.filter(a => a.isCorrect).length;
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
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <AlertTitle className="text-xl font-bold text-primary">Score: {correctAnswers}/{objectiveAnswers.length} correct</AlertTitle>
                                <AlertDescription>You earned {totalXp.toLocaleString()} XP in {formatTime(time)}! Subjective questions are not scored.</AlertDescription>
                            </div>
                            <Trophy className="w-8 h-8 text-primary"/>
                        </div>
                    </Alert>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        <h3 className="text-xl font-semibold text-center">Review Your Answers</h3>
                        {userAnswers.map((answer, index) => {
                            const recheckState = recheckStates[index] || { loading: false, result: null };
                            const resultVariant = answer.isCorrect === true ? 'default' : answer.isCorrect === false ? 'destructive' : 'default';
                            const isQuestionSaved = isSaved(answer.question.text, {
                                gradeLevel: form.getValues('gradeLevel'),
                                subject: form.getValues('subject'),
                                chapter: `[Test] ${form.getValues('chapters')}`,
                                questionType: answer.question.type as QuestionTypeNCERT,
                            });


                            return (
                                <Card key={index} className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <p className="font-semibold">{index + 1}. {answer.question.text}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-800 dark:text-blue-300">
                                            <AlertTitle>Your Answer</AlertTitle>
                                            <AlertDescription>{answer.userAnswer}</AlertDescription>
                                        </Alert>
                                        <Alert variant={resultVariant}>
                                            <AlertTitle>Correct Answer</AlertTitle>
                                            <AlertDescription>{answer.question.answer}</AlertDescription>
                                        </Alert>
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="explanation" className="border-none">
                                                <AccordionTrigger className="text-xs p-2">View Explanation</AccordionTrigger>
                                                <AccordionContent className="p-2 pt-0">{answer.question.explanation}</AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
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
                                    </CardContent>
                                    <CardFooter className="p-2 bg-muted/50 justify-between items-center">
                                        <Button size="sm" variant="ghost" onClick={() => handleRecheckAnswer(index, answer)} disabled={recheckState.loading || !!recheckState.result}>
                                            {recheckState.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}
                                            {recheckState.loading ? 'Verifying...' : 'Recheck Answer'}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleSaveQuestion(answer.question)} disabled={isQuestionSaved}>
                                            {isQuestionSaved ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Save className="mr-2 h-4 w-4" />}
                                            {isQuestionSaved ? 'Saved' : 'Save'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
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
