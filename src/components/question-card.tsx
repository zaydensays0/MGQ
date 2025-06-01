'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RotateCcw, Save, CheckCircle, Loader2 } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { QuestionContext } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface QuestionCardProps {
  questionText: string;
  questionContext: QuestionContext;
  onRegenerate: (originalQuestion: string) => Promise<string | null>;
}

export function QuestionCard({ questionText, questionContext, onRegenerate }: QuestionCardProps) {
  const [currentQuestionText, setCurrentQuestionText] = useState(questionText);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { addQuestion, isSaved } = useSavedQuestions();
  const { toast } = useToast();

  const isCurrentlySaved = isSaved(currentQuestionText, questionContext);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const newQuestion = await onRegenerate(currentQuestionText);
    if (newQuestion) {
      setCurrentQuestionText(newQuestion);
      toast({ title: "Question Regenerated", description: "A new version of the question has been generated." });
    } else {
      toast({ title: "Error", description: "Failed to regenerate question.", variant: "destructive" });
    }
    setIsRegenerating(false);
  };

  const handleSave = () => {
    if (!isCurrentlySaved) {
      addQuestion({
        text: currentQuestionText,
        ...questionContext,
      });
      toast({ title: "Question Saved!", description: "The question has been saved to your collection." });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <p className="text-foreground leading-relaxed">{currentQuestionText}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-end space-x-2 bg-muted/50 rounded-b-lg">
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
      </CardFooter>
    </Card>
  );
}
