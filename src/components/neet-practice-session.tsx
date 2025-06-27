
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { NeetQuestion, QuestionContext, QuestionTypeNCERT } from '@/types';
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
import { BookMarked, Check, ChevronsLeft, ChevronsRight, Eye, Lightbulb, RotateCw, Sparkles, Trophy, X, CheckCircle } from 'lucide-react';

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
    const [showExplanation, setShowExplanation] = useState(false);
    
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
        setShowExplanation(true);

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
        setShowExplanation(false);
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
                    {isAttempted && (
                        <Accordion type="single" collapsible value={showExplanation ? "item-1" : ""} onValueChange={(v) => setShowExplanation(!!v)}>
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
