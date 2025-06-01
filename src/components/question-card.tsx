
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RotateCcw, Save, CheckCircle, Loader2, Eye, EyeOff, MessageSquare, Send } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { QuestionContext, FollowUpExchange } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface QuestionCardProps {
  questionText: string;
  answerText: string;
  questionContext: QuestionContext;
  onRegenerate: (originalQuestion: string) => Promise<{ question: string; answer: string } | null>;
  onAskFollowUp: (originalQuestion: string, originalAnswer: string, userQuery: string, context: QuestionContext) => Promise<string | null>;
}

export function QuestionCard({ questionText, answerText, questionContext, onRegenerate, onAskFollowUp }: QuestionCardProps) {
  const [currentQuestionText, setCurrentQuestionText] = useState(questionText);
  const [currentAnswerText, setCurrentAnswerText] = useState(answerText);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const { addQuestion, isSaved } = useSavedQuestions();
  const { toast } = useToast();

  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpExchange[]>([]);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  const isCurrentlySaved = isSaved(currentQuestionText, questionContext);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowAnswer(false);
    setFollowUpHistory([]); // Clear follow-up history on regenerate
    setFollowUpInput('');
    const result = await onRegenerate(currentQuestionText);
    if (result && result.question && result.answer) {
      setCurrentQuestionText(result.question);
      setCurrentAnswerText(result.answer);
      toast({ title: "Question Regenerated", description: "A new version of the question and its answer has been generated." });
    } else {
      toast({ title: "Error", description: "Failed to regenerate question.", variant: "destructive" });
    }
    setIsRegenerating(false);
  };

  const handleSave = () => {
    if (!isCurrentlySaved) {
      addQuestion({
        text: currentQuestionText,
        answer: currentAnswerText,
        ...questionContext,
        followUps: followUpHistory, // Save current follow-up history
      });
      toast({ title: "Question Saved!", description: "The question and its answer, along with any follow-up discussion, have been saved." });
    }
  };

  const toggleShowAnswer = () => {
    setShowAnswer(prev => !prev);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    const userQuery = followUpInput;
    setFollowUpInput(''); // Clear input

    const aiResponse = await onAskFollowUp(currentQuestionText, currentAnswerText, userQuery, questionContext);
    if (aiResponse) {
      setFollowUpHistory(prev => [...prev, { userQuery, aiResponse }]);
    } else {
      toast({ title: "Follow-up Error", description: "Could not get an answer for the follow-up question.", variant: "destructive" });
      setFollowUpInput(userQuery); // Restore input if error
    }
    setIsAskingFollowUp(false);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardContent className="p-4 flex-grow">
        <p className="text-foreground leading-relaxed mb-3">{currentQuestionText}</p>
        {showAnswer && (
          <div className="p-3 bg-secondary/50 rounded-md border border-input">
            <p className="text-sm font-semibold text-primary mb-1">Answer:</p>
            <p className="text-foreground/90 leading-relaxed">{currentAnswerText}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-0 flex-col items-stretch">
        <div className="p-4 flex flex-wrap justify-between items-center gap-2 bg-muted/50">
          <Button
              variant="outline"
              size="sm"
              onClick={toggleShowAnswer}
              aria-label={showAnswer ? "Hide answer" : "Show answer"}
          >
              {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating || isCurrentlySaved}
              aria-label="Regenerate question"
            >
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Regenerate
            </Button>
            <Button
              variant={isCurrentlySaved ? "secondary" : "default"}
              size="sm"
              onClick={handleSave}
              disabled={isCurrentlySaved}
              aria-label={isCurrentlySaved ? "Question saved" : "Save question"}
            >
              {isCurrentlySaved ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isCurrentlySaved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full border-t">
          <AccordionItem value="follow-up" className="border-none">
            <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline bg-muted/20 hover:bg-muted/40">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                Ask a Follow-up Question {followUpHistory.length > 0 && `(${followUpHistory.length})`}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-3">
              {followUpHistory.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {followUpHistory.map((exchange, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-semibold text-primary">You:</p>
                      <p className="mb-1 pl-2 whitespace-pre-wrap">{exchange.userQuery}</p>
                      <p className="font-semibold text-accent">MGQs Bot:</p>
                      <p className="pl-2 whitespace-pre-wrap">{exchange.aiResponse}</p>
                      {index < followUpHistory.length -1 && <hr className="my-2"/>}
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleFollowUpSubmit} className="flex items-start space-x-2">
                <Textarea
                  placeholder="Type your follow-up question here..."
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  rows={2}
                  className="flex-grow text-sm"
                  disabled={isAskingFollowUp || isCurrentlySaved}
                />
                <Button type="submit" size="icon" disabled={isAskingFollowUp || !followUpInput.trim() || isCurrentlySaved} aria-label="Send follow-up">
                  {isAskingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
               {isCurrentlySaved && followUpHistory.length === 0 && (
                <p className="text-xs text-muted-foreground">Save the question first to enable follow-ups, or regenerate for a new version.</p>
              )}
              {isCurrentlySaved && (
                 <p className="text-xs text-muted-foreground">Follow-up questions cannot be added to already saved questions from here. Regenerate to start a new discussion.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
}
