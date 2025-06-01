
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// import { NoteForm } from '@/components/note-form'; // Removed direct import
import { useNotes } from '@/contexts/notes-context';
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
      <DynamicNoteForm
        onSubmit={handleSubmit}
        isSaving={isSaving}
        formTitle="Create New Note"
        formDescription="Fill in the details below to create your new note."
        submitButtonText="Save Note"
      />
    </div>
  );
}
