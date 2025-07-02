
'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateBoardQuestions } from '@/ai/flows/generate-board-questions';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { BoardId, BoardQuestion, BoardQuestionType, SavedQuestion, QuestionContext, RecheckAnswerOutput, Language } from '@/types';
import { BOARDS, SUBJECTS, BOARD_CLASSES, BOARD_QUESTION_TYPES, LANGUAGES } from '@/lib/constants';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileQuestion, Loader2, Sparkles, Terminal, Save, CheckCircle, Flame, Badge, ShieldCheck, Eye, EyeOff, SaveAll } from 'lucide-react';

const setupSchema = z.object({
    className: z.enum(BOARD_CLASSES),
    boardId: z.enum(BOARDS.map(b => b.id) as [BoardId, ...BoardId[]]),
    subject: z.string().min(1, "Please select a subject."),
    chapters: z.string().min(1, "Please enter at least one chapter or 'Full Syllabus'"),
    questionTypes: z.array(z.string()).min(1, "Please select at least one question type."),
    numberOfQuestions: z.coerce.number().min(1, "Minimum 1 question.").optional(),
    isComprehensive: z.boolean().optional(),
    medium: z.enum(['english', 'assamese', 'hindi']).optional(),
}).refine(data => data.isComprehensive || (data.numberOfQuestions && data.numberOfQuestions > 0), {
    message: "Number of questions is required unless Comprehensive Mode is on.",
    path: ["numberOfQuestions"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

const GeneratedQuestionCard = ({
  question,
  context,
  onSave,
  isSaved,
}: {
  question: BoardQuestion;
  context: SetupFormValues;
  onSave: (q: BoardQuestion) => void;
  isSaved: boolean;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);

  const { addWrongQuestion, handleCorrectAnswer } = useUser();
  const { toast } = useToast();

  const isMCQ = question.type === 'mcq' || question.type === 'assertion_reason';

  const handleSelectOption = (option: string) => {
    if (isAttempted) return;
    setIsAttempted(true);
    setSelectedOption(option);
    setShowAnswer(true);

    const isCorrect = option.trim().toLowerCase() === question.answer.trim().toLowerCase();
    if (isCorrect) {
      toast({ title: 'Correct!', description: '+200 XP' });
      handleCorrectAnswer(200);
    } else {
      toast({ title: 'Incorrect', description: `The correct answer was: ${question.answer}`, variant: 'destructive' });
      addWrongQuestion({
        questionText: question.question,
        userAnswer: option,
        correctAnswer: question.answer,
        options: question.options,
        explanation: question.explanation,
        marks: question.marks,
        context: {
          gradeLevel: context.className,
          subject: context.subject,
          chapter: context.chapters,
          questionType: question.type,
          board: context.boardId,
          medium: context.medium,
        },
      });
    }
  };
  
  const handleRecheck = async () => {
    setIsRechecking(true);
    setRecheckResult(null);
    try {
        const result = await recheckAnswer({
            question: question.question,
            originalAnswer: question.answer,
            options: question.options,
            gradeLevel: context.className,
            subject: context.subject,
            chapter: context.chapters,
        });
        setRecheckResult(result);
        toast({ title: "Recheck Complete" });
    } catch (error) {
        toast({ title: "Recheck Failed", variant: "destructive" });
    } finally {
        setIsRechecking(false);
    }
  };

  const renderQuestionText = () => {
    if (question.type === 'assertion_reason' && question.question.includes('\\n')) {
      const parts = question.question.split('\\n');
      return <div className="space-y-1"><p>{parts[0]}</p><p>{parts[1]}</p></div>;
    }
    return <p>{question.question}</p>;
  };
  
  const getOptionStyle = (option: string) => {
      if (!isAttempted) return 'outline';
      const isCorrect = option.trim().toLowerCase() === question.answer.trim().toLowerCase();
      if (isCorrect) return 'default';
      if (selectedOption === option && !isCorrect) return 'destructive';
      return 'outline';
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex-1 pr-4">{renderQuestionText()}</CardTitle>
          <div className="flex items-center gap-2 ml-4">
            {question.isLikelyToAppear && (
              <Badge variant="destructive"><Flame className="w-4 h-4 mr-1" />Likely</Badge>
            )}
            <Badge variant="outline">{question.marks} Marks</Badge>
          </div>
        </div>
        <CardDescription>Type: <span className="capitalize">{question.type.replace(/_/g, ' ')}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isMCQ && question.options && (
            question.options.map((option, index) => (
                <Button key={index} variant={getOptionStyle(option)} className="w-full justify-start text-left h-auto p-3" onClick={() => handleSelectOption(option)} disabled={isAttempted}>
                    {option}
                </Button>
            ))
        )}
        {showAnswer && !isMCQ && (
          <div className="prose prose-sm dark:prose-invert max-w-none bg-muted p-3 rounded-md">
            <h4 className="font-semibold">Answer:</h4>
            <p>{question.answer}</p>
          </div>
        )}
        {showAnswer && question.explanation && (
          <Accordion type="single" collapsible>
              <AccordionItem value="explanation">
                  <AccordionTrigger>View Explanation</AccordionTrigger>
                  <AccordionContent>{question.explanation}</AccordionContent>
              </AccordionItem>
          </Accordion>
        )}
        {recheckResult && (
            <Alert className="mt-2" variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{recheckResult.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                <AlertDescription className="space-y-1">
                    <p>{recheckResult.explanation}</p>
                    {!recheckResult.isCorrect && <p><b>Corrected:</b> {recheckResult.correctAnswer}</p>}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
            {!isMCQ && (
                <Button variant="outline" size="sm" onClick={() => setShowAnswer(prev => !prev)}>
                    {showAnswer ? <EyeOff /> : <Eye />} {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
            )}
             <Button variant="outline" size="sm" onClick={handleRecheck} disabled={isRechecking || !!recheckResult}>
                {isRechecking ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Recheck
            </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSave(question)} disabled={isSaved}>
          {isSaved ? <CheckCircle className="text-green-500" /> : <Save />} {isSaved ? 'Saved' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function BoardExamsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<BoardQuestion[]>([]);
    const [lastContext, setLastContext] = useState<SetupFormValues | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { toast } = useToast();
    const { addQuestion, addMultipleQuestions, isSaved } = useSavedQuestions();
    const { addWrongQuestion } = useUser();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            className: '10',
            chapters: '',
            questionTypes: [],
            isComprehensive: false,
            numberOfQuestions: 10,
            medium: 'english',
        },
    });
    
    const { isComprehensive } = form.watch();

    const handleGenerate = async (data: SetupFormValues) => {
        setIsLoading(true);
        setError(null);
        setGeneratedQuestions([]);
        setLastContext(data);

        try {
            const boardName = BOARDS.find(b => b.id === data.boardId)?.name || data.boardId;
            const result = await generateBoardQuestions({
                ...data,
                boardName,
                chapters: data.chapters.split(',').map(c => c.trim()),
                questionTypes: data.questionTypes as BoardQuestionType[],
                numberOfQuestions: data.isComprehensive ? 20 : data.numberOfQuestions!, // AI needs a number
                medium: data.medium,
            });
            if (result && result.questions.length > 0) {
                setGeneratedQuestions(result.questions);
                toast({ title: 'Questions Generated!', description: `Successfully created ${result.questions.length} questions.`});
            } else {
                setError('The AI could not generate questions for the given criteria.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getQuestionContext = (q: BoardQuestion): QuestionContext => ({
        gradeLevel: lastContext!.className,
        subject: lastContext!.subject,
        chapter: lastContext!.chapters,
        questionType: q.type,
        board: lastContext!.boardId,
        medium: lastContext!.medium,
    });

    const handleSaveQuestion = (q: BoardQuestion) => {
        const questionToSave: Omit<SavedQuestion, 'id' | 'timestamp'> = {
            text: q.question,
            answer: q.answer,
            options: q.options,
            explanation: q.explanation,
            questionType: q.type,
            marks: q.marks,
            ...getQuestionContext(q)
        };
        addQuestion(questionToSave);
    }
    
    const handleSaveAll = () => {
        if (!lastContext) return;
        const questionsToSave = generatedQuestions.map(q => ({
            text: q.question,
            answer: q.answer,
            options: q.options,
            explanation: q.explanation,
            marks: q.marks,
            type: q.type,
        }));
        addMultipleQuestions(questionsToSave, getQuestionContext(generatedQuestions[0]));
    }
    
    const checkIsSaved = (q: BoardQuestion) => {
        return isSaved(q.question, getQuestionContext(q));
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="w-full max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        <FileQuestion className="w-6 h-6 mr-3 text-primary" />
                        Board Exam Question Generator
                    </CardTitle>
                    <CardDescription>
                        Generate exam-style questions for Class 9 and 10 based on specific Indian educational boards.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(handleGenerate)}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Controller name="className" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Class</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{BOARD_CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                             <Controller name="boardId" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Board</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Board"/></SelectTrigger><SelectContent>{BOARDS.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                            <Controller name="subject" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Subject</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger><SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                            <Controller name="medium" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Medium</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Medium" /></SelectTrigger><SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                        </div>
                        <Controller name="chapters" control={form.control} render={({ field, fieldState }) => (
                            <div className="space-y-1.5"><Label>Chapter(s)</Label><Input placeholder="e.g., Light - Reflection and Refraction, or Full Syllabus" {...field} />{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                        )} />

                        <div className="space-y-2">
                            <Label>Question Types</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {BOARD_QUESTION_TYPES.map(type => (
                                    <Controller
                                        key={type.value}
                                        name="questionTypes"
                                        control={form.control}
                                        render={({ field }) => (
                                            <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                                                <Checkbox
                                                    checked={field.value?.includes(type.value)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), type.value])
                                                            : field.onChange(field.value?.filter(v => v !== type.value))
                                                    }}
                                                /><Label className="font-normal">{type.label}</Label>
                                            </div>
                                        )}
                                    />
                                ))}
                            </div>
                            {form.formState.errors.questionTypes && <p className="text-sm text-destructive">{form.formState.errors.questionTypes.message}</p>}
                        </div>

                         <div className="flex flex-col sm:flex-row gap-4">
                            <div className="space-y-2 rounded-md border p-4 flex-1">
                                <div className="flex items-center space-x-2">
                                    <Controller name="isComprehensive" control={form.control} render={({ field }) => (<Switch id="comprehensive-mode" checked={field.value} onCheckedChange={field.onChange} />)} />
                                    <Label htmlFor="comprehensive-mode" className="text-base">Comprehensive Mode</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Generate all high-probability questions for the topic.</p>
                            </div>
                            {!isComprehensive && (
                                <Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (
                                    <div className="space-y-1.5 flex-1">
                                        <Label>Number of Questions</Label>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => {
                                                const val = e.target.value;
                                                field.onChange(val === '' ? '' : parseInt(val, 10));
                                            }}
                                            value={field.value ?? ''}
                                        />
                                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                                    </div>
                                )} />
                            )}
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Questions</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {error && (
                <Alert variant="destructive" className="mt-6 w-full max-w-4xl mx-auto"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            )}

            {generatedQuestions.length > 0 && !isLoading && lastContext && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-headline font-semibold">Generated Board Questions</h2>
                        <Button onClick={handleSaveAll} variant="outline"><SaveAll className="mr-2 h-4 w-4" /> Save All</Button>
                    </div>
                    <div className="space-y-4">
                        {generatedQuestions.map((q, i) => (
                           <GeneratedQuestionCard 
                             key={`${q.question}-${i}`} 
                             question={q} 
                             context={lastContext}
                             onSave={handleSaveQuestion}
                             isSaved={checkIsSaved(q)}
                           />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
