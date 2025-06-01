
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Sparkles, Loader2, Terminal, Save, CheckCircle } from 'lucide-react';
import { answerSubjectQuestion, type AnswerSubjectQuestionInput, type AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, SubjectOption } from '@/types';
import { useSubjectExpertSaved } from '@/contexts/subject-expert-saved-context';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading explanation...</p>,
  ssr: false
});

interface CurrentExpertExchange {
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  userQuestion: string;
  aiAnswer: string;
}

export default function SubjectExpertPage() {
  const [gradeLevelInput, setGradeLevelInput] = useState<GradeLevelNCERT | ''>('');
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [chapterInput, setChapterInput] = useState<string>('');
  const [userQuestionInput, setUserQuestionInput] = useState('');
  
  const [activeExchange, setActiveExchange] = useState<CurrentExpertExchange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addExchange, isSaved: isExchangeSaved } = useSubjectExpertSaved();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gradeLevelInput || !subjectInput.trim() || !chapterInput.trim() || !userQuestionInput.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields: grade, subject, chapter, and your question.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    // setActiveExchange(null); // Keep previous active exchange visible during loading if preferred

    const input: AnswerSubjectQuestionInput = { 
      gradeLevel: gradeLevelInput as GradeLevelNCERT, 
      subject: subjectInput, 
      chapter: chapterInput, 
      userQuestion: userQuestionInput 
    };

    try {
      const result: AnswerSubjectQuestionOutput = await answerSubjectQuestion(input);
      if (result && result.aiAnswer) {
        setActiveExchange({
            gradeLevel: gradeLevelInput as GradeLevelNCERT,
            subject: subjectInput,
            chapter: chapterInput,
            userQuestion: userQuestionInput,
            aiAnswer: result.aiAnswer
        });
        // Optionally clear input fields here if desired
        // setUserQuestionInput('');
        toast({
          title: 'Answer Received!',
          description: "Here's the expert explanation.",
        });
      } else {
        throw new Error('No answer received from AI.');
      }
    } catch (err) {
      console.error('Error getting subject answer:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Could not get an answer. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResponse = () => {
    if (activeExchange) {
      if (!isExchangeSaved(activeExchange.gradeLevel, activeExchange.subject, activeExchange.chapter, activeExchange.userQuestion, activeExchange.aiAnswer)) {
        addExchange(activeExchange);
        toast({
          title: 'Response Saved!',
          description: 'This expert explanation has been saved.',
        });
      } else {
         toast({
          title: 'Already Saved',
          description: 'This response has already been saved.',
          variant: 'default',
        });
      }
    }
  };
  
  const currentExchangeIsSaved = activeExchange ? isExchangeSaved(activeExchange.gradeLevel, activeExchange.subject, activeExchange.chapter, activeExchange.userQuestion, activeExchange.aiAnswer) : false;
  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subjectInput);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Brain className="w-8 h-8 mr-3 text-primary" />
          Subject Expert
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask specific questions about a subject, class, and chapter.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Ask the Expert</CardTitle>
          <CardDescription>
            Provide the context and your question below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select value={gradeLevelInput} onValueChange={(value) => setGradeLevelInput(value as GradeLevelNCERT)} required>
                  <SelectTrigger id="gradeLevel"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade}>Class {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subjectInput} onValueChange={setSubjectInput} required>
                  <SelectTrigger id="subject">
                     <SelectValue placeholder="Select Subject">
                        {selectedSubjectDetails && selectedSubjectDetails.icon && (
                          <selectedSubjectDetails.icon className="w-4 h-4 mr-2 inline-block" />
                        )}
                        {selectedSubjectDetails?.label || "Select Subject"}
                      </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center">
                          {s.icon && <s.icon className="w-4 h-4 mr-2" />}
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Input
                id="chapter"
                value={chapterInput}
                onChange={(e) => setChapterInput(e.target.value)}
                placeholder="e.g., The French Revolution"
                className="text-base"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userQuestion">Your Question</Label>
              <Textarea
                id="userQuestion"
                value={userQuestionInput}
                onChange={(e) => setUserQuestionInput(e.target.value)}
                placeholder="e.g., What were the main causes of the French Revolution?"
                rows={4}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Getting Answer...' : 'Ask Subject Expert'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6 w-full max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !error && !activeExchange &&(
         <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </CardContent>
        </Card>
      )}

      {activeExchange && !isLoading && (
        <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Expert's Explanation
            </CardTitle>
             <CardDescription>
                Class {activeExchange.gradeLevel} {activeExchange.subject} - Chapter: {activeExchange.chapter}
             </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="font-semibold mb-1">Your Question:</p>
             <p className="mb-3 text-muted-foreground">{activeExchange.userQuestion}</p>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <DynamicReactMarkdown>{activeExchange.aiAnswer}</DynamicReactMarkdown>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/30 rounded-b-md">
            <Button
              onClick={handleSaveResponse}
              disabled={currentExchangeIsSaved}
              variant={currentExchangeIsSaved ? "secondary" : "default"}
            >
              {currentExchangeIsSaved ? (
                <CheckCircle className="mr-2 h-5 w-5" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {currentExchangeIsSaved ? 'Saved' : 'Save Explanation'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
