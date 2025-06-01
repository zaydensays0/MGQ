
'use client';

import type { SavedJarvisExchange } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface JarvisSavedContextType {
  savedExchanges: SavedJarvisExchange[];
  addExchange: (data: Omit<SavedJarvisExchange, 'id' | 'timestamp'>) => void;
  removeExchange: (id: string) => void;
  isSaved: (userQuestion: string, jarvisAnswer: string) => boolean;
}

const JarvisSavedContext = createContext<JarvisSavedContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_JARVIS = 'MGQsSavedJarvisExchanges';

export const JarvisSavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedExchanges, setSavedExchanges] = useState<SavedJarvisExchange[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_JARVIS);
        if (items) {
          setSavedExchanges(JSON.parse(items));
        }
      } catch (error) {
        console.error("Failed to load saved Jarvis exchanges from localStorage:", error);
        setSavedExchanges([]);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY_JARVIS, JSON.stringify(savedExchanges));
      } catch (error) {
        console.error("Failed to save Jarvis exchanges to localStorage:", error);
      }
    }
  }, [savedExchanges, isInitialized]);

  const addExchange = useCallback((data: Omit<SavedJarvisExchange, 'id' | 'timestamp'>) => {
    const newExchange: SavedJarvisExchange = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...data,
    };
    setSavedExchanges((prevExchanges) => [newExchange, ...prevExchanges].sort((a,b) => b.timestamp - a.timestamp));
  }, []);

  const removeExchange = useCallback((id: string) => {
    setSavedExchanges((prevExchanges) => prevExchanges.filter((ex) => ex.id !== id));
  }, []);

  const isSaved = useCallback((userQuestion: string, jarvisAnswer: string): boolean => {
    return savedExchanges.some(
      (ex) => ex.userQuestion === userQuestion && ex.jarvisAnswer === jarvisAnswer
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
