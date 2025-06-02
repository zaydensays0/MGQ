
'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, Sparkles, Loader2, Terminal, User, Send, Save, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { askJarvis, type AskJarvisInput, type AskJarvisOutput } from '@/ai/flows/ask-jarvis';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useJarvisSaved } from '@/contexts/jarvis-saved-context';
import type { ConversationExchange, ConversationTurn } from '@/types';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading answer...</p>,
  ssr: false
});

export default function JarvisPage() {
  const [userQuestionInput, setUserQuestionInput] = useState('');
  const [chatLog, setChatLog] = useState<ConversationExchange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { addExchange, isSaved: isConversationSaved } = useJarvisSaved();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!userQuestionInput.trim()) {
      toast({
        title: 'Empty Question',
        description: 'Please enter your question for Jarvis.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const questionToSubmit = userQuestionInput;

    const conversationHistoryForAI: ConversationTurn[] = chatLog.flatMap(exchange => [
      { speaker: 'user' as 'user', text: exchange.question },
      { speaker: 'ai' as 'ai', text: exchange.answer }
    ]);

    const input: AskJarvisInput = { 
      userQuestion: questionToSubmit,
      conversationHistory: conversationHistoryForAI,
    };

    try {
      const result: AskJarvisOutput = await askJarvis(input);
      if (result && result.jarvisAnswer) {
        setChatLog(prev => [...prev, { question: questionToSubmit, answer: result.jarvisAnswer }]);
        setUserQuestionInput(''); 
      } else {
        throw new Error('No answer received from Jarvis.');
      }
    } catch (err) {
      console.error('Error getting answer from Jarvis:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get an answer. ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Could not get an answer from Jarvis. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = () => {
    if (chatLog.length > 0) {
      const conversationTitle = chatLog[0].question; // Use the first question as title
      if (!isConversationSaved(conversationTitle, chatLog)) {
        addExchange({ title: conversationTitle, exchanges: chatLog });
        toast({
          title: 'Conversation Saved!',
          description: 'This chat with Jarvis has been saved.',
        });
      } else {
        toast({
          title: 'Already Saved',
          description: 'This conversation has already been saved.',
          variant: 'default',
        });
      }
    }
  };
  
  const currentConversationIsSaved = chatLog.length > 0 ? isConversationSaved(chatLog[0].question, chatLog) : false;

  const handleNewConversation = () => {
    setUserQuestionInput('');
    setChatLog([]);
    setError(null);
    toast({
      title: "New Conversation Started",
      description: "Ask Jarvis anything!",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="container mx-auto p-4 md:p-8 flex flex-col flex-grow min-h-0">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Bot className="w-8 h-8 mr-3 text-primary" />
            <div>
              <h1 className="text-3xl font-headline font-bold">Ask Jarvis</h1>
              <p className="text-muted-foreground mt-1">
                Jarvis is here to help. Ask any question, study-related or otherwise!
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleNewConversation}>
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            New Chat
          </Button>
        </div>

        <Card className="flex-grow flex flex-col shadow-lg overflow-hidden min-h-0">
          <CardHeader className="bg-muted/50 border-b p-4">
            <CardTitle className="text-lg">Jarvis Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
            {chatLog.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-2 text-primary/50" />
                What's on your mind? Ask Jarvis...
              </div>
            )}
            {chatLog.map((exchange, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-xl shadow">
                    <p className="font-semibold text-sm mb-0.5 flex items-center"><User className="w-4 h-4 mr-1.5 flex-shrink-0" /> You</p>
                    <p className="text-sm leading-relaxed">{exchange.question}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                    <div className="bg-card border p-3 rounded-lg rounded-bl-none max-w-xl shadow">
                      <p className="font-semibold text-sm mb-0.5 flex items-center text-accent"><Bot className="w-4 h-4 mr-1.5 flex-shrink-0" /> Jarvis</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <DynamicReactMarkdown>{exchange.answer}</DynamicReactMarkdown>
                      </div>
                    </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                  <div className="bg-card border p-3 rounded-lg rounded-bl-none max-w-xl shadow animate-pulse">
                      <p className="font-semibold text-sm mb-0.5 flex items-center text-accent"><Bot className="w-4 h-4 mr-1.5 flex-shrink-0" /> Jarvis</p>
                      <div className="space-y-2 mt-1">
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-full"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                  </div>
              </div>
            )}
            <div ref={conversationEndRef} />
          </CardContent>
          <CardFooter className="p-4 border-t bg-muted/30">
            <form onSubmit={handleSubmit} className="flex w-full items-start space-x-2">
              <Textarea
                value={userQuestionInput}
                onChange={(e) => setUserQuestionInput(e.target.value)}
                placeholder="Type your question for Jarvis..."
                rows={2}
                className="flex-grow text-sm resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={isLoading || !userQuestionInput.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSaveConversation}
                disabled={isLoading || chatLog.length === 0 || currentConversationIsSaved}
                aria-label={currentConversationIsSaved ? "Conversation Saved" : "Save Conversation"}
              >
                {currentConversationIsSaved ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Save className="h-5 w-5" />}
                  <span className="sr-only">{currentConversationIsSaved ? "Conversation Saved" : "Save Conversation"}</span>
              </Button>
            </form>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
