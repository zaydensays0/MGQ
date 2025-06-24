
'use client';

import type { SavedJarvisExchange, ConversationExchange } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface JarvisSavedContextType {
  savedExchanges: SavedJarvisExchange[];
  addExchange: (data: Omit<SavedJarvisExchange, 'id' | 'timestamp'>) => void;
  removeExchange: (id: string) => void;
  isSaved: (title: string, exchanges: ConversationExchange[]) => boolean;
}

const JarvisSavedContext = createContext<JarvisSavedContextType | undefined>(undefined);

export const JarvisSavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedExchanges, setSavedExchanges] = useState<SavedJarvisExchange[]>([]);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, 'users', user.uid, 'jarvisConversations'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const exchangesData: SavedJarvisExchange[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as SavedJarvisExchange));
        setSavedExchanges(exchangesData);
      }, (error) => {
        console.error("Error fetching Jarvis conversations:", error);
        toast({ title: "Error", description: "Could not fetch your Jarvis chats.", variant: "destructive" });
      });
      return () => unsubscribe();
    } else {
      setSavedExchanges([]);
    }
  }, [user, toast]);

  const addExchange = useCallback(async (data: Omit<SavedJarvisExchange, 'id' | 'timestamp'>) => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to save conversations.", variant: "destructive" });
      return;
    }
    const newExchangeData = {
      ...data,
      timestamp: Date.now(),
    };
    const conversationsCol = collection(db, 'users', user.uid, 'jarvisConversations');
    await addDoc(conversationsCol, newExchangeData);
  }, [user, toast]);

  const removeExchange = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'jarvisConversations', id));
  }, [user]);

  const isSaved = useCallback((
    title: string,
    exchangesToCompare: ConversationExchange[]
  ): boolean => {
    return savedExchanges.some(
      (savedEx) =>
        savedEx.title === title &&
        Array.isArray(savedEx.exchanges) &&
        savedEx.exchanges.length === exchangesToCompare.length &&
        savedEx.exchanges.every((ex, index) => {
          const compareEx = exchangesToCompare[index];
          return compareEx && ex.question === compareEx.question && ex.answer === compareEx.answer;
        })
    );
  }, [savedExchanges]);

  return (
    <JarvisSavedContext.Provider value={{ savedExchanges, addExchange, removeExchange, isSaved }}>
      {children}
    </JarvisSavedContext.Provider>
  );
};

export const useJarvisSaved = (): JarvisSavedContextType => {
  const context = useContext(JarvisSavedContext);
  if (context === undefined) {
    throw new Error('useJarvisSaved must be used within a JarvisSavedProvider');
  }
  return context;
};
