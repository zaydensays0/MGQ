
'use client';

import { useState, type FormEvent, useRef } from 'react';
import { solveProblem } from '@/ai/flows/solve-problem';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Sparkles, Loader2, Terminal, HelpCircle, CheckCircle, Bot, ImageUp, X, ShieldCheck } from 'lucide-react';
import { SUBJECTS, LANGUAGES } from '@/lib/constants';
import type { SubjectOption, Language, SolveProblemInput, SolveProblemOutput, RecheckAnswerOutput } from '@/types';
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});

const ResultDisplay = ({ result, contextForRecheck }: { result: SolveProblemOutput, contextForRecheck: { question: string, subject: string, medium: Language } }) => {
  const { toast } = useToast();
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);

  const handleRecheck = async () => {
    if (!result.finalAnswer) {
      toast({ title: 'Cannot Recheck', description: 'There is no final answer to recheck.', variant: 'destructive' });
      return;
    }
    setIsRechecking(true);
    setRecheckResult(null);
    try {
        const res = await recheckAnswer({
            question: contextForRecheck.question,
            originalAnswer: result.finalAnswer,
            gradeLevel: '10', // Default grade for context
            subject: contextForRecheck.subject || 'General',
            chapter: contextForRecheck.question.substring(0, 50) + '...', // Use question as chapter context
        });
        setRecheckResult(res);
        toast({ title: 'Recheck Complete!' });
    } catch (err) {
        toast({ title: 'Recheck Failed', description: 'An error occurred while verifying the answer.', variant: 'destructive' });
    } finally {
        setIsRechecking(false);
    }
  };


  if (!result.isSolvable) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Question Unclear</AlertTitle>
        <AlertDescription>{result.clarificationNeeded}</AlertDescription>
      </Alert>
    );
  }

  if (result.hint) {
    return (
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>Here's a Hint!</AlertTitle>
        <AlertDescription>{result.hint}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
            <Bot className="mr-2 h-6 w-6 text-primary" />
            AI Solution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {result.finalAnswer && (
          <Card className="bg-green-50 dark:bg-green-900/30 border-green-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-700 dark:text-green-300 text-lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Final Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{result.finalAnswer}</p>
            </CardContent>
          </Card>
        )}

        {result.steps && result.steps.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3">
              Step-by-Step Solution
            </h3>
            <div className="space-y-4">
              {result.steps.map((step) => (
                <div key={step.stepNumber} className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step.stepNumber}
                  </div>
                  <div className="flex-grow pt-1 prose prose-sm max-w-none dark:prose-invert">
                      <DynamicReactMarkdown>{step.explanation}</DynamicReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 border-t pt-4">
          <Button onClick={handleRecheck} variant="outline" disabled={isRechecking || !!recheckResult}>
            {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {isRechecking ? 'Verifying...' : 'Recheck AI Answer'}
          </Button>
          {recheckResult && (
             <Alert variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{recheckResult.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                <AlertDescription className="space-y-1">
                    <p>{recheckResult.explanation}</p>
                    {!recheckResult.isCorrect && <p className="font-semibold mt-2">Corrected Answer: {recheckResult.correctAnswer}</p>}
                </AlertDescription>
            </Alert>
          )}
      </CardFooter>
    </Card>
  );
};

export default function ProblemSolverPage() {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState<string>('');
  const [medium, setMedium] = useState<Language>('english');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveProblemOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({ title: 'Invalid File Type', description: 'Please upload a JPG or PNG image.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageDataUri(dataUri);
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleSubmit = async (e: FormEvent, requestHint = false) => {
    e.preventDefault();
    if (!question.trim() && !imageDataUri) {
        toast({ title: 'Missing Input', description: 'Please type a question or upload an image.', variant: 'destructive' });
        return;
    }
    // If no image is uploaded, a subject is required.
    if (!imageDataUri && !subject) {
      toast({ title: 'Missing Context', description: 'Please select a subject when not uploading an image.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    const input: SolveProblemInput = {
      userQuestion: question,
      imageDataUri,
      subject: subject || undefined,
      medium,
      requestHint,
    };

    try {
      const response = await solveProblem(input);
      setResult(response);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while solving the problem.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subject);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Wand2 className="w-8 h-8 mr-3 text-primary" />
          Problem Solver
        </h1>
        <p className="text-muted-foreground mt-1">
          Get step-by-step solutions for any academic question.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enter Your Problem</CardTitle>
            <CardDescription>
              Provide the question and context, and our AI will guide you through the solution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-input">Your Question (Optional if uploading image)</Label>
                <Textarea
                  id="question-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., If a train travels at 60 km/h, how long does it take to cover 150 km?"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Image of Question</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Question preview" className="rounded-md border max-h-60 w-auto object-contain" />
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={handleClearImage} aria-label="Remove image">
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                    <>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                          <ImageUp className="mr-2 h-4 w-4" /> Upload an Image (JPG, PNG)
                        </Button>
                    </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject {imageDataUri ? '(Optional)' : ''}</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select Subject">
                        {selectedSubjectDetails?.label || "Select Subject"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medium">Language</Label>
                  <Select value={medium} onValueChange={(value) => setMedium(value as Language)} required>
                    <SelectTrigger id="medium"><SelectValue placeholder="Select Language" /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="button" onClick={(e) => handleSubmit(e, true)} className="w-full" variant="outline" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <HelpCircle className="mr-2" />}
                  Get a Hint
                </Button>
                <Button type="submit" onClick={(e) => handleSubmit(e, false)} className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                  Solve
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="lg:mt-0">
          {isLoading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          )}
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && <ResultDisplay result={result} contextForRecheck={{ question, subject, medium }} />}
        </div>
      </div>
    </div>
  );
}
