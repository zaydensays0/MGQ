
'use client';

import React from 'react';
import { useSharedPosts } from '@/contexts/shared-posts-context';
import type { SharedPost, SavedQuestion } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, HelpCircle, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QuestionItem: React.FC<{ question: SavedQuestion }> = ({ question }) => {
    return (
        <div className="p-3 bg-background/50 rounded-md border">
            <p className="text-sm font-semibold mb-1 flex items-center"><HelpCircle className="w-4 h-4 mr-2 text-primary flex-shrink-0" /> {question.text}</p>
            <p className="text-sm text-muted-foreground pl-6"><span className="font-semibold text-primary">Answer:</span> {question.answer}</p>
        </div>
    )
};

const SharedPostCard: React.FC<{ post: SharedPost }> = ({ post }) => {
    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-11 w-11">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
                    <AvatarFallback>{post.author.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{post.author.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</p>
                </div>
            </CardHeader>
            <CardContent>
                {post.message && <p className="text-foreground/90 mb-4 italic border-l-4 pl-3">"{post.message}"</p>}
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-base">
                            View {post.questions.length} Shared Question(s)
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-3">
                            {post.questions.map(q => <QuestionItem key={q.id} question={q} />)}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </CardContent>
        </Card>
    );
};


export default function CommunityPage() {
    const { posts } = useSharedPosts();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Users className="w-8 h-8 mr-3 text-primary" />
                    Community Hub
                </h1>
            </div>

            {posts.length > 0 ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                    {posts.map(post => <SharedPostCard key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg max-w-2xl mx-auto">
                    <Users className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">The Community Hub is Quiet...</h3>
                    <p>No questions have been shared yet. Be the first to post from your "Saved Questions"!</p>
                </div>
            )}
        </div>
    );
}
