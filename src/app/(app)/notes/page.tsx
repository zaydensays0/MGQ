
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/note-card';
import { useNotes } from '@/contexts/notes-context';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotesListPage() {
  const { notes, removeNote } = useNotes();
  const { toast } = useToast();

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      removeNote(id);
      toast({
        title: 'Note Deleted',
        description: 'The note has been successfully deleted.',
      });
    }
  };
  
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
           <Edit3 className="w-8 h-8 mr-3 text-primary" />
          <div>
            <h1 className="text-3xl font-headline font-bold">My Notes</h1>
            <p className="text-muted-foreground mt-1">
              Organize your thoughts and link important questions.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Note
          </Link>
        </Button>
      </div>

      {sortedNotes.length === 0 ? (
        <Alert className="max-w-xl mx-auto text-center border-dashed">
          <Edit3 className="h-6 w-6 mx-auto mb-2 text-primary" />
          <AlertTitle className="font-headline text-xl">No Notes Yet!</AlertTitle>
          <AlertDescription className="mt-1">
            Click the "Create New Note" button to start your first note.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
          ))}
        </div>
      )}
    </div>
  );
}
