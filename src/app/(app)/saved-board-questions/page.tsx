
'use client';

import dynamic from 'next/dynamic';
import { FileQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const SavedQuestionsListSkeleton = () => (
  <div className="space-y-8">
    {[1, 2].map(i => (
      <Card key={i} className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(j => (
              <div key={j} className="border-b py-2">
                <Skeleton className="h-8 w-3/4 rounded-md mb-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const DynamicSavedQuestionsList = dynamic(() => import('@/components/saved-questions-list').then(mod => mod.SavedQuestionsList), {
  loading: () => <SavedQuestionsListSkeleton />,
  ssr: false
});

export default function SavedBoardQuestionsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <FileQuestion className="w-8 h-8 mr-3 text-primary" />
          Board Saver
        </h1>
        <p className="text-muted-foreground mt-1">
          Review questions you saved from the Board Exam generator.
        </p>
      </div>
      <DynamicSavedQuestionsList filterType="board" />
    </div>
  );
}
