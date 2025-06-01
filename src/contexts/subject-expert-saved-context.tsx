
'use client';

import type { SavedSubjectExpertExchange, GradeLevelNCERT, ConversationExchange } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SubjectExpertSavedContextType {
  savedExchanges: SavedSubjectExpertExchange[];
  addExchange: (data: Omit<SavedSubjectExpertExchange, 'id' | 'timestamp'>) => void;
  removeExchange: (id: string) => void;
  isSaved: (gradeLevel: GradeLevelNCERT, subject: string, chapter: string, exchanges: ConversationExchange[]) => boolean;
}

const SubjectExpertSavedContext = createContext<SubjectExpertSavedContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_SUBJECT_EXPERT = 'MGQsSavedSubjectExpertExchanges';

// Helper function for deep comparison of exchange arrays
const areExchangeArraysEqual = (arr1: ConversationExchange[], arr2: ConversationExchange[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].question !== arr2[i].question || arr1[i].answer !== arr2[i].answer) {
      return false;
    }
  }
  return true;
};


export const SubjectExpertSavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedExchanges, setSavedExchanges] = useState<SavedSubjectExpertExchange[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_SUBJECT_EXPERT);
        if (items) {
          setSavedExchanges(JSON.parse(items));
        }
      } catch (error) {
        console.error("Failed to load saved subject expert exchanges from localStorage:", error);
        setSavedExchanges([]);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY_SUBJECT_EXPERT, JSON.stringify(savedExchanges));
      } catch (error) {
        console.error("Failed to save subject expert exchanges to localStorage:", error);
      }
    }
  }, [savedExchanges, isInitialized]);

  const addExchange = useCallback((data: Omit<SavedSubjectExpertExchange, 'id' | 'timestamp'>) => {
    const newExchange: SavedSubjectExpertExchange = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...data, // data now includes the 'exchanges' array
    };
    setSavedExchanges((prevExchanges) => [newExchange, ...prevExchanges].sort((a,b) => b.timestamp - a.timestamp));
  }, []);

  const removeExchange = useCallback((id: string) => {
    setSavedExchanges((prevExchanges) => prevExchanges.filter((ex) => ex.id !== id));
  }, []);

  const isSaved = useCallback((gradeLevel: GradeLevelNCERT, subject: string, chapter: string, exchangesToCompare: ConversationExchange[]): boolean => {
    return savedExchanges.some(
      (ex) => 
        ex.gradeLevel === gradeLevel &&
        ex.subject === subject &&
        ex.chapter === chapter &&
        areExchangeArraysEqual(ex.exchanges, exchangesToCompare)
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
