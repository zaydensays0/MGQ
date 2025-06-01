
'use client';

import { useJarvisSaved } from '@/contexts/jarvis-saved-context';
import type { SavedJarvisExchange } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Bot, User, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p className="text-sm text-muted-foreground">Loading content...</p>,
  ssr: false
});


const SavedExchangeItem: React.FC<{ exchange: SavedJarvisExchange, onRemove: (id: string) => void }> = ({ exchange, onRemove }) => {
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirm('Are you sure you want to delete this saved exchange?')) {
      onRemove(exchange.id);
      toast({
        title: "Exchange Deleted",
        description: "The saved conversation with Jarvis has been removed.",
      });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <User className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          Your Question
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Asked {formatDistanceToNow(new Date(exchange.timestamp), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-foreground leading-relaxed">{exchange.userQuestion}</p>
      </CardContent>
      <hr className="mx-6 border-border" />
      <CardHeader className="pt-4 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Bot className="w-5 h-5 mr-2 text-accent flex-shrink-0" />
          Jarvis's Answer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <DynamicReactMarkdown>{exchange.jarvisAnswer}</DynamicReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-end bg-muted/30 rounded-b-md">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleRemove}
          aria-label="Delete saved exchange"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function JarvisSavedPage() {
  const { savedExchanges, removeExchange } = useJarvisSaved();

  const sortedExchanges = [...savedExchanges].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <Archive className="w-8 h-8 mr-3 text-primary" />
          Jarvis Archive
        </h1>
        <p className="text-muted-foreground mt-1">
          Review your saved conversations with Jarvis.
        </p>
      </div>

      {sortedExchanges.length === 0 ? (
        <Alert className="max-w-xl mx-auto text-center border-dashed">
          <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
          <AlertTitle className="font-headline text-xl">No Saved Chats Yet!</AlertTitle>
          <AlertDescription className="mt-1">
            You haven't saved any conversations with Jarvis.
            Go to the "Ask Jarvis" page, have a chat, and save your favorite responses!
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
