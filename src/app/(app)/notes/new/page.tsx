
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NoteForm } from '@/components/note-form';
import { useNotes } from '@/contexts/notes-context';
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewNotePage() {
  const router = useRouter();
  const { addNote } = useNotes();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSaving(true);
    try {
      addNote(data);
      toast({
        title: 'Note Created!',
        description: 'Your new note has been saved successfully.',
      });
      router.push('/notes');
    } catch (error) {
      console.error('Failed to create note:', error);
      toast({
        title: 'Error Creating Note',
        description: 'There was a problem saving your note. Please try again.',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
       <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/notes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Notes
        </Link>
      </Button>
      <NoteForm
        onSubmit={handleSubmit}
        isSaving={isSaving}
        formTitle="Create New Note"
        formDescription="Fill in the details below to create your new note."
        submitButtonText="Save Note"
      />
    </div>
  );
}
