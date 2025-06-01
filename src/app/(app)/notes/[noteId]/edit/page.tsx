
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NoteForm } from '@/components/note-form';
import { useNotes } from '@/contexts/notes-context';
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@/types';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;

  const { getNoteById, updateNote } = useNotes();
  const { toast } = useToast();

  const [currentNote, setCurrentNote] = useState<Note | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (noteId) {
      const note = getNoteById(noteId);
      setCurrentNote(note);
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[500px] w-full max-w-2xl mx-auto" />
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
      <NoteForm
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
