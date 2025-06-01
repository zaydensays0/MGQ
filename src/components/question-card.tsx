
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RotateCcw, Save, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { QuestionContext } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface QuestionCardProps {
  questionText: string;
  answerText: string;
  options?: string[]; // Added for MCQs
  questionContext: QuestionContext;
  onRegenerate: (originalQuestion: string, originalOptions?: string[]) => Promise<{ question: string; answer: string; options?: string[] } | null>;
}

export function QuestionCard({ questionText, answerText, options, questionContext, onRegenerate }: QuestionCardProps) {
  const [currentQuestionText, setCurrentQuestionText] = useState(questionText);
  const [currentAnswerText, setCurrentAnswerText] = useState(answerText);
  const [currentOptions, setCurrentOptions] = useState(options);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const { addQuestion, isSaved } = useSavedQuestions();
  const { toast } = useToast();

  const isCurrentlySaved = isSaved(currentQuestionText, questionContext);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowAnswer(false); // Hide answer during regeneration
    const result = await onRegenerate(currentQuestionText, currentOptions);
    if (result && result.question && result.answer) {
      setCurrentQuestionText(result.question);
      setCurrentAnswerText(result.answer);
      setCurrentOptions(result.options);
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
        options: currentOptions,
        ...questionContext,
      });
      toast({ title: "Question Saved!", description: "The question and its answer have been saved." });
    }
  };

  const toggleShowAnswer = () => {
    setShowAnswer(prev => !prev);
  };

  const isMCQ = questionContext.questionType === 'multiple_choice' && currentOptions && currentOptions.length > 0;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardContent className="p-4 flex-grow">
        <p className="text-foreground leading-relaxed mb-3">{currentQuestionText}</p>
        
        {isMCQ && (
          <div className="space-y-2 mb-3">
            {currentOptions?.map((option, index) => (
              <div
                key={index}
                className={`p-2 border rounded-md text-sm transition-colors
                  ${showAnswer && option === currentAnswerText ? 'bg-green-100 dark:bg-green-700/30 border-green-400 dark:border-green-600 font-medium' : 'bg-muted/30 hover:bg-muted/50'}`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </div>
            ))}
          </div>
        )}

        {showAnswer && !isMCQ && ( // Show answer for non-MCQs when toggled
          <div className="p-3 bg-secondary/50 rounded-md border border-input">
            <p className="text-sm font-semibold text-primary mb-1">Answer:</p>
            <p className="text-foreground/90 leading-relaxed">{currentAnswerText}</p>
          </div>
        )}
         {showAnswer && isMCQ && ( // For MCQs, the correct option is highlighted above. This can be a small confirmation.
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-800/20 border border-green-200 dark:border-green-700 rounded-md text-sm">
            <span className="font-semibold text-green-700 dark:text-green-400">Correct Answer:</span> {currentAnswerText}
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
      </CardFooter>
    </Card>
  );
}
