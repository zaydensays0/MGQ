
'use client';

import type { Flashcard, FlashcardDeck, SavedQuestion } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface FlashcardsContextType {
  decks: FlashcardDeck[];
  addDeck: (deckData: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>, cards: Omit<Flashcard, 'id'>[]) => FlashcardDeck;
  createDeckFromSavedQuestions: (title: string, questions: SavedQuestion[]) => FlashcardDeck;
  getDeckById: (id:string) => FlashcardDeck | undefined;
  removeDeck: (id: string) => void;
  updateDeck: (id: string, deckData: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>) => void;
}

const FlashcardsContext = createContext<FlashcardsContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY_FLASHCARDS = 'MGQsFlashcardDecks_v2';

export const FlashcardsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_FLASHCARDS);
                setDecks(items ? JSON.parse(items) : []);
            } catch (error) {
                console.error("Failed to load flashcard decks from localStorage:", error);
                setDecks([]);
            }
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (isInitialized) {
            window.localStorage.setItem(LOCAL_STORAGE_KEY_FLASHCARDS, JSON.stringify(decks));
        }
    }, [decks, isInitialized]);

    const addDeck = useCallback((deckData: Omit<FlashcardDeck, 'id' | 'createdAt' | 'cards'>, cards: Omit<Flashcard, 'id'>[]): FlashcardDeck => {
        const newDeck: FlashcardDeck = {
            id: uuidv4(),
            createdAt: Date.now(),
            ...deckData,
            cards: cards.map(c => ({ ...c, id: uuidv4() })),
        };
        setDecks(prev => [newDeck, ...prev].sort((a,b) => b.createdAt - a.createdAt));
        return newDeck;
    }, []);
    
    const createDeckFromSavedQuestions = useCallback((title: string, questions: SavedQuestion[]): FlashcardDeck => {
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
    
    const removeDeck = useCallback((id: string) => {
        setDecks(prev => prev.filter(deck => deck.id !== id));
    }, []);

    const updateDeck = useCallback((id: string, deckData: Partial<Omit<FlashcardDeck, 'id' | 'createdAt'>>) => {
        setDecks(prev => prev.map(deck => deck.id === id ? { ...deck, ...deckData } : deck));
    }, []);

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
