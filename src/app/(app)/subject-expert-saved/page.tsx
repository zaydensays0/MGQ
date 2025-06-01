
'use client';

import { useSubjectExpertSaved } from '@/contexts/subject-expert-saved-context';
import type { SavedSubjectExpertExchange } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, User, Brain, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p className="text-sm text-muted-foreground">Loading content...</p>,
  ssr: false
});

const SavedExchangeItem: React.FC<{ exchange: SavedSubjectExpertExchange, onRemove: (id: string) => void }> = ({ exchange, onRemove }) => {
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirm('Are you sure you want to delete this saved explanation?')) {
      onRemove(exchange.id);
      toast({
        title: "Explanation Deleted",
        description: "The saved expert explanation has been removed.",
      });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
         <CardDescription className="text-xs text-muted-foreground">
          Class {exchange.gradeLevel} {exchange.subject} - Chapter: {exchange.chapter} <br/>
          Saved {formatDistanceToNow(new Date(exchange.timestamp), { addSuffix: true })}
        </CardDescription>
      </CardHeader>

      <CardHeader className="pt-0 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <User className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          Your Question
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="text-foreground leading-relaxed">{exchange.userQuestion}</p>
      </CardContent>
      
      <hr className="mx-6 border-border" />
      
      <CardHeader className="pt-4 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Brain className="w-5 h-5 mr-2 text-accent flex-shrink-0" />
          Expert's Answer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <DynamicReactMarkdown>{exchange.aiAnswer}</DynamicReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-end bg-muted/30 rounded-b-md">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleRemove}
          aria-label="Delete saved explanation"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function SubjectExpertSavedPage() {
  const { savedExchanges, removeExchange } = useSubjectExpertSaved();

  const sortedExchanges = [...savedExchanges].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <BookMarked className="w-8 h-8 mr-3 text-primary" />
          Expert Explanations Archive
        </h1>
        <p className="text-muted-foreground mt-1">
          Review your saved subject-specific explanations.
        </p>
      </div>

      {sortedExchanges.length === 0 ? (
        <Alert className="max-w-xl mx-auto text-center border-dashed">
          <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
          <AlertTitle className="font-headline text-xl">No Saved Explanations Yet!</AlertTitle>
          <AlertDescription className="mt-1">
            You haven't saved any expert explanations.
            Go to the "Subject Expert" page, ask a question, and save the responses!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sortedExchanges.map((exchange) => (
            <SavedExchangeItem key={exchange.id} exchange={exchange} onRemove={removeExchange} />
          ))}
        </div>
      )}
    </div>
  );
}
