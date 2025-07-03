
'use client';

import { useState, type FormEvent } from 'react';
import { solveProblem } from '@/ai/flows/solve-problem';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Sparkles, Loader2, Terminal, HelpCircle, CheckCircle, Bot } from 'lucide-react';
import { GRADE_LEVELS, SUBJECTS, LANGUAGES } from '@/lib/constants';
import type { GradeLevelNCERT, SubjectOption, Language, SolveProblemInput, SolveProblemOutput } from '@/types';
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});

const ResultDisplay = ({ result }: { result: SolveProblemOutput }) => {
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
    <div className="space-y-6">
      {result.finalAnswer && (
        <Card className="bg-green-50 dark:bg-green-900/30 border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
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
          <h3 className="text-xl font-semibold mb-3 flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" />
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
    </div>
  );
};

export default function ProblemSolverPage() {
  const [question, setQuestion] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
  const [subject, setSubject] = useState<string>('');
  const [medium, setMedium] = useState<Language>('english');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolveProblemOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent, requestHint = false) => {
    e.preventDefault();
    if (!question.trim() || !gradeLevel || !subject) {
      toast({ title: 'Missing Fields', description: 'Please fill out the question, grade, and subject.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    const input: SolveProblemInput = {
      userQuestion: question,
      gradeLevel,
      subject,
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
                <Label htmlFor="question-input">Your Question</Label>
                <Textarea
                  id="question-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., If a train travels at 60 km/h, how long does it take to cover 150 km?"
                  rows={6}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade-level">Grade</Label>
                  <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevelNCERT)} required>
                    <SelectTrigger id="grade-level"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                    <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
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
              </div>
               <div className="space-y-2">
                  <Label htmlFor="medium">Language</Label>
                  <Select value={medium} onValueChange={(value) => setMedium(value as Language)} required>
                    <SelectTrigger id="medium"><SelectValue placeholder="Select Language" /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="button" onClick={(e) => handleSubmit(e, true)} className="w-full" variant="outline" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <HelpCircle />}
                  Get a Hint
                </Button>
                <Button type="submit" onClick={(e) => handleSubmit(e, false)} className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
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
          {result && <ResultDisplay result={result} />}
        </div>
      </div>
    </div>
  );
}
