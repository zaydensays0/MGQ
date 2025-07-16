
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, Mic, Play, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { voiceChat } from '@/ai/flows/voice-chat';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  speaker: 'user' | 'ai';
  text: string;
  audioDataUri?: string;
}

// SpeechRecognition setup
let recognition: SpeechRecognition | null = null;
if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
}

export default function VoiceChatPage() {
    const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const handleMicClick = useCallback(() => {
        if (!recognition) {
            toast({
                title: 'Browser Not Supported',
                description: 'Your browser does not support the Web Speech API.',
                variant: 'destructive',
            });
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
            return;
        }

        setIsListening(true);
        recognition.start();

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                setChatLog(prev => [...prev, { speaker: 'user', text: transcript }]);
                await processUserMessage(transcript);
            }
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            toast({
                title: 'Voice Recognition Error',
                description: `Error: ${event.error}. Please try again.`,
                variant: 'destructive',
            });
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
    }, [isListening, toast]);

    const processUserMessage = async (text: string) => {
        setIsLoading(true);
        try {
            const result = await voiceChat(text);
            if (result && result.textResponse && result.audioResponse) {
                const newAiMessage: ChatMessage = {
                    speaker: 'ai',
                    text: result.textResponse,
                    audioDataUri: result.audioResponse,
                };
                setChatLog(prev => [...prev, newAiMessage]);

                // Auto-play the audio response
                const audio = new Audio(result.audioResponse);
                audio.play();
            } else {
                throw new Error("AI did not return a valid response.");
            }
        } catch (error: any) {
            toast({
                title: 'AI Error',
                description: error.message || 'Could not get a response from the AI.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const replayAudio = (audioDataUri?: string) => {
        if (audioDataUri) {
            const audio = new Audio(audioDataUri);
            audio.play();
        }
    };
    
    if (!isClient) {
        return (
            <div className="container mx-auto p-4 md:p-8 flex flex-col items-center h-[calc(100vh-8rem)]">
                <Skeleton className="h-10 w-64 mb-4" />
                <Skeleton className="h-full w-full max-w-2xl" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-8rem)]">
            <h1 className="text-3xl font-headline font-bold flex items-center mb-4">
                <Mic className="w-8 h-8 mr-3 text-primary" />
                Voice Assistant
            </h1>
            <Card className="flex-grow flex flex-col shadow-lg overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle>Conversation</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {chatLog.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Bot className="w-16 h-16 mb-4" />
                            <p>Tap the microphone to start talking.</p>
                        </div>
                    )}
                    {chatLog.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.speaker === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.speaker === 'ai' && <Bot className="w-6 h-6 text-primary flex-shrink-0 mt-1" />}
                            <div className={cn(
                                "max-w-md p-3 rounded-lg shadow",
                                msg.speaker === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'
                            )}>
                                <p className="leading-relaxed">{msg.text}</p>
                                {msg.speaker === 'ai' && msg.audioDataUri && (
                                    <Button variant="ghost" size="sm" onClick={() => replayAudio(msg.audioDataUri)} className="mt-2 -ml-2 h-auto p-1 text-xs">
                                        <Play className="w-3 h-3 mr-1" /> Replay
                                    </Button>
                                )}
                            </div>
                            {msg.speaker === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <Bot className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                            <div className="max-w-md p-3 rounded-lg shadow bg-card border">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </CardContent>
            </Card>
            <div className="flex justify-center p-4 mt-4">
                <Button
                    size="icon"
                    className={cn(
                        "w-20 h-20 rounded-full shadow-lg transition-all duration-300",
                        isListening ? 'bg-destructive animate-pulse' : 'bg-primary'
                    )}
                    onClick={handleMicClick}
                    disabled={!recognition || isLoading}
                >
                    <Mic className="w-10 h-10" />
                </Button>
            </div>
        </div>
    );
}
