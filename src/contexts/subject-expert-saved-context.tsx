
'use client';

import type { SavedSubjectExpertExchange, ConversationExchange, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


interface SubjectExpertSavedContextType {
  savedExchanges: SavedSubjectExpertExchange[];
  addExchange: (data: Omit<SavedSubjectExpertExchange, 'id' | 'timestamp'>) => void;
  removeExchange: (id: string) => void;
  isSaved: (
    gradeLevel: GradeLevelNCERT,
    subject: string,
    chapter: string,
    exchanges: ConversationExchange[]
  ) => boolean;
}

const SubjectExpertSavedContext = createContext<SubjectExpertSavedContextType | undefined>(undefined);

export const SubjectExpertSavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedExchanges, setSavedExchanges] = useState<SavedSubjectExpertExchange[]>([]);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, 'users', user.uid, 'subjectExpertConversations'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const exchangesData: SavedSubjectExpertExchange[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as SavedSubjectExpertExchange));
        setSavedExchanges(exchangesData);
      }, (error) => {
        console.error("Error fetching subject expert conversations:", error);
        toast({ title: "Error", description: "Could not fetch your expert chats.", variant: "destructive" });
      });
      return () => unsubscribe();
    } else {
      setSavedExchanges([]);
    }
  }, [user, toast]);

  const addExchange = useCallback(async (data: Omit<SavedSubjectExpertExchange, 'id' | 'timestamp'>) => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to save conversations.", variant: "destructive" });
      return;
    }
    const newExchangeData = {
      ...data,
      timestamp: Date.now(),
    };
    const conversationsCol = collection(db, 'users', user.uid, 'subjectExpertConversations');
    await addDoc(conversationsCol, newExchangeData);
  }, [user, toast]);

  const removeExchange = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'subjectExpertConversations', id));
  }, [user]);

  const isSaved = useCallback((
    gradeLevel: GradeLevelNCERT,
    subject: string,
    chapter: string,
    exchangesToCompare: ConversationExchange[]
  ): boolean => {
    return savedExchanges.some(
      (savedEx) =>
        savedEx.gradeLevel === gradeLevel &&
        savedEx.subject === subject &&
        savedEx.chapter === chapter &&
        Array.isArray(savedEx.exchanges) && 
        savedEx.exchanges.length === exchangesToCompare.length &&
        savedEx.exchanges.every((ex, index) => {
          const compareEx = exchangesToCompare[index];
          return compareEx && ex.question === compareEx.question && ex.answer === compareEx.answer;
        })
    );
  }, [savedExchanges]);

  return (
    <SubjectExpertSavedContext.Provider value={{ savedExchanges, addExchange, removeExchange, isSaved }}>
      {children}
    </SubjectExpertSavedContext.Provider>
  );
};

export const useSubjectExpertSaved = (): SubjectExpertSavedContextType => {
  const context = useContext(SubjectExpertSavedContext);
  if (context === undefined) {
    throw new Error('useSubjectExpertSaved must be used within a SubjectExpertSavedProvider');
  }
  return context;
};
