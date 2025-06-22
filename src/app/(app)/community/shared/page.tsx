
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { SharedQuestion, QuestionContext, GradeLevelNCERT } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, GraduationCap, BookOpen, ThumbsUp, Save, CheckCircle, Copy, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SUBJECTS } from '@/lib/constants';

// Mock data for the community questions page prototype - same as the other page
const MOCK_SHARED_QUESTIONS: SharedQuestion[] = [
    { id: 'sq1', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'science', chapter: 'Laws of Motion', text: "What is Newton's Third Law?", answer: "For every action, there is an equal and opposite reaction.", timestamp: Date.now() - 100000 },
    { id: 'sq2', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'science', chapter: 'Atoms and Molecules', text: "Define osmosis with an example.", answer: "Osmosis is the spontaneous net movement of solvent molecules through a selectively permeable membrane into a region of higher solute concentration.", timestamp: Date.now() - 200000 },
    { id: 'sq3', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'english', chapter: 'Poetry Devices', text: "What is a simile?", answer: "A simile is a figure of speech involving the comparison of one thing with another thing of a different kind, used to make a description more emphatic or vivid (e.g., as brave as a lion).", timestamp: Date.now() - 300000 },
    { id: 'sq4', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'social_science', chapter: 'Globalisation', text: "What is globalization?", answer: "Globalization is the process of interaction and integration among people, companies, and governments worldwide.", timestamp: Date.now() - 400000 },
    { id: 'sq5', username: 'study_with_anu', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'science', chapter: 'Electricity', text: "What is Ohm’s Law?", answer: "Ohm's law states that the current through a conductor between two points is directly proportional to the voltage across the two points.", timestamp: Date.now() - 500000 },
    { id: 'sq6', username: 'study_with_anu', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'science', chapter: 'Periodic Classification', text: "Explain the periodic table layout.", answer: "The periodic table arranges elements by increasing atomic number into rows (periods) and columns (groups) based on shared chemical properties.", timestamp: Date.now() - 600000 },
    { id: 'sq7', username: 'smart_gk_123', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'maths', chapter: 'Number Systems', text: "Is zero a rational number?", answer: "Yes, zero is a rational number because it can be expressed as a fraction, for example, 0/1.", timestamp: Date.now() - 700000 },
    { id: 'sq8', username: 'smart_gk_123', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '12', subject: 'english', chapter: 'The Last Lesson', text: "Who is the author of 'The Last Lesson'?", answer: "Alphonse Daudet is the author of 'The Last Lesson'.", timestamp: Date.now() - 800000 },
];

const SharedQuestionCard: React.FC<{ question: SharedQuestion }> = ({ question }) => {
    const { addQuestion, isSaved } = useSavedQuestions();
    const { toast } = useToast();
    const [showAnswer, setShowAnswer] = useState(false);

    const questionContext: QuestionContext = {
        gradeLevel: question.gradeLevel,
        subject: question.subject,
        chapter: question.chapter,
        questionType: 'short_answer', // Default type for community questions
    };

    const saved = isSaved(question.text, questionContext);

    const handleSave = () => {
        if (!saved) {
            addQuestion({
                text: question.text,
                answer: question.answer,
                options: question.options,
                ...questionContext,
            });
            toast({ title: "Question Saved!", description: "This question is now in your collection." });
        }
    };
    
    const handleLike = () => {
        toast({ title: "Liked!", description: "Thanks for your feedback! (Like functionality is a demo)" });
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(`${question.text}\n\nAnswer: ${question.answer}`)
            .then(() => toast({ title: "Copied!", description: "Question and answer copied to clipboard." }))
            .catch(() => toast({ title: "Error", description: "Could not copy content.", variant: "destructive" }));
    };
    
    // Mock likes count
    const mockLikes = React.useMemo(() => Math.floor(Math.random() * 50) + 1, [question.id]);

    return (
        <Card className="shadow-md">
            <CardContent className="p-4">
                <p className="text-foreground leading-relaxed">{question.text}</p>
                {showAnswer && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="font-semibold text-primary mb-2">Answer:</h4>
                        <p className="text-foreground/90 leading-relaxed">{question.answer}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-3 bg-muted/50 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">{mockLikes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAnswer(!showAnswer)}>
                        {showAnswer ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                        {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </Button>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={handleSave} disabled={saved} aria-label={saved ? "Question saved" : "Save question"}>
                        {saved ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy question and answer">
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

function SharedQuestionsView() {
    const searchParams = useSearchParams();
    const username = searchParams.get('user');
    const grade = searchParams.get('grade') as GradeLevelNCERT | null;
    const subject = searchParams.get('subject');

    const subjectLabel = SUBJECTS.find(s => s.value === subject)?.label || 'Unknown Subject';
    const userAvatarUrl = MOCK_SHARED_QUESTIONS.find(q => q.username === username)?.userAvatarUrl;

    if (!username || !grade || !subject) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Invalid Parameters</h3>
                <p>Could not load questions. Please go back and try again.</p>
            </div>
        );
    }
    
    const questions = MOCK_SHARED_QUESTIONS.filter(q => 
        q.username === username && 
        q.gradeLevel === grade && 
        q.subject === subject
    );

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Button asChild variant="outline" size="sm" className="mb-6">
                <Link href="/community">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Community
                </Link>
            </Button>
            
            <Card className="mb-8 shadow-lg">
                <CardHeader>
                    <CardDescription className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2" />
                        Shared by
                    </CardDescription>
                    <CardTitle className="flex items-center space-x-3">
                        <Avatar>
                            <AvatarImage src={userAvatarUrl} alt={username} />
                            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-headline text-2xl">{username}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <p className="text-sm text-muted-foreground flex items-center"><GraduationCap className="h-4 w-4 mr-2" /> Class</p>
                        <p className="font-semibold text-lg">{grade}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground flex items-center"><BookOpen className="h-4 w-4 mr-2" /> Subject</p>
                        <p className="font-semibold text-lg">{subjectLabel}</p>
                    </div>
                </CardContent>
            </Card>

            {questions.length > 0 ? (
                <div className="space-y-4">
                    {questions.map((q, index) => (
                        <div key={q.id}>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Q{index + 1}:</p>
                            <SharedQuestionCard question={q} />
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Questions Found</h3>
                    <p>This user hasn't shared any questions for this class and subject yet.</p>
                </div>
            )}
            
            <p className="text-center text-sm text-muted-foreground mt-8">
                Don't see what you need? Try another subject or go back to the shared users list.
            </p>
        </div>
    );
}

// Suspense boundary for client components that use searchParams
export default function SharedQuestionsPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <SharedQuestionsView />
        </Suspense>
    );
}

const PageSkeleton = () => (
     <div className="container mx-auto p-4 md:p-8">
        <Skeleton className="h-9 w-40 mb-6" />
        <Card className="mb-8">
            <CardHeader><Skeleton className="h-10 w-1/2" /></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-4 border-t">
                 <Skeleton className="h-8 w-1/4" />
                 <Skeleton className="h-8 w-1/4" />
            </CardContent>
        </Card>
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    </div>
);
