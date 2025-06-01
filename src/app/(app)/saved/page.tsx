import { SavedQuestionsList } from '@/components/saved-questions-list';
import { BookMarked } from 'lucide-react';

export default function SavedQuestionsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <BookMarked className="w-8 h-8 mr-3 text-primary" />
          Your Saved Questions
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage all the questions you've saved for offline access and revision.
        </p>
      </div>
      <SavedQuestionsList />
    </div>
  );
}
