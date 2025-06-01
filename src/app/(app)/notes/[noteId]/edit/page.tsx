
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
// import { NoteForm } from '@/components/note-form'; // Removed direct import
import { useNotes } from '@/contexts/notes-context';
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@/types';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';


const NoteFormSkeleton = () => (
  <Card className="w-full max-w-2xl mx-auto shadow-lg">
    <CardHeader>
      <Skeleton className="h-8 w-3/4 mb-2 rounded-md" /> {/* Form Title */}
      <Skeleton className="h-4 w-full rounded-md" />   {/* Form Description */}
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label */}
        <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label */}
        <Skeleton className="h-32 w-full rounded-md" /> {/* Textarea */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3 rounded-md" /> {/* Label */}
        <Skeleton className="h-48 w-full rounded-md" /> {/* ScrollArea for questions */}
      </div>
      <Skeleton className="h-10 w-full rounded-md" /> {/* Submit Button */}
    </CardContent>
  </Card>
);

const DynamicNoteForm = dynamic(() => import('@/components/note-form').then(mod => mod.NoteForm), {
  loading: () => <NoteFormSkeleton />,
  ssr: false // NoteForm likely uses client hooks/context
});

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;

  const { getNoteById, updateNote } = useNotes();
  const { toast } = useToast();

  const [currentNote, setCurrentNote] = useState<Note | undefined>(undefined);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Renamed to avoid conflict if DynamicNoteForm uses 'isLoading'
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (noteId) {
      const note = getNoteById(noteId);
      setCurrentNote(note);
      setIsLoadingInitialData(false);
    }
  }, [noteId, getNoteById]);

  const handleSubmit = (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    try {
      updateNote(noteId, data);
      toast({
        title: 'Note Updated!',
        description: 'Your note has been updated successfully.',
      });
      router.push(`/notes/${noteId}`);
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({
        title: 'Error Updating Note',
        description: 'There was a problem saving your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Skeleton className="h-10 w-48 mb-6 rounded-md" />
        <NoteFormSkeleton />
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Note Not Found</AlertTitle>
          <AlertDescription>
            The note you are trying to edit could not be found. It might have been deleted.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/notes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to All Notes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href={`/notes/${noteId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Note
        </Link>
      </Button>
      <DynamicNoteForm
        note={currentNote}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        formTitle="Edit Note"
        formDescription="Update the details of your note below."
        submitButtonText="Save Changes"
      />
    </div>
  );
}
