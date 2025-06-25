
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RotateCcw, Save, CheckCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { QuestionContext, RecheckAnswerOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user-context';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


interface QuestionCardProps {
  questionText: string;
  answerText: string;
  options?: string[];
  questionContext: QuestionContext;
  onRegenerate: (originalQuestion: string, originalOptions?: string[]) => Promise<{ question: string; answer: string; options?: string[] } | null>;
}

export function QuestionCard({ questionText, answerText, options, questionContext, onRegenerate }: QuestionCardProps) {
  const [currentQuestionText, setCurrentQuestionText] = useState(questionText);
  const [currentAnswerText, setCurrentAnswerText] = useState(answerText);
  const [currentOptions, setCurrentOptions] = useState(options);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);

  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);

  const { addQuestion, isSaved } = useSavedQuestions();
  const { handleCorrectAnswer } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentQuestionText(questionText);
    setCurrentAnswerText(answerText);
    setCurrentOptions(options);
    setUserSelection(null);
    setIsAttempted(false);
    setShowAnswer(false);
    setIsRechecking(false);
    setRecheckResult(null);
  }, [questionText, answerText, options]);

  const isCurrentlySaved = isSaved(currentQuestionText, questionContext);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowAnswer(false);
    setUserSelection(null);
    setIsAttempted(false);
    const result = await onRegenerate(currentQuestionText, currentOptions);
    if (result && result.question && result.answer) {
      toast({ title: "Question Regenerated", description: "A new version of the question and its answer has been generated." });
    } else {
      toast({ title: "Error", description: "Failed to regenerate question.", variant: "destructive" });
    }
    setIsRegenerating(false);
  };
  
  const handleRecheck = async () => {
    setIsRechecking(true);
    setRecheckResult(null);
    try {
      const result = await recheckAnswer({
        question: currentQuestionText,
        originalAnswer: currentAnswerText,
        ...questionContext,
      });
      setRecheckResult(result);
      toast({
        title: "Recheck Complete",
        description: result.isCorrect ? "The original answer was confirmed to be correct." : "A correction has been provided.",
      });
    } catch (error) {
      console.error("Recheck error:", error);
      toast({
        title: "Recheck Failed",
        description: "Could not verify the answer at this time.",
        variant: "destructive"
      });
    } finally {
      setIsRechecking(false);
    }
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

  const handleSelectOption = (selected: string) => {
    if (isAttempted && questionContext.questionType !== 'short_answer' && questionContext.questionType !== 'long_answer' && questionContext.questionType !== 'fill_in_the_blanks') return; 
    
    setUserSelection(selected);
    setIsAttempted(true);
    setShowAnswer(true);

    if (selected.trim().toLowerCase() === currentAnswerText.trim().toLowerCase()) {
      handleCorrectAnswer(100);
      new Audio('/sounds/correct.mp3').play();
    } else {
      toast({ title: "Incorrect", description: `The correct answer is: ${currentAnswerText}`, variant: "destructive" });
      new Audio('/sounds/incorrect.mp3').play();
    }
  };
  
  const isMCQ = questionContext.questionType === 'multiple_choice';
  const isAssertionReason = questionContext.questionType === 'assertion_reason';
  const isTrueFalse = questionContext.questionType === 'true_false';

  const renderQuestionText = () => {
    if (isAssertionReason && currentQuestionText.includes('\\n')) {
      const parts = currentQuestionText.split('\\n');
      return (
        <div className="mb-3 space-y-1">
          <p className="text-foreground leading-relaxed">{parts[0]}</p>
          <p className="text-foreground leading-relaxed">{parts[1]}</p>
        </div>
      );
    }
    return <p className="text-foreground leading-relaxed mb-3">{currentQuestionText}</p>;
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardContent className="p-4 flex-grow">
        {renderQuestionText()}
        
        {(isMCQ || isAssertionReason) && currentOptions && currentOptions.length > 0 && (
          <div className="space-y-2 mb-3">
            {currentOptions?.map((option, index) => {
              const isSelectedOption = userSelection === option;
              const isCorrectOption = currentAnswerText === option;
              let optionStyle = "bg-muted/30 hover:bg-muted/60 dark:bg-muted/10 dark:hover:bg-muted/20";

              if (isAttempted) {
                if (isSelectedOption) {
                  optionStyle = isCorrectOption ? "bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300 font-semibold" : "bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 font-semibold";
                } else if (isCorrectOption) {
                  optionStyle = showAnswer ? "bg-green-50 dark:bg-green-800/30 border-green-400" : optionStyle;
                }
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`w-full justify-start text-left p-2 h-auto whitespace-normal text-sm ${optionStyle}`}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAttempted}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                </Button>
              );
            })}
          </div>
        )}

        {isTrueFalse && (
          <div className="flex space-x-2 mb-3">
            {['True', 'False'].map((tfOption) => {
              const isSelectedOption = userSelection === tfOption;
              const isCorrectOption = currentAnswerText.toLowerCase() === tfOption.toLowerCase();
              let optionStyle = "bg-muted/30 hover:bg-muted/60 dark:bg-muted/10 dark:hover:bg-muted/20";

              if (isAttempted) {
                if (isSelectedOption) {
                  optionStyle = isCorrectOption ? "bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300 font-semibold" : "bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 font-semibold";
                } else if (isCorrectOption && showAnswer) {
                   optionStyle = "bg-green-50 dark:bg-green-800/30 border-green-400";
                }
              }
              return (
                <Button
                  key={tfOption}
                  variant="outline"
                  className={`flex-1 p-2 text-sm ${optionStyle}`}
                  onClick={() => handleSelectOption(tfOption)}
                  disabled={isAttempted}
                >
                  {tfOption}
                </Button>
              );
            })}
          </div>
        )}

        {showAnswer && (
          <div className={`mt-3 p-3 rounded-md border 
            ${isMCQ || isTrueFalse || isAssertionReason ? 
              (userSelection === null || userSelection.toLowerCase() === currentAnswerText.toLowerCase() ? 'bg-green-50 dark:bg-green-800/30 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-800/30 border-red-300 dark:border-red-700') 
              : 'bg-secondary/50 dark:bg-muted/20 border-input'}`}>
            <div className="flex justify-between items-center mb-1">
              <p className={`text-sm font-semibold 
                ${isMCQ || isTrueFalse || isAssertionReason ? 
                  (userSelection === null || userSelection.toLowerCase() === currentAnswerText.toLowerCase() ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')
                  : 'text-primary'}`}>
                Answer:
              </p>
              <Button variant="ghost" size="sm" onClick={handleRecheck} disabled={isRechecking || !!recheckResult}>
                  {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {isRechecking ? 'Verifying...' : "Recheck Answer"}
              </Button>
            </div>
            <p className="text-foreground/90 dark:text-foreground/80 leading-relaxed">{currentAnswerText}</p>
          </div>
        )}

        {recheckResult && (
            <Alert className="mt-3" variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{recheckResult.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                <AlertDescription className="space-y-2">
                    <p>{recheckResult.explanation}</p>
                    {!recheckResult.isCorrect && (
                    <div className="p-2 border-t mt-2">
                        <p className="font-semibold">Corrected Answer:</p>
                        <p>{recheckResult.correctAnswer}</p>
                    </div>
                    )}
                </AlertDescription>
            </Alert>
        )}

      </CardContent>
      <CardFooter className="p-0 flex-col items-stretch">
        <div className="p-3 flex flex-wrap justify-between items-center gap-2 bg-muted/50 dark:bg-muted/10 border-t">
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
