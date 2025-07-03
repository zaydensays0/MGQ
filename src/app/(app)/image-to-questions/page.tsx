
'use client';

import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateQuestionsFromImage } from '@/ai/flows/generate-questions-from-image';
import { useUser } from '@/contexts/user-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import type { ImageGeneratedQuestion, QuestionTypeNCERT, RecheckAnswerOutput, SavedQuestion } from '@/types';
import { QUESTION_TYPES } from '@/lib/constants';
import { recheckAnswer } from '@/ai/flows/recheck-answer';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ImagePlus, Loader2, Sparkles, Terminal, Save, CheckCircle, ShieldCheck, Trash2, X, Badge } from 'lucide-react';

const setupSchema = z.object({
  questionTypes: z.array(z.string()).min(1, 'Please select at least one question type.'),
  numberOfQuestions: z.coerce.number().min(1).optional(),
  isComprehensive: z.boolean().optional(),
}).refine(data => data.isComprehensive || (data.numberOfQuestions && data.numberOfQuestions > 0), {
  message: 'Number of questions is required unless Comprehensive Mode is on.',
  path: ['numberOfQuestions'],
});

type SetupFormValues = z.infer<typeof setupSchema>;

const QuestionDisplayCard = ({
  question,
  index,
  onSave,
  isSaved,
}: {
  question: ImageGeneratedQuestion;
  index: number;
  onSave: (q: ImageGeneratedQuestion) => void;
  isSaved: boolean;
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isAttempted, setIsAttempted] = useState(false);
  const { handleCorrectAnswer, addWrongQuestion } = useUser();
  const { toast } = useToast();

  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);

  const checkAnswer = (answer: string) => {
    if (isAttempted) return;
    setUserAnswer(answer);
    setIsAttempted(true);

    if (answer.trim().toLowerCase() === question.answer.toLowerCase()) {
      handleCorrectAnswer(50);
      toast({ title: 'Correct!' });
    } else {
      toast({ title: 'Incorrect!', description: `The correct answer is: ${question.answer}`, variant: 'destructive' });
      addWrongQuestion({
        questionText: question.question,
        userAnswer: answer,
        correctAnswer: question.answer,
        options: question.options,
        explanation: question.explanation,
        context: {
          gradeLevel: '10', // Default context for image-based questions
          subject: 'Image Upload',
          chapter: `Material from Image`,
          questionType: question.type as QuestionTypeNCERT,
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
        gradeLevel: '10',
        subject: 'Image Upload',
        chapter: 'Material from Image',
      });
      setRecheckResult(result);
      toast({ title: 'Recheck Complete' });
    } catch (error) {
      console.error('Recheck error:', error);
      toast({ title: 'Recheck Failed', variant: 'destructive' });
    } finally {
      setIsRechecking(false);
    }
  };
  
  const getOptionStyle = (option: string) => {
    if (!isAttempted) return 'outline';
    const isCorrect = option.trim().toLowerCase() === question.answer.trim().toLowerCase();
    if (isCorrect) return 'default';
    if (userAnswer === option && !isCorrect) return 'destructive';
    return 'outline';
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg flex-1 pr-4">{question.question}</CardTitle>
            <Badge variant="secondary">{question.language}</Badge>
        </div>
        <CardDescription>Type: <span className="capitalize">{question.type.replace(/_/g, ' ')}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {(question.type === 'multiple_choice' || question.type === 'assertion_reason' || question.type === 'true_false') && question.options?.map((option, i) => (
          <Button key={i} variant={getOptionStyle(option)} className="w-full justify-start text-left h-auto p-3" onClick={() => checkAnswer(option)} disabled={isAttempted}>
            {option}
          </Button>
        ))}
        {(question.type === 'short_answer' || question.type === 'fill_in_the_blanks') && (
          <div className="flex gap-2">
            <Input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer..." disabled={isAttempted} />
            <Button onClick={() => checkAnswer(userAnswer)} disabled={isAttempted}>Submit</Button>
          </div>
        )}
      </CardContent>
      {isAttempted && (
        <CardFooter className="flex-col items-start gap-4 p-4 pt-0 border-t mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="explanation">
              <AccordionTrigger>View Explanation</AccordionTrigger>
              <AccordionContent>{question.explanation}</AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex w-full justify-between items-center">
            <Button size="sm" variant="ghost" onClick={handleRecheck} disabled={isRechecking || !!recheckResult}>
              {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Recheck AI Answer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onSave(question)} disabled={isSaved}>
              {isSaved ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
          {recheckResult && (
            <Alert className="mt-2" variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>{recheckResult.isCorrect ? 'Verification: Correct' : 'Verification: Needs Correction'}</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>{recheckResult.explanation}</p>
                {!recheckResult.isCorrect && <p><b>Corrected:</b> {recheckResult.correctAnswer}</p>}
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      )}
    </Card>
  );
};


export default function ImageToQuestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<ImageGeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageDataUris, setImageDataUris] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { addQuestion, isSaved } = useSavedQuestions();
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { questionTypes: [], isComprehensive: false, numberOfQuestions: 5 },
  });
  const { watch } = form;
  const isComprehensive = watch('isComprehensive');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileReadPromises = Array.from(files).map(file => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({ title: 'Invalid File Type', description: `Skipping ${file.name}. Please upload JPG or PNG images.`, variant: 'destructive' });
        return null;
      }
      return new Promise<{ preview: string; dataUri: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ preview: URL.createObjectURL(file), dataUri: reader.result as string });
        };
        reader.readAsDataURL(file);
      });
    }).filter(Boolean);

    Promise.all(fileReadPromises).then(results => {
        const validResults = results as { preview: string; dataUri: string }[];
        setImagePreviews(prev => [...prev, ...validResults.map(r => r.preview)]);
        setImageDataUris(prev => [...prev, ...validResults.map(r => r.dataUri)]);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageDataUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (data: SetupFormValues) => {
    if (imageDataUris.length === 0) {
      toast({ title: 'No Images', description: 'Please upload at least one image of your study material.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedQuestions([]);
    
    try {
      const result = await generateQuestionsFromImage({
        imageDataUris,
        questionTypes: data.questionTypes,
        isComprehensive: data.isComprehensive,
        numberOfQuestions: data.isComprehensive ? undefined : data.numberOfQuestions,
      });
      if (result && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        toast({ title: 'Questions Generated!', description: `Successfully created ${result.questions.length} questions.` });
      } else {
        setError('The AI could not generate questions from the provided images.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getContextForSaving = (q: ImageGeneratedQuestion) => ({
    gradeLevel: '10' as '10', // Default context
    subject: 'Image Upload',
    chapter: `Material from Image (${new Date().toLocaleDateString()})`,
    questionType: q.type as QuestionTypeNCERT,
    medium: q.language.toLowerCase() as any,
  });

  const handleSaveQuestion = (q: ImageGeneratedQuestion) => {
      const context = getContextForSaving(q);
      const questionToSave: Omit<SavedQuestion, 'id'|'timestamp'> = {
          text: q.question,
          answer: q.answer,
          options: q.options,
          explanation: q.explanation,
          ...context,
      };
      addQuestion(questionToSave);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <ImagePlus className="w-6 h-6 mr-3 text-primary" />
            Image to Questions Generator
          </CardTitle>
          <CardDescription>
            Upload images of your study material, and we'll create practice questions for you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleGenerate)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Upload Material (JPG, PNG)</Label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" multiple className="hidden" />
              <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <ImagePlus className="mr-2 h-4 w-4" /> Click to Upload Images
              </Button>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative">
                      <img src={src} alt={`upload preview ${index}`} className="rounded-md border object-cover aspect-square" />
                      <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Question Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUESTION_TYPES.map(type => (
                  <Controller key={type.value} name="questionTypes" control={form.control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                        <Checkbox checked={field.value?.includes(type.value)} onCheckedChange={checked => {
                          return checked ? field.onChange([...(field.value || []), type.value]) : field.onChange(field.value?.filter(v => v !== type.value))
                        }} /><Label className="font-normal">{type.label}</Label>
                      </div>
                    )} />
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
                <p className="text-xs text-muted-foreground">Generate all possible questions from the material.</p>
              </div>
              {!isComprehensive && (
                <Controller name="numberOfQuestions" control={form.control} render={({ field, fieldState }) => (
                  <div className="space-y-1.5 flex-1 self-center">
                    <Label>Number of Questions</Label>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
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
          <h2 className="text-2xl font-headline font-semibold mb-6">Generated Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedQuestions.map((q, i) => (
              <QuestionDisplayCard
                key={`${q.question}-${i}`}
                question={q}
                index={i}
                onSave={handleSaveQuestion}
                isSaved={isSaved(q.question, getContextForSaving(q))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
