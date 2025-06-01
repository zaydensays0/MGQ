
'use client';

import { QuestionCard } from './question-card';
import type { QuestionContext, GeneratedQuestionAnswerPair } from '@/types';
import { Button } from '@/components/ui/button';
import { SaveAll } from 'lucide-react';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { useToast } from '@/hooks/use-toast';

interface QuestionListProps {
  questions: GeneratedQuestionAnswerPair[];
  questionContext: QuestionContext;
  onRegenerateQuestion: (originalQuestion: string, context: QuestionContext) => Promise<{ question: string; answer: string } | null>;
}

export function QuestionList({ questions, questionContext, onRegenerateQuestion }: QuestionListProps) {
  const { addMultipleQuestions } = useSavedQuestions();
  const { toast } = useToast();

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSaveAll = () => {
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
        {questions.length > 0 && (
          <Button onClick={handleSaveAll} variant="outline">
            <SaveAll className="mr-2 h-4 w-4" />
            Save All Displayed
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {questions.map((qaPair, index) => (
          <QuestionCard
            key={`${questionContext.subject}-${questionContext.chapter}-${qaPair.question}-${index}`} // Ensure key is unique
            questionText={qaPair.question}
            answerText={qaPair.answer}
            questionContext={questionContext}
            onRegenerate={(originalQuestion) => onRegenerateQuestion(originalQuestion, questionContext)}
          />
        ))}
      </div>
    </div>
  );
}
