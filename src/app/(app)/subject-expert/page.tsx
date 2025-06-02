
'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Sparkles, Loader2, Terminal, User, Bot, Send, Save, CheckCircle } from 'lucide-react';
import { answerSubjectQuestion, type AnswerSubjectQuestionInput, type AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';
import { useToast } from '@/hooks/use-toast';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, ConversationTurn, ConversationExchange, SubjectOption } from '@/types';
import { useSubjectExpertSaved } from '@/contexts/subject-expert-saved-context';
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading response...</p>,
  ssr: false
});

interface CurrentContext {
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
}

export default function SubjectExpertPage() {
  const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  
  const [activeConversation, setActiveConversation] = useState<ConversationExchange[]>([]);
  const [currentContext, setCurrentContext] = useState<CurrentContext | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addExchange, isSaved: isConversationSaved } = useSubjectExpertSaved();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subject);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  useEffect(() => {
    if (currentContext) {
      // If context is active and user changes grade/subject/chapter selections from the dropdowns/input
      if (gradeLevel && // Ensure gradeLevel is not empty string from initial state
          (currentContext.gradeLevel !== gradeLevel ||
           currentContext.subject !== subject ||
           currentContext.chapter !== chapter)) {
        setCurrentContext(null); // Force re-setting context
        setActiveConversation([]);
        setCurrentQuestion('');
        setError(null); // Clear previous errors
        toast({ 
            title: "Context Changed", 
            description: "Selections updated. Click 'Start Chat' to begin with the new context.", 
            variant: "default"
        });
      }
    }
  }, [gradeLevel, subject, chapter, currentContext, toast]);


  const startNewConversation = () => {
    if (!gradeLevel || !subject.trim() || !chapter.trim()) {
      toast({ title: 'Missing Context', description: 'Please select grade, subject, and enter chapter.', variant: 'destructive' });
      return false;
    }
    // gradeLevel here is GradeLevelNCERT because the check above ensures it's not ''
    setCurrentContext({ gradeLevel, subject, chapter });
    setActiveConversation([]);
    setCurrentQuestion('');
    setError(null);
    toast({title: "Context Set", description: `Ready to chat about Class ${gradeLevel} ${subject} - Ch: ${chapter}. Ask your first question!`})
    return true;
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!currentQuestion.trim()) {
      toast({ title: 'Empty Question', description: 'Please enter your question.', variant: 'destructive' });
      return;
    }

    if (!currentContext) {
      toast({ title: 'Error', description: 'Chat context not set. Please set grade, subject, and chapter, then click "Start Chat".', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const conversationHistoryForAI: ConversationTurn[] = activeConversation.flatMap(exchange => [
      { speaker: 'user' as 'user', text: exchange.question },
      { speaker: 'ai' as 'ai', text: exchange.answer }
    ]);

    const input: AnswerSubjectQuestionInput = {
      gradeLevel: currentContext.gradeLevel,
      subject: currentContext.subject,
      chapter: currentContext.chapter,
      userQuestion: currentQuestion,
      conversationHistory: conversationHistoryForAI,
    };

    try {
      const result: AnswerSubjectQuestionOutput = await answerSubjectQuestion(input);
      if (result && result.aiAnswer) {
        setActiveConversation(prev => [...prev, { question: currentQuestion, answer: result.aiAnswer }]);
        setCurrentQuestion(''); 
      } else {
        throw new Error('No answer received from AI expert.');
      }
    } catch (err) {
      console.error('Error getting subject answer:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({ title: 'Error', description: `Could not get an answer. ${errorMessage}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveConversation = () => {
    if (currentContext && activeConversation.length > 0) {
      if (!isConversationSaved(currentContext.gradeLevel, currentContext.subject, currentContext.chapter, activeConversation)) {
        addExchange({ ...currentContext, exchanges: activeConversation });
        toast({ title: 'Conversation Saved!', description: 'This discussion has been saved to your archive.' });
      } else {
        toast({ title: 'Already Saved', description: 'This exact conversation is already in your archive.', variant: 'default' });
      }
    }
  };

  const currentExchangeIsActuallySaved = currentContext ? isConversationSaved(currentContext.gradeLevel, currentContext.subject, currentContext.chapter, activeConversation) : false;

  const canStartChat = gradeLevel && subject.trim() && chapter.trim();

  const placeholderText = currentContext && activeConversation.length === 0
    ? `Ask your first question about ${currentContext.chapter}...`
    : "Ask a follow-up question or start a new one...";

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)]"> {/* Adjust height based on header */}
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Brain className="w-8 h-8 mr-3 text-primary" />
          Subject Expert
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask questions about a specific grade, subject, and chapter. Get contextual help from our AI expert.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="gradeLevel-se">Grade Level</Label>
          <Select 
            value={gradeLevel} 
            onValueChange={(value) => setGradeLevel(value as GradeLevelNCERT | '')} 
            required
          >
            <SelectTrigger id="gradeLevel-se"><SelectValue placeholder="Select Grade" /></SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(gl => <SelectItem key={gl} value={gl}>Class {gl}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject-se">Subject</Label>
          <Select value={subject} onValueChange={setSubject} required>
            <SelectTrigger id="subject-se">
              <SelectValue placeholder="Select Subject">
                {selectedSubjectDetails && selectedSubjectDetails.icon && (
                    <selectedSubjectDetails.icon className="w-4 h-4 mr-2 inline-block" />
                )}
                {selectedSubjectDetails?.label || "Select Subject"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(s => (
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
        <div className="space-y-2">
          <Label htmlFor="chapter-se">Chapter</Label>
          <Input id="chapter-se" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g., The French Revolution" required />
        </div>
      </div>
      
      {!currentContext && (
        <div className="flex-grow flex flex-col items-center justify-center">
            <Card className="w-full max-w-md text-center p-6 shadow-lg">
                <CardHeader>
                    <CardTitle>Set Learning Context</CardTitle>
                    <CardDescription>Please select a grade, subject, and chapter above to begin your session with the Subject Expert.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={startNewConversation} disabled={!canStartChat || isLoading} className="w-full">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start Chat
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      {currentContext && (
        <>
          <Card className="flex-grow flex flex-col shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/50 border-b p-4">
              <CardTitle className="text-lg">
                Chat: Class {currentContext.gradeLevel} {currentContext.subject} - Ch: {currentContext.chapter}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
              {activeConversation.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="w-12 h-12 mx-auto mb-2 text-primary/50" />
                  {placeholderText}
                </div>
              )}
              {activeConversation.map((exchange, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-xl shadow">
                      <p className="font-semibold text-sm mb-0.5 flex items-center"><User className="w-4 h-4 mr-1.5 flex-shrink-0" /> You</p>
                      <p className="text-sm leading-relaxed">{exchange.question}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                     <div className="bg-card border p-3 rounded-lg rounded-bl-none max-w-xl shadow">
                       <p className="font-semibold text-sm mb-0.5 flex items-center text-accent"><Bot className="w-4 h-4 mr-1.5 flex-shrink-0" /> Expert</p>
                       <div className="prose prose-sm max-w-none dark:prose-invert">
                         <DynamicReactMarkdown>{exchange.answer}</DynamicReactMarkdown>
                       </div>
                     </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-3">
                    <div className="bg-card border p-3 rounded-lg rounded-bl-none max-w-xl shadow animate-pulse">
                       <p className="font-semibold text-sm mb-0.5 flex items-center text-accent"><Bot className="w-4 h-4 mr-1.5 flex-shrink-0" /> Expert</p>
                       <div className="space-y-2 mt-1">
                           <div className="h-3 bg-muted rounded w-3/4"></div>
                           <div className="h-3 bg-muted rounded w-full"></div>
                           <div className="h-3 bg-muted rounded w-5/6"></div>
                       </div>
                    </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </CardContent>
            <CardFooter className="p-4 border-t bg-muted/30">
              <form onSubmit={handleSubmit} className="flex w-full items-start space-x-2">
                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder={placeholderText}
                  rows={2}
                  className="flex-grow text-sm resize-none"
                  disabled={isLoading || !currentContext}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <Button type="submit" size="icon" disabled={isLoading || !currentQuestion.trim() || !currentContext}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="sr-only">Send</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSaveConversation}
                  disabled={isLoading || activeConversation.length === 0 || currentExchangeIsActuallySaved}
                  aria-label={currentExchangeIsActuallySaved ? "Conversation Saved" : "Save Conversation"}
                >
                  {currentExchangeIsActuallySaved ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Save className="h-5 w-5" />}
                   <span className="sr-only">{currentExchangeIsActuallySaved ? "Conversation Saved" : "Save Conversation"}</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
    
    