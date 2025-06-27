
'use client';

import React from 'react';
import type { NeetQuestion } from '@/types';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';

interface StreamBookmarksDialogProps {
  bookmarks: NeetQuestion[];
  removeBookmark: (questionText: string) => void;
  streamContext: { subject: string, chapter: string };
}

export const StreamBookmarksDialog: React.FC<StreamBookmarksDialogProps> = ({ bookmarks, removeBookmark, streamContext }) => {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Saved Questions: <span className="capitalize">{streamContext.subject}</span> - {streamContext.chapter}</DialogTitle>
        <DialogDescription>
          These questions are saved in your browser for this specific stream session.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        {bookmarks.length > 0 ? (
          <div className="space-y-4">
            {bookmarks.map((question) => (
              <div key={question.text} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold flex-1 pr-2 whitespace-pre-wrap">{question.text}</p>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeBookmark(question.text)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="answer" className="border-none">
                    <AccordionTrigger>Show Answer & Explanation</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-bold">Answer: {question.answer}</p>
                      <div className="mt-2 text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
                        {question.explanation}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">You haven't bookmarked any questions for this session yet.</p>
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  );
};
