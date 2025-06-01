
'use client';

import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { SavedQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, NotebookText, Eye, EyeOff } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import React, { useState } from 'react';

const SavedQuestionItem: React.FC<{ question: SavedQuestion, onRemove: (id: string) => void }> = ({ question, onRemove }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card className="bg-background shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">
          Type: {question.questionType.replace(/_/g, ' ')}
        </p>
        <p className="text-foreground leading-relaxed mb-2">{question.text}</p>
        {showAnswer && (
          <div className="mt-2 p-3 bg-secondary/30 rounded-md border border-input">
            <p className="text-sm font-semibold text-primary mb-1">Answer:</p>
            <p className="text-foreground/90 leading-relaxed">{question.answer}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 flex justify-between items-center bg-muted/30 rounded-b-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
          aria-label={showAnswer ? "Hide answer" : "Show answer"}
        >
          {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(question.id)}
          aria-label="Delete question"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};


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
    const subjectKey = `${q.subject} (Class ${q.gradeLevel})`;
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
            <CardTitle className="text-xl font-headline capitalize">{subjectKey}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(chapters).map(([chapter, questionsInChapter]) => (
                <AccordionItem value={`${subjectKey}-${chapter}`} key={`${subjectKey}-${chapter}`}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    Chapter: {chapter} ({questionsInChapter.length} questions)
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-4">
                    {questionsInChapter
                      .sort((a,b) => b.timestamp - a.timestamp)
                      .map((q) => (
                        <SavedQuestionItem key={q.id} question={q} onRemove={removeQuestion} />
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
