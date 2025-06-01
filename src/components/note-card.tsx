
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { BookOpenText, FileText, Edit2, Trash2 } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline truncate flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          {note.title || 'Untitled Note'}
        </CardTitle>
        <CardDescription>
          Last updated: {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {note.content || 'No content yet...'}
        </p>
        {note.linkedQuestionIds.length > 0 && (
          <p className="text-xs text-primary mt-2">
            {note.linkedQuestionIds.length} linked question(s)
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 bg-muted/30 rounded-b-md">
        <Button asChild variant="outline" size="sm">
          <Link href={`/notes/${note.id}`}>
            <BookOpenText className="mr-2 h-4 w-4" /> View
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/notes/${note.id}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(note.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
