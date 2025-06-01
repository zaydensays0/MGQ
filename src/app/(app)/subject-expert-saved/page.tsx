
'use client';

import { useSubjectExpertSaved } from '@/contexts/subject-expert-saved-context';
import type { SavedSubjectExpertExchange, ConversationExchange } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, User, Brain, Trash2, MessageSquare, BotMessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p className="text-sm text-muted-foreground">Loading content...</p>,
  ssr: false
});

const SavedExchangeItem: React.FC<{ exchangeData: SavedSubjectExpertExchange, onRemove: (id: string) => void }> = ({ exchangeData, onRemove }) => {
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirm('Are you sure you want to delete this saved conversation?')) {
      onRemove(exchangeData.id);
      toast({
        title: "Conversation Deleted",
        description: "The saved expert conversation has been removed.",
      });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
         <CardTitle className="text-lg font-semibold flex items-center">
           <Brain className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
           Saved Conversation
         </CardTitle>
         <CardDescription className="text-xs text-muted-foreground">
          Class {exchangeData.gradeLevel} {exchangeData.subject} - Chapter: {exchangeData.chapter} <br/>
          Saved {formatDistanceToNow(new Date(exchangeData.timestamp), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {exchangeData.exchanges.map((exchange: ConversationExchange, index: number) => (
          <div key={index} className="space-y-3">
            <div>
              <p className="font-semibold mb-1 flex items-center text-primary">
                <User className="w-4 h-4 mr-2 flex-shrink-0" /> 
                {index === 0 ? "Your Initial Question:" : "Your Follow-up:"}
              </p>
              <p className="ml-6 text-foreground">{exchange.question}</p>
            </div>
            <div>
              <p className="font-semibold mb-1 flex items-center text-accent">
                <BotMessageSquare className="w-4 h-4 mr-2 flex-shrink-0" /> Expert's Answer:
              </p>
              <div className="prose prose-sm max-w-none dark:prose-invert ml-6">
                <DynamicReactMarkdown>{exchange.answer}</DynamicReactMarkdown>
              </div>
            </div>
            {index < exchangeData.exchanges.length - 1 && <hr className="my-3 border-border" />}
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="p-4 flex justify-end bg-muted/30 rounded-b-md border-t">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleRemove}
          aria-label="Delete saved conversation"
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
          Expert Conversations Archive
        </h1>
        <p className="text-muted-foreground mt-1">
          Review your saved subject-specific conversations.
        </p>
      </div>

      {sortedExchanges.length === 0 ? (
        <Alert className="max-w-xl mx-auto text-center border-dashed">
          <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
          <AlertTitle className="font-headline text-xl">No Saved Conversations Yet!</AlertTitle>
          <AlertDescription className="mt-1">
            You haven't saved any expert conversations.
            Go to the "Subject Expert" page, ask some questions, and save the threads!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sortedExchanges.map((exchangeData) => (
            <SavedExchangeItem key={exchangeData.id} exchangeData={exchangeData} onRemove={removeExchange} />
          ))}
        </div>
      )}
    </div>
  );
}
