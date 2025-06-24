
'use client';

import type { Flashcard, FlashcardDeck, SavedQuestion } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface FlashcardsContextType {
  decks: FlashcardDeck[];
  addDeck: (deckData: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>, cards: Omit<Flashcard, 'id'>[]) => Promise<FlashcardDeck | undefined>;
  createDeckFromSavedQuestions: (title: string, questions: SavedQuestion[]) => Promise<FlashcardDeck | undefined>;
  getDeckById: (id:string) => FlashcardDeck | undefined;
  removeDeck: (id: string) => void;
  updateDeck: (id: string, deckData: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>) => void;
}

const FlashcardsContext = createContext<FlashcardsContextType | undefined>(undefined);

export const FlashcardsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        if (user && db) {
            const q = query(collection(db, 'users', user.uid, 'flashcardDecks'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const decksData: FlashcardDeck[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as FlashcardDeck));
                setDecks(decksData);
            }, (error) => {
                console.error("Error fetching flashcard decks:", error);
                toast({ title: "Error", description: "Could not fetch your flashcard decks.", variant: "destructive" });
            });
            return () => unsubscribe();
        } else {
            setDecks([]);
        }
    }, [user, toast]);

    const addDeck = useCallback(async (deckData: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>, cards: Omit<Flashcard, 'id'>[]): Promise<FlashcardDeck | undefined> => {
        if (!user || !db) {
            toast({ title: "Not Logged In", description: "You must be logged in to create decks.", variant: "destructive" });
            return;
        }
        const decksCol = collection(db, 'users', user.uid, 'flashcardDecks');
        const newDeckData = {
            ...deckData,
            createdAt: Date.now(),
            cards: cards.map(c => ({ ...c, id: uuidv4() })),
        };
        const docRef = await addDoc(decksCol, newDeckData);
        return { id: docRef.id, ...newDeckData };
    }, [user, toast]);
    
    const createDeckFromSavedQuestions = useCallback(async (title: string, questions: SavedQuestion[]): Promise<FlashcardDeck | undefined> => {
        const newCards = questions.map(q => ({
            front: q.text,
            back: q.answer,
        }));
        const deckContext = questions.length > 0 ? {
            gradeLevel: questions[0].gradeLevel,
            subject: questions[0].subject,
            chapter: questions[0].chapter,
        } : {};
        
        return addDeck({ title, ...deckContext }, newCards);
    }, [addDeck]);

    const getDeckById = useCallback((id: string) => decks.find(deck => deck.id === id), [decks]);
    
    const removeDeck = useCallback(async (id: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'flashcardDecks', id));
    }, [user]);

    const updateDeck = useCallback(async (id: string, deckData: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>) => {
        if (!user || !db) return;
        const deckDocRef = doc(db, 'users', user.uid, 'flashcardDecks', id);
        await updateDoc(deckDocRef, deckData);
    }, [user]);

    return (
        <FlashcardsContext.Provider value={{ decks, addDeck, createDeckFromSavedQuestions, getDeckById, removeDeck, updateDeck }}>
            {children}
        </FlashcardsContext.Provider>
    );
};

export const useFlashcards = (): FlashcardsContextType => {
    const context = useContext(FlashcardsContext);
    if (context === undefined) {
        throw new Error('useFlashcards must be used within a FlashcardsProvider');
    }
    return context;
};
