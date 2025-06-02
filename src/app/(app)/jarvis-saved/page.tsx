
'use client';

import { useJarvisSaved } from '@/contexts/jarvis-saved-context';
import type { SavedJarvisExchange, ConversationExchange } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Bot, User, Trash2, MessageSquare, FolderArchive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p className="text-sm text-muted-foreground">Loading content...</p>,
  ssr: false
});


const SavedConversationItem: React.FC<{ conversation: SavedJarvisExchange, onRemove: (id: string) => void }> = ({ conversation, onRemove }) => {
  const { toast } = useToast();

  const handleRemove = () => {
    if (confirm('Are you sure you want to delete this saved conversation?')) {
      onRemove(conversation.id);
      toast({
        title: "Conversation Deleted",
        description: "The saved conversation with Jarvis has been removed.",
      });
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          {conversation.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Saved {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })} | {conversation.exchanges.length} exchange(s)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {conversation.exchanges.map((exchange: ConversationExchange, index: number) => (
          <div key={index} className="space-y-3">
            <div>
              <p className="font-semibold mb-1 flex items-center text-primary">
                <User className="w-4 h-4 mr-1.5 flex-shrink-0" /> You:
              </p>
              <p className="pl-5 text-foreground leading-relaxed">{exchange.question}</p>
            </div>
            <div>
              <p className="font-semibold mb-1 flex items-center text-accent">
                <Bot className="w-4 h-4 mr-1.5 flex-shrink-0" /> Jarvis:
              </p>
              <div className="pl-5 prose prose-sm max-w-none dark:prose-invert">
                <DynamicReactMarkdown>{exchange.answer}</DynamicReactMarkdown>
              </div>
            </div>
            {index < conversation.exchanges.length - 1 && <hr className="border-border/50 my-3" />}
          </div>
        ))}
      </CardContent>
      <CardFooter className="p-4 flex justify-end bg-muted/30 rounded-b-md">
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


export default function JarvisSavedPage() {
  const { savedExchanges, removeExchange } = useJarvisSaved();

  const sortedConversations = [...savedExchanges].sort((a, b) => b.timestamp - a.timestamp);

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

      {sortedConversations.length === 0 ? (
        <Alert className="max-w-xl mx-auto text-center border-dashed">
          <FolderArchive className="h-6 w-6 mx-auto mb-2 text-primary" />
          <AlertTitle className="font-headline text-xl">No Saved Chats Yet!</AlertTitle>
          <AlertDescription className="mt-1">
            You haven't saved any conversations with Jarvis.
            Go to the "Ask Jarvis" page, have a chat, and save your favorite threads!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sortedConversations.map((conversation) => (
            <SavedConversationItem key={conversation.id} conversation={conversation} onRemove={removeExchange} />
          ))}
        </div>
      )}
    </div>
  );
}
