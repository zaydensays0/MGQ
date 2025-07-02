
'use client';

import { QuestionCard } from './question-card';
import type { QuestionContext, GeneratedQuestionAnswerPair } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SaveAll } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user-context';
import { useState } from 'react';
import { LoginPromptDialog } from './login-prompt-dialog';


interface QuestionListProps {
  questions: GeneratedQuestionAnswerPair[];
  questionContext: QuestionContext;
  onRegenerateQuestion: (originalQuestion: string, originalOptions?: string[]) => Promise<GeneratedQuestionAnswerPair | null>;
}

export function QuestionList({ questions, questionContext, onRegenerateQuestion }: QuestionListProps) {
  const { addMultipleQuestions } = useSavedQuestions();
  const { toast } = useToast();
  const { isGuest } = useUser();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSaveAll = () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }
    addMultipleQuestions(questions, questionContext);
    toast({
      title: "All Questions Saved",
      description: `${questions.length} question-answer pairs from this set have been added to your collection.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Generated Questions ({questions.length})</h2>
        <div className="flex items-center gap-2">
            {questionContext.medium && <Badge variant="secondary" className="capitalize text-sm">{questionContext.medium}</Badge>}
            {questions.length > 0 && (
                <Button onClick={handleSaveAll} variant="outline">
                    <SaveAll className="mr-2 h-4 w-4" />
                    Save All Displayed
                </Button>
            )}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {questions.map((qaPair, index) => (
          <QuestionCard
            key={`${questionContext.subject}-${questionContext.chapter}-${qaPair.question}-${index}`} // Ensure key is unique
            questionText={qaPair.question}
            answerText={qaPair.answer}
            options={qaPair.options}
            explanation={qaPair.explanation}
            questionContext={questionContext}
            onRegenerateQuestion={onRegenerateQuestion}
          />
        ))}
      </div>
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <div/>
      </LoginPromptDialog>
    </div>
  );
}
