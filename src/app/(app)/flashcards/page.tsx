
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useFlashcards } from '@/contexts/flashcards-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Layers, PlusCircle, Sparkles, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { generateFlashcards, type GenerateFlashcardsInput } from '@/ai/flows/generate-flashcards';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, FlashcardDeck } from '@/types';
import { Textarea } from '@/components/ui/textarea';

const DeckCard = ({ deck }: { deck: FlashcardDeck }) => (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
                <Layers className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
                {deck.title}
            </CardTitle>
            <CardDescription>
                Created {formatDistanceToNow(new Date(deck.createdAt), { addSuffix: true })}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">{deck.cards.length} card(s)</p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={`/flashcards/${deck.id}`}>Study Deck <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardFooter>
    </Card>
);

const AIGenerationDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { addDeck } = useFlashcards();
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Form state
    const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [numberOfCards, setNumberOfCards] = useState('10');

    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement) {
          if (isLoading) {
            audioElement.play().catch(error => {
              console.error("Audio play failed.", error);
            });
          } else {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        }
    }, [isLoading]);


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gradeLevel || !subject || !chapter || !numberOfCards) {
            toast({ title: 'Missing fields', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);

        const input: GenerateFlashcardsInput = {
            gradeLevel: gradeLevel as GradeLevelNCERT,
            subject,
            chapter,
            numberOfCards: parseInt(numberOfCards, 10),
        };

        try {
            const result = await generateFlashcards(input);
            if (result && result.flashcards.length > 0) {
                const deckTitle = `AI: ${chapter}`;
                addDeck({ title: deckTitle, gradeLevel, subject, chapter }, result.flashcards);
                toast({ title: 'Deck Created!', description: `An AI-generated deck for "${chapter}" has been added.` });
                setIsOpen(false);
            } else {
                throw new Error('AI did not return any flashcards.');
            }
        } catch (error) {
            toast({ title: 'Generation Failed', description: 'Could not generate flashcards. Please try again.', variant: 'destructive' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde419d84.mp3" loop />
            <DialogTrigger asChild>
                <Button size="icon" aria-label="Generate with AI">
                    <Sparkles className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Deck with AI</DialogTitle>
                    <DialogDescription>Let AI create a flashcard deck for you based on a chapter.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerate} className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gradeLevel-ai">Grade</Label>
                            <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevelNCERT)} required>
                                <SelectTrigger id="gradeLevel-ai"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                                <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="subject-ai">Subject</Label>
                            <Select value={subject} onValueChange={setSubject} required>
                                <SelectTrigger id="subject-ai"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="chapter-ai">Chapter</Label>
                        <Input id="chapter-ai" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g., The French Revolution" required />
                    </div>
                     <div>
                        <Label htmlFor="numberOfCards">Number of Cards (5-20)</Label>
                        <Input id="numberOfCards" type="number" value={numberOfCards} onChange={(e) => setNumberOfCards(e.target.value)} min="5" max="20" required />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ManualCreationDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { addDeck } = useFlashcards();
    const { toast } = useToast();

    // Form state
    const [title, setTitle] = useState('');
    const [cards, setCards] = useState([{ front: '', back: '' }]);

    const handleAddCard = () => {
        setCards([...cards, { front: '', back: '' }]);
    };

    const handleRemoveCard = (index: number) => {
        if (cards.length > 1) {
            const newCards = cards.filter((_, i) => i !== index);
            setCards(newCards);
        }
    };

    const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
        const newCards = [...cards];
        newCards[index][field] = value;
        setCards(newCards);
    };

    const resetForm = () => {
        setTitle('');
        setCards([{ front: '', back: '' }]);
    }

    const handleCreateDeck = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ title: 'Missing Title', description: 'Please provide a title for your deck.', variant: 'destructive' });
            return;
        }
        if (cards.some(card => !card.front.trim() || !card.back.trim())) {
            toast({ title: 'Incomplete Cards', description: 'Please make sure all flashcards have both a front and a back.', variant: 'destructive' });
            return;
        }

        addDeck({ title }, cards);
        toast({ title: 'Deck Created!', description: `Your manual deck "${title}" has been added.` });
        setIsOpen(false);
        resetForm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Create Manually">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create a Manual Deck</DialogTitle>
                    <DialogDescription>Build your own flashcard deck from scratch.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDeck}>
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="deck-title">Deck Title</Label>
                            <Input id="deck-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., History - Chapter 5 Key Dates" required />
                        </div>
                        <Label>Flashcards</Label>
                        {cards.map((card, index) => (
                            <div key={index} className="p-4 border rounded-md space-y-3 relative bg-card">
                                <p className="text-sm font-medium text-muted-foreground">Card {index + 1}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`card-front-${index}`}>Front</Label>
                                        <Textarea id={`card-front-${index}`} value={card.front} onChange={(e) => handleCardChange(index, 'front', e.target.value)} placeholder="Term, question, or concept" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`card-back-${index}`}>Back</Label>
                                        <Textarea id={`card-back-${index}`} value={card.back} onChange={(e) => handleCardChange(index, 'back', e.target.value)} placeholder="Definition or answer" required />
                                    </div>
                                </div>
                                {cards.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCard(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={handleAddCard} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Card
                        </Button>
                    </div>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">
                            Create Deck
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default function FlashcardsPage() {
    const { decks } = useFlashcards();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Layers className="w-8 h-8 mr-3 text-primary" />
                    Flashcard Decks
                </h1>
                <div className="flex gap-2">
                    <ManualCreationDialog />
                    <AIGenerationDialog />
                </div>
            </div>

            {decks.length === 0 ? (
                <Alert className="max-w-xl mx-auto text-center border-dashed">
                    <Layers className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <AlertTitle className="font-headline text-xl">No Flashcard Decks Yet</AlertTitle>
                    <AlertDescription className="mt-1">
                        Create a deck from scratch, from your saved questions, or use AI to generate one.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            )}
        </div>
    );
}
