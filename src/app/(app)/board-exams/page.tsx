
'use client';

import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateBoardQuestions } from '@/ai/flows/generate-board-questions';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { BoardId, BoardQuestion, BoardQuestionType, SavedQuestion } from '@/types';
import { BOARDS, SUBJECTS, BOARD_CLASSES, BOARD_QUESTION_TYPES } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileQuestion, Loader2, Sparkles, Terminal, Save, CheckCircle, Flame, Badge } from 'lucide-react';

const setupSchema = z.object({
    className: z.enum(BOARD_CLASSES),
    boardId: z.enum(BOARDS.map(b => b.id) as [BoardId, ...BoardId[]]),
    subject: z.string().min(1, "Please select a subject."),
    chapters: z.string().min(1, "Please enter at least one chapter or 'Full Syllabus'"),
    questionTypes: z.array(z.string()).min(1, "Please select at least one question type."),
    numberOfQuestions: z.coerce.number().min(1, "Minimum 1 question.").optional(),
    isComprehensive: z.boolean().optional(),
}).refine(data => data.isComprehensive || (data.numberOfQuestions && data.numberOfQuestions > 0), {
    message: "Number of questions is required unless Comprehensive Mode is on.",
    path: ["numberOfQuestions"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

const GeneratedQuestionCard = ({ question, context, onSave, isSaved }: { 
    question: BoardQuestion;
    context: { boardId: BoardId, className: '9' | '10', subject: string, chapter: string };
    onSave: (q: BoardQuestion) => void;
    isSaved: boolean;
}) => {
    const [showAnswer, setShowAnswer] = useState(false);
    return (
        <Card className="shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex-1">{question.question}</CardTitle>
                    <div className="flex items-center gap-2 ml-4">
                        {question.isLikelyToAppear && <Badge variant="destructive"><Flame className="w-4 h-4 mr-1"/>Likely</Badge>}
                        <Badge variant="outline">{question.marks} Marks</Badge>
                    </div>
                </div>
                <CardDescription>Type: <span className="capitalize">{question.type.replace(/_/g, ' ')}</span></CardDescription>
            </CardHeader>
            <CardContent>
                {showAnswer && (
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted p-3 rounded-md">
                        <h4 className="font-semibold">Answer:</h4>
                        <p>{question.answer}</p>
                        {question.explanation && (
                            <>
                                <h4 className="font-semibold mt-2">Explanation:</h4>
                                <p>{question.explanation}</p>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setShowAnswer(prev => !prev)}>
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSave(question)} disabled={isSaved}>
                    {isSaved ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaved ? 'Saved' : 'Save'}
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function BoardExamsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<BoardQuestion[]>([]);
    const [lastContext, setLastContext] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const { toast } = useToast();
    const { addQuestion, isSaved } = useSavedQuestions();

    const form = useForm<SetupFormValues>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            className: '10',
            chapters: '',
            questionTypes: [],
            isComprehensive: false,
            numberOfQuestions: 10,
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
                numberOfQuestions: data.isComprehensive ? 20 : data.numberOfQuestions!, // AI needs a number even for comprehensive
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
    
    const handleSaveQuestion = (q: BoardQuestion) => {
        const questionToSave: Omit<SavedQuestion, 'id' | 'timestamp'> = {
            text: q.question,
            answer: q.answer,
            options: q.options,
            explanation: q.explanation,
            questionType: q.type,
            marks: q.marks,
            board: lastContext.boardId,
            gradeLevel: lastContext.className,
            subject: lastContext.subject,
            chapter: lastContext.chapters, // Saving all chapters context
        };
        addQuestion(questionToSave);
    }
    
    const checkIsSaved = (q: BoardQuestion) => {
        return isSaved(q.question, {
             board: lastContext.boardId,
             gradeLevel: lastContext.className,
             subject: lastContext.subject,
             chapter: lastContext.chapters,
             questionType: q.type,
        });
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Controller name="className" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Class</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{BOARD_CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                             <Controller name="boardId" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Board</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Board"/></SelectTrigger><SelectContent>{BOARDS.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
                            )} />
                            <Controller name="subject" control={form.control} render={({ field, fieldState }) => (
                                <div className="space-y-1.5"><Label>Subject</Label><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger><SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>{fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}</div>
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
                                                const num = parseInt(e.target.value, 10);
                                                field.onChange(isNaN(num) ? '' : num);
                                            }}
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

            {generatedQuestions.length > 0 && !isLoading && (
                <div className="mt-8">
                    <h2 className="text-2xl font-headline font-semibold text-center mb-6">Generated Board Questions</h2>
                    <div className="space-y-4">
                        {generatedQuestions.map((q, i) => (
                           <GeneratedQuestionCard 
                             key={i} 
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
