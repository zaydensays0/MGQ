'use client';

import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { SavedQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, NotebookText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

export function SavedQuestionsList() {
  const { savedQuestions, removeQuestion } = useSavedQuestions();

  if (savedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <NotebookText className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-2">No Saved Questions Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Looks like you haven't saved any questions. Head over to the generation page to create and save some!
        </p>
        <Button asChild>
          <Link href="/">Generate Questions</Link>
        </Button>
      </div>
    );
  }

  // Group questions by subject, then by chapter
  const groupedQuestions = savedQuestions.reduce((acc, q) => {
    const subjectKey = `${q.subject} (${q.gradeLevel})`; // Include grade level for uniqueness
    if (!acc[subjectKey]) {
      acc[subjectKey] = {};
    }
    if (!acc[subjectKey][q.chapter]) {
      acc[subjectKey][q.chapter] = [];
    }
    acc[subjectKey][q.chapter].push(q);
    return acc;
  }, {} as Record<string, Record<string, SavedQuestion[]>>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedQuestions).map(([subjectKey, chapters]) => (
        <Card key={subjectKey} className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline capitalize">{subjectKey.split(' (')[0]} - Class {subjectKey.match(/\(([^)]+)\)/)?.[1]}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(chapters).map(([chapter, questionsInChapter]) => (
                <AccordionItem value={`${subjectKey}-${chapter}`} key={`${subjectKey}-${chapter}`}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    Chapter: {chapter} ({questionsInChapter.length} questions)
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-4">
                    {questionsInChapter.sort((a,b) => b.timestamp - a.timestamp).map((q) => (
                      <Card key={q.id} className="bg-background shadow-sm">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-1">Type: {q.questionType.replace(/_/g, ' ')}</p>
                          <p className="text-foreground leading-relaxed">{q.text}</p>
                        </CardContent>
                        <CardFooter className="p-3 flex justify-end bg-muted/30 rounded-b-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeQuestion(q.id)}
                            aria-label="Delete question"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
