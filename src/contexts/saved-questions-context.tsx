
'use client';

import type { SavedQuestion, QuestionContext, GeneratedQuestionAnswerPair } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

interface SavedQuestionsContextType {
  savedQuestions: SavedQuestion[];
  addQuestion: (questionData: Omit<SavedQuestion, 'id' | 'timestamp'>) => void;
  addMultipleQuestions: (questions: GeneratedQuestionAnswerPair[], context: QuestionContext) => void;
  removeQuestion: (id: string) => void;
  isSaved: (questionText: string, context: QuestionContext) => boolean;
  getQuestionsBySubjectAndChapter: (subject: string, chapter: string) => SavedQuestion[];
}

const SavedQuestionsContext = createContext<SavedQuestionsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'MGQsSavedQuestions';

export const SavedQuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (items) {
          setSavedQuestions(JSON.parse(items));
        }
      } catch (error) {
        console.error("Failed to load saved questions from localStorage:", error);
        setSavedQuestions([]);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedQuestions));
      } catch (error) {
        console.error("Failed to save questions to localStorage:", error);
      }
    }
  }, [savedQuestions, isInitialized]);

  const addQuestion = useCallback((questionData: Omit<SavedQuestion, 'id' | 'timestamp'>) => {
    const newQuestion: SavedQuestion = {
      id: uuidv4(),
      timestamp: Date.now(),
      answer: '', 
      ...questionData, 
    };
    setSavedQuestions((prevQuestions) => [newQuestion, ...prevQuestions].sort((a,b) => b.timestamp - a.timestamp));
  }, []);

  const addMultipleQuestions = useCallback((questions: GeneratedQuestionAnswerPair[], context: QuestionContext) => {
    const newQuestions: SavedQuestion[] = questions.map(qaPair => ({
      id: uuidv4(),
      text: qaPair.question,
      answer: qaPair.answer,
      ...context,
      timestamp: Date.now(),
    }));
    setSavedQuestions((prevQuestions) => {
      const uniqueNewQuestions = newQuestions.filter(nq =>
        !prevQuestions.some(pq =>
          pq.text === nq.text &&
          pq.subject === nq.subject &&
          pq.chapter === nq.chapter &&
          pq.gradeLevel === nq.gradeLevel &&
          pq.questionType === nq.questionType
        )
      );
      return [...prevQuestions, ...uniqueNewQuestions].sort((a,b) => b.timestamp - a.timestamp);
    });
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setSavedQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
  }, []);

  const isSaved = useCallback((questionText: string, context: QuestionContext): boolean => {
    return savedQuestions.some(
      (q) =>
        q.text === questionText &&
        q.gradeLevel === context.gradeLevel &&
        q.subject === context.subject &&
        q.chapter === context.chapter &&
        q.questionType === context.questionType
    );
  }, [savedQuestions]);

  const getQuestionsBySubjectAndChapter = useCallback((subject: string, chapter: string): SavedQuestion[] => {
    return savedQuestions.filter(q => q.subject === subject && q.chapter === chapter);
  }, [savedQuestions]);


  return (
    <SavedQuestionsContext.Provider value={{ savedQuestions, addQuestion, addMultipleQuestions, removeQuestion, isSaved, getQuestionsBySubjectAndChapter }}>
      {children}
    </SavedQuestionsContext.Provider>
  );
};

export const useSavedQuestions = (): SavedQuestionsContextType => {
  const context = useContext(SavedQuestionsContext);
  if (context === undefined) {
    throw new Error('useSavedQuestions must be used within a SavedQuestionsProvider');
  }
  return context;
};
