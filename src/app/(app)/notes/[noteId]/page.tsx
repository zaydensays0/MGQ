
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useNotes } from '@/contexts/notes-context';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { Note, SavedQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, AlertTriangle, FileText, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
// import ReactMarkdown from 'react-markdown'; // Removed direct import
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <p>Loading content...</p>,
  ssr: false
});

const LinkedQuestionItem: React.FC<{ question: SavedQuestion }> = ({ question }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card className="bg-background/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <HelpCircle className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
          Question
        </CardTitle>
        <CardDescription className="text-xs">
          {question.subject} - Class {question.gradeLevel} - Chapter: {question.chapter} - Type: {question.questionType.replace(/_/g, ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        <p className="text-foreground leading-relaxed">{question.text}</p>
        {showAnswer && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-md border border-input">
            <p className="text-sm font-semibold text-primary mb-1">Answer:</p>
            <p className="text-foreground/90 leading-relaxed">{question.answer}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 flex justify-end bg-muted/30 rounded-b-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function ViewNotePage() {
  const params = useParams();
  const noteId = params.noteId as string;
  const router = useRouter();

  const { getNoteById } = useNotes();
  const { savedQuestions } = useSavedQuestions();

  const [note, setNote] = useState<Note | undefined>(undefined);
  const [linkedQuestions, setLinkedQuestions] = useState<SavedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (noteId) {
      const foundNote = getNoteById(noteId);
      setNote(foundNote);
      if (foundNote) {
        const questions = savedQuestions.filter(q => foundNote.linkedQuestionIds.includes(q.id));
        setLinkedQuestions(questions);
      }
      setIsLoading(false);
    }
  }, [noteId, getNoteById, savedQuestions]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-1/4 mt-4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Note Not Found</AlertTitle>
          <AlertDescription>
            The note you are looking for could not be found. It might have been deleted.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/notes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Notes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/notes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Notes
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center mb-1">
                <FileText className="w-7 h-7 mr-3 text-primary flex-shrink-0" />
                {note.title}
              </CardTitle>
              <CardDescription className="text-sm">
                Created: {format(new Date(note.createdAt), 'PPpp')} | Last Updated: {format(new Date(note.updatedAt), 'PPpp')}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/notes/${note.id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit Note
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
            <DynamicReactMarkdown>{note.content}</DynamicReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {linkedQuestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-headline font-semibold mb-4">Linked Questions ({linkedQuestions.length})</h2>
          <Accordion type="multiple" className="w-full space-y-4">
            {linkedQuestions.map((q) => (
               <AccordionItem value={q.id} key={q.id} className="border-none">
                 <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:hidden">
                    {/* This trigger is mainly for structure, content is in LinkedQuestionItem */}
                 </AccordionTrigger>
                 <AccordionContent className="p-0 border-none">
                    <LinkedQuestionItem question={q} />
                 </AccordionContent>
               </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
       {note.linkedQuestionIds.length > 0 && linkedQuestions.length === 0 && !isLoading && (
         <Alert className="mt-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Linked Questions Not Found</AlertTitle>
            <AlertDescription>
              Some linked questions could not be found. They might have been deleted from your saved questions.
            </AlertDescription>
          </Alert>
       )}
    </div>
  );
}
