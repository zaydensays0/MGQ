
'use client';

import { useState, type FormEvent, useEffect } from 'react';
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
import { Brain, Sparkles, Loader2, Terminal, Save, CheckCircle, User, BotMessageSquare } from 'lucide-react';
import { answerSubjectQuestion, type AnswerSubjectQuestionInput, type AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, SubjectOption, ConversationTurn } from '@/types';
import { useSubjectExpertSaved } from '@/contexts/subject-expert-saved-context';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading explanation...</p>,
  ssr: false
});

interface ConversationExchange {
  question: string;
  answer: string;
}

interface CurrentConversation {
  context: {
    gradeLevel: GradeLevelNCERT;
    subject: string;
    chapter: string;
  };
  exchanges: ConversationExchange[];
}

export default function SubjectExpertPage() {
  const [gradeLevelInput, setGradeLevelInput] = useState<GradeLevelNCERT | ''>('');
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [chapterInput, setChapterInput] = useState<string>('');
  const [userQuestionInput, setUserQuestionInput] = useState('');
  
  const [currentConversation, setCurrentConversation] = useState<CurrentConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addExchange, isSaved: isExchangeSaved } = useSubjectExpertSaved();

  // Reset conversation if context changes
  useEffect(() => {
    setCurrentConversation(null);
    setUserQuestionInput(''); // Also clear question input
  }, [gradeLevelInput, subjectInput, chapterInput]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gradeLevelInput || !subjectInput.trim() || !chapterInput.trim()) {
      toast({
        title: 'Missing Context',
        description: 'Please fill in grade, subject, and chapter.',
        variant: 'destructive',
      });
      return;
    }
    if (!userQuestionInput.trim()) {
      toast({
        title: 'Empty Question',
        description: 'Please enter your question.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const currentContext = currentConversation?.context || {
      gradeLevel: gradeLevelInput as GradeLevelNCERT,
      subject: subjectInput,
      chapter: chapterInput,
    };

    const conversationHistory: ConversationTurn[] = currentConversation?.exchanges.flatMap(ex => [
      { speaker: 'user', text: ex.question },
      { speaker: 'ai', text: ex.answer },
    ]) || [];

    const input: AnswerSubjectQuestionInput = { 
      gradeLevel: currentContext.gradeLevel, 
      subject: currentContext.subject, 
      chapter: currentContext.chapter, 
      userQuestion: userQuestionInput,
      conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined,
    };

    try {
      const result: AnswerSubjectQuestionOutput = await answerSubjectQuestion(input);
      if (result && result.aiAnswer) {
        const newExchange: ConversationExchange = {
          question: userQuestionInput,
          answer: result.aiAnswer,
        };
        setCurrentConversation(prev => ({
          context: currentContext,
          exchanges: [...(prev?.exchanges || []), newExchange],
        }));
        setUserQuestionInput(''); // Clear input for next question
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
    if (currentConversation && currentConversation.exchanges.length > 0) {
      const initialQuestion = currentConversation.exchanges[0].question;
      const latestAnswer = currentConversation.exchanges[currentConversation.exchanges.length - 1].answer;
      
      if (!isExchangeSaved(currentConversation.context.gradeLevel, currentConversation.context.subject, currentConversation.context.chapter, initialQuestion, latestAnswer)) {
        addExchange({
          gradeLevel: currentConversation.context.gradeLevel,
          subject: currentConversation.context.subject,
          chapter: currentConversation.context.chapter,
          userQuestion: initialQuestion, // Save initial question
          aiAnswer: latestAnswer,      // Save latest answer
        });
        toast({
          title: 'Conversation Saved!',
          description: 'This expert explanation thread (initial question, latest answer) has been saved.',
        });
      } else {
         toast({
          title: 'Already Saved',
          description: 'This conversation (based on initial Q and latest A) has already been saved.',
          variant: 'default',
        });
      }
    }
  };
  
  const currentExchangeIsSaved = currentConversation && currentConversation.exchanges.length > 0
    ? isExchangeSaved(
        currentConversation.context.gradeLevel, 
        currentConversation.context.subject, 
        currentConversation.context.chapter, 
        currentConversation.exchanges[0].question, // Check against initial question
        currentConversation.exchanges[currentConversation.exchanges.length - 1].answer // Check against latest answer
      )
    : false;

  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subjectInput);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Brain className="w-8 h-8 mr-3 text-primary" />
          Subject Expert
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask specific questions about a subject, class, and chapter. Engage in a conversation for deeper understanding.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Set a Context</CardTitle>
          <CardDescription>
            Select grade, subject, and chapter to start. Changing context will start a new conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                disabled={isLoading && !!currentConversation} // Disable if loading a follow-up
              />
            </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6 w-full max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentConversation && currentConversation.exchanges.length > 0 && (
        <Card className="mt-6 w-full max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              Expert Conversation
            </CardTitle>
             <CardDescription>
                Class {currentConversation.context.gradeLevel} {currentConversation.context.subject} - Chapter: {currentConversation.context.chapter}
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentConversation.exchanges.map((exchange, index) => (
              <div key={index} className="space-y-3">
                <div>
                  <p className="font-semibold mb-1 flex items-center text-primary">
                    <User className="w-4 h-4 mr-2 flex-shrink-0" /> Your Question:
                  </p>
                  <p className="ml-6 text-foreground">{exchange.question}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1 flex items-center text-accent">
                    <BotMessageSquare className="w-4 h-4 mr-2 flex-shrink-0" /> Expert's Answer:
                  </p>
                  <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert ml-6">
                    <DynamicReactMarkdown>{exchange.answer}</DynamicReactMarkdown>
                  </div>
                </div>
                {index < currentConversation.exchanges.length -1 && <hr/>}
              </div>
            ))}
          </CardContent>
           {currentConversation.exchanges.length > 0 && (
            <CardFooter className="p-4 border-t bg-muted/30 rounded-b-md">
              <Button
                onClick={handleSaveResponse}
                disabled={currentExchangeIsSaved || isLoading}
                variant={currentExchangeIsSaved ? "secondary" : "default"}
              >
                {currentExchangeIsSaved ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {currentExchangeIsSaved ? 'Saved' : 'Save Conversation'}
              </Button>
            </CardFooter>
           )}
        </Card>
      )}
      
      {isLoading && !error && (
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

      {/* Always show question input form if context is set */}
      {gradeLevelInput && subjectInput && chapterInput && (
        <Card className="mt-6 w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>
              {currentConversation && currentConversation.exchanges.length > 0 ? 'Ask a Follow-up Question' : 'Ask Your First Question'}
            </CardTitle>
            {currentConversation && currentConversation.exchanges.length > 0 && (
              <CardDescription>You can ask questions about the expert's previous answers. The conversation history will be considered.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userQuestion">Your Question</Label>
                <Textarea
                  id="userQuestion"
                  value={userQuestionInput}
                  onChange={(e) => setUserQuestionInput(e.target.value)}
                  placeholder={currentConversation && currentConversation.exchanges.length > 0 ? "e.g., Can you elaborate on the second point?" : "e.g., What were the main causes of ...?"}
                  rows={4}
                  className="text-base"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !gradeLevelInput || !subjectInput || !chapterInput}>
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
      )}
    </div>
  );
}
