
'use client';

import type { FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Note, SavedQuestion } from '@/types';
import { useSavedQuestions } from '@/contexts/saved-questions-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

interface NoteFormProps {
  note?: Note;
  onSubmit: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isSaving: boolean;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export function NoteForm({ note, onSubmit, isSaving, formTitle, formDescription, submitButtonText }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(note?.linkedQuestionIds || []);
  
  const { savedQuestions } = useSavedQuestions();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedQuestionIds(note.linkedQuestionIds);
    }
  }, [note]);

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for the note.');
      return;
    }
    onSubmit({ title, content, linkedQuestionIds: selectedQuestionIds });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Note Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title (e.g., Chapter 1 Key Concepts)"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here... (Markdown can be used for formatting)"
              rows={10}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Link Saved Questions</Label>
            {savedQuestions.length > 0 ? (
              <ScrollArea className="h-48 w-full rounded-md border p-4">
                <div className="space-y-2">
                  {savedQuestions.map((q) => (
                    <div key={q.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={`q-${q.id}`}
                        checked={selectedQuestionIds.includes(q.id)}
                        onCheckedChange={() => handleQuestionToggle(q.id)}
                      />
                      <Label htmlFor={`q-${q.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                        {q.text.length > 100 ? `${q.text.substring(0, 100)}...` : q.text} 
                        <span className="text-xs text-muted-foreground ml-1">({q.subject}, Ch: {q.chapter})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Saved Questions</AlertTitle>
                <AlertDescription>
                  You don't have any saved questions yet. Save some questions first to link them here.
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Selected {selectedQuestionIds.length} question(s).
            </p>
          </div>

          <Button type="submit" className="w-full text-base py-3" disabled={isSaving}>
            {isSaving ? 'Saving...' : submitButtonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
