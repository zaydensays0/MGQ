'use client';

import { useSavedQuestions } from '@/contexts/saved-questions-context';
import type { SavedQuestion, RecheckAnswerOutput } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, NotebookText, Eye, EyeOff, Layers, ShieldCheck, Loader2, Building } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFlashcards } from '@/contexts/flashcards-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SUBJECTS, BOARDS } from '@/lib/constants';
import { recheckAnswer } from '@/ai/flows/recheck-answer';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useUser } from '@/contexts/user-context';

const SavedQuestionItem: React.FC<{ 
  question: SavedQuestion, 
  onRemove: (id: string) => void,
}> = ({ question, onRemove }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckResult, setRecheckResult] = useState<RecheckAnswerOutput | null>(null);
  const { toast } = useToast();
  const { addWrongQuestion } = useUser();

  const isMCQ = question.questionType === 'multiple_choice' || question.questionType === 'assertion_reason' || question.questionType === 'true_false';

  useEffect(() => {
    setUserSelection(null);
    setIsAttempted(false);
    setIsRechecking(false);
    setRecheckResult(null);
  }, [question.id]);

  const handleSelectOption = (selected: string) => {
    if (isAttempted && isMCQ) return; 
    
    setUserSelection(selected);
    setIsAttempted(true);

    if (selected.trim().toLowerCase() === question.answer.trim().toLowerCase()) {
      toast({ title: "Correct!", description: "Well done!" });
    } else {
      toast({ title: "Incorrect", description: `The correct answer is: ${question.answer}`, variant: 'destructive' });
      addWrongQuestion({
          questionText: question.text,
          userAnswer: selected,
          correctAnswer: question.answer,
          options: question.options,
          explanation: question.explanation,
          context: {
              gradeLevel: question.gradeLevel,
              subject: question.subject,
              chapter: question.chapter,
              questionType: question.questionType,
              streamId: question.streamId,
              board: question.board,
          }
      });
    }
  };
  
  const handleRecheck = async () => {
    setIsRechecking(true);
    setRecheckResult(null);
    try {
      const result = await recheckAnswer({
        question: question.text,
        originalAnswer: question.answer,
        gradeLevel: question.gradeLevel,
        subject: question.subject,
        chapter: question.chapter,
        options: question.options,
      });
      setRecheckResult(result);
      toast({
        title: "Recheck Complete",
        description: result.isCorrect ? "The original answer was confirmed to be correct." : "A correction has been provided.",
      });
    } catch (error) {
      console.error("Recheck error:", error);
      toast({
        title: "Recheck Failed",
        description: "Could not verify the answer at this time.",
        variant: "destructive"
      });
    } finally {
      setIsRechecking(false);
    }
  };

  const renderQuestionText = () => {
    if (question.questionType === 'assertion_reason' && question.text.includes('\\n')) {
      const parts = question.text.split('\\n');
      return (
        <div className="space-y-1">
          <p className="text-foreground leading-relaxed">{parts[0]}</p>
          <p className="text-foreground leading-relaxed">{parts[1]}</p>
        </div>
      );
    }
    return <p className="text-foreground leading-relaxed">{question.text}</p>;
  };

  return (
    <Card className="bg-background shadow-sm">
        <CardContent className="p-4 pb-2">
            <div className="grid w-full gap-1.5">
                <p className="text-sm text-muted-foreground">
                    Type: {question.questionType.replace(/_/g, ' ')} {question.marks && `(${question.marks} marks)`}
                </p>
                {renderQuestionText()}
            </div>
            
            {isMCQ && question.options && question.options.length > 0 && (
              <div className="space-y-1.5 mt-2">
                  {question.options.map((option, index) => {
                  const isSelectedOption = userSelection === option;
                  const isCorrectOption = question.answer === option;
                  let optionStyle = "bg-muted/30 hover:bg-muted/60 dark:bg-muted/10 dark:hover:bg-muted/20";

                  if (isAttempted) {
                      if (isSelectedOption) {
                      optionStyle = isCorrectOption ? "bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300 font-semibold" : "bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 font-semibold";
                      } else if (isCorrectOption && showAnswer) {
                      optionStyle = "bg-green-50 dark:bg-green-800/30 border-green-400";
                      }
                  }
                  return (
                      <Button
                      key={index}
                      variant="outline"
                      className={`w-full justify-start text-left p-2 h-auto whitespace-normal text-sm ${optionStyle}`}
                      onClick={() => handleSelectOption(option)}
                      disabled={isAttempted}
                      >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                      </Button>
                  );
                  })}
              </div>
            )}
            
            {recheckResult && (
              <Alert className="mt-3" variant={recheckResult.isCorrect ? 'default' : 'destructive'}>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>{recheckResult.isCorrect ? "Verification: Correct" : "Verification: Needs Correction"}</AlertTitle>
                  <AlertDescription className="space-y-2">
                      <p>{recheckResult.explanation}</p>
                      {!recheckResult.isCorrect && (
                      <div className="p-2 border-t mt-2">
                          <p className="font-semibold">Corrected Answer:</p>
                          <p>{recheckResult.correctAnswer}</p>
                      </div>
                      )}
                  </AlertDescription>
              </Alert>
            )}
        </CardContent>

        <Accordion type="single" collapsible className="w-full" value={showAnswer ? "answer" : undefined} onValueChange={(value) => setShowAnswer(value === "answer")}>
            <AccordionItem value="answer" className="border-none">
            <AccordionTrigger 
                className="px-4 py-2 text-sm hover:no-underline bg-muted/20 hover:bg-muted/30 rounded-none data-[state=closed]:border-b-0"
            >
                <div className="flex items-center">
                {showAnswer ? <EyeOff className="mr-2 h-4 w-4 text-primary" /> : <Eye className="mr-2 h-4 w-4 text-primary" />}
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-2">
                <div className={`p-3 rounded-md border 
                    ${isMCQ ? 
                    (userSelection === null || (userSelection && userSelection.toLowerCase() === question.answer.toLowerCase()) ? 'bg-green-50 dark:bg-green-800/30 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-800/30 border-red-300 dark:border-red-700') 
                    : 'bg-secondary/50 dark:bg-muted/20 border-input'}`}>
                    <p className={`text-sm font-semibold mb-1 
                    ${isMCQ ? 
                        (userSelection === null || (userSelection && userSelection.toLowerCase() === question.answer.toLowerCase()) ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')
                        : 'text-primary'}`}>
                    Correct Answer:
                    </p>
                    <p className="text-foreground/90 dark:text-foreground/80 leading-relaxed">{question.answer}</p>
                </div>
                {question.explanation && (
                    <div className="mt-3 p-3 bg-secondary/30 rounded-md border border-input">
                        <p className="text-sm font-semibold text-primary mb-1">Explanation:</p>
                        <p className="text-foreground/90 leading-relaxed">{question.explanation}</p>
                    </div>
                )}
            </AccordionContent>
            </AccordionItem>
        </Accordion>

        <CardFooter className="p-3 flex justify-between items-center bg-muted/50 dark:bg-muted/10 rounded-b-md border-t">
             <Button variant="ghost" size="sm" onClick={handleRecheck} disabled={isRechecking || !!recheckResult}>
                {isRechecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {isRechecking ? 'Verifying...' : "Recheck"}
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

const CreateDeckFromChapterDialog = ({ questions, context }: {
  questions: SavedQuestion[],
  context: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deckName, setDeckName] = useState(`Deck: ${context}`);
  const { createDeckFromSavedQuestions } = useFlashcards();
  const { toast } = useToast();

  const handleCreateDeck = () => {
    if (!deckName.trim()) {
      toast({ title: 'Deck name required', variant: 'destructive' });
      return;
    }
    createDeckFromSavedQuestions(deckName, questions);
    toast({ title: 'Deck Created!', description: `A new flashcard deck "${deckName}" has been created.` });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers className="mr-2 h-4 w-4" /> Create Flashcard Deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Flashcard Deck</DialogTitle>
          <DialogDescription>
            Create a new deck from the {questions.length} question(s) in {context}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="deck-name">Deck Name</Label>
          <Input id="deck-name" value={deckName} onChange={(e) => setDeckName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleCreateDeck}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export function SavedQuestionsList({ filterType }: { filterType: 'board' | 'general' }) {
  const { savedQuestions, removeQuestion } = useSavedQuestions();

  const filteredQuestions = useMemo(() => {
    return savedQuestions.filter(q => {
      if (filterType === 'board') {
        return !!q.board;
      }
      return !q.board;
    });
  }, [savedQuestions, filterType]);

  const sortedSavedQuestions = [...filteredQuestions].sort((a, b) => b.timestamp - a.timestamp);

  const groupedBySource = useMemo(() => {
    return sortedSavedQuestions.reduce((acc, q) => {
      let sourceName: string;
      if (filterType === 'board') {
          sourceName = q.board ? BOARDS.find(b => b.id === q.board)?.name || 'Other Boards' : 'Unknown Board';
      } else {
          sourceName = 'General Practice';
      }
      
      if (!acc[sourceName]) acc[sourceName] = [];
      acc[sourceName].push(q);
      return acc;
    }, {} as Record<string, SavedQuestion[]>);
  }, [sortedSavedQuestions, filterType]);


  const groupedBySubjectAndChapter = (questions: SavedQuestion[]) => {
    return questions.reduce((acc, q) => {
        const subjectKey = `${q.subject} (Class ${q.gradeLevel})`;
        if (!acc[subjectKey]) acc[subjectKey] = {};
        if (!acc[subjectKey][q.chapter]) acc[subjectKey][q.chapter] = [];
        acc[subjectKey][q.chapter].push(q);
        return acc;
    }, {} as Record<string, Record<string, SavedQuestion[]>>);
  };

  if (sortedSavedQuestions.length === 0) {
    const emptyStateTitle = filterType === 'board' ? "No Saved Board Questions Yet" : "No Saved General Questions Yet";
    const emptyStateDescription = filterType === 'board' 
        ? "Questions you save from the 'Board Exams' feature will appear here." 
        : "Questions you save from features like 'Generate Questions' or 'Topic to Questions' will appear here.";

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <NotebookText className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-headline font-semibold text-foreground mb-2">{emptyStateTitle}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{emptyStateDescription}</p>
        <Button asChild>
          <Link href={filterType === 'board' ? "/board-exams" : "/generate"}>Go to Generator</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedBySource).map(([sourceName, questions]) => (
        <Card key={sourceName} className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <Building className="mr-3 h-6 w-6 text-primary" /> {sourceName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(groupedBySubjectAndChapter(questions)).map(([subjectKey, chapters]) => (
              <div key={subjectKey} className="mb-4 last:mb-0">
                  <h3 className="text-lg font-semibold capitalize mb-2 border-b pb-1">{subjectKey}</h3>
                  <Accordion type="multiple" className="w-full space-y-1">
                      {Object.entries(chapters).map(([chapter, questionsInChapter]) => (
                          <AccordionItem value={`${subjectKey}-${chapter}`} key={`${subjectKey}-${chapter}`} className="border rounded-md overflow-hidden">
                              <AccordionTrigger className="text-md hover:no-underline px-4 py-3 bg-background hover:bg-muted/50">
                                  <div>
                                      Chapter: {chapter}
                                      <span className="text-sm font-normal text-muted-foreground ml-2">({questionsInChapter.length} questions)</span>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 p-4 bg-muted/20 dark:bg-muted/5">
                                  <div className="flex justify-end mb-4">
                                      {questionsInChapter.length > 0 && (
                                          <CreateDeckFromChapterDialog 
                                              questions={questionsInChapter} 
                                              context={`${chapter} - ${subjectKey}`}
                                          />
                                      )}
                                  </div>
                                  <div className="space-y-4">
                                      {questionsInChapter.map((q) => <SavedQuestionItem key={q.id} question={q} onRemove={removeQuestion}/>)}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
