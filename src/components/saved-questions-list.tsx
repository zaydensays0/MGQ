
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
  const [showAnswer, setShowAnswer] = useState(false); // State moved here for individual control

  return (
    <Card className="bg-background shadow-sm">
      <CardContent className="p-4 pb-0">
        <p className="text-sm text-muted-foreground mb-1">
          Type: {question.questionType.replace(/_/g, ' ')}
        </p>
        <p className="text-foreground leading-relaxed mb-2">{question.text}</p>
      </CardContent>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="answer" className="border-none">
          <AccordionTrigger 
            className="px-4 py-2 text-sm hover:no-underline bg-muted/20 hover:bg-muted/30 rounded-none data-[state=closed]:border-b-0"
            onClick={() => setShowAnswer(!showAnswer)} // Toggle showAnswer on trigger click
          >
            <div className="flex items-center">
              {showAnswer ? <EyeOff className="mr-2 h-4 w-4 text-primary" /> : <Eye className="mr-2 h-4 w-4 text-primary" />}
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-2">
            {showAnswer && ( // Conditionally render based on showAnswer state
              <div className="p-3 bg-secondary/50 rounded-md border border-input">
                <p className="text-sm font-semibold text-primary mb-1">Answer:</p>
                <p className="text-foreground/90 leading-relaxed">{question.answer}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <CardFooter className="p-3 flex justify-end items-center bg-muted/50 rounded-b-md border-t">
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

  const sortedSavedQuestions = [...savedQuestions].sort((a, b) => b.timestamp - a.timestamp);

  if (sortedSavedQuestions.length === 0) {
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

  const groupedQuestions = sortedSavedQuestions.reduce((acc, q) => {
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
            <Accordion type="multiple" className="w-full space-y-1">
              {Object.entries(chapters).map(([chapter, questionsInChapter]) => (
                <AccordionItem value={`${subjectKey}-${chapter}`} key={`${subjectKey}-${chapter}`} className="border rounded-md overflow-hidden">
                  <AccordionTrigger className="text-lg hover:no-underline px-4 py-3 bg-background hover:bg-muted/50">
                    Chapter: {chapter} ({questionsInChapter.length} questions)
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-4 p-4 bg-muted/20">
                    {questionsInChapter
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
