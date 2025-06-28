
'use client';

import type { SavedQuestion, QuestionContext, GeneratedQuestionAnswerPair } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SavedQuestionsContextType {
  savedQuestions: SavedQuestion[];
  addQuestion: (questionData: Omit<SavedQuestion, 'id' | 'timestamp'>) => void;
  addMultipleQuestions: (questions: GeneratedQuestionAnswerPair[], context: QuestionContext) => void;
  removeQuestion: (id: string) => void;
  isSaved: (questionText: string, context: QuestionContext) => boolean;
  getQuestionsBySubjectAndChapter: (subject: string, chapter: string) => SavedQuestion[];
}

const SavedQuestionsContext = createContext<SavedQuestionsContextType | undefined>(undefined);

export const SavedQuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, 'users', user.uid, 'savedQuestions'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const questions: SavedQuestion[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as SavedQuestion));
        setSavedQuestions(questions);
      }, (error) => {
        console.error("Error fetching saved questions:", error);
        toast({ title: "Error", description: "Could not fetch saved questions.", variant: "destructive" });
      });
      return () => unsubscribe();
    } else {
      setSavedQuestions([]);
    }
  }, [user, toast]);

  const addQuestion = useCallback(async (questionData: Omit<SavedQuestion, 'id' | 'timestamp'>) => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to save questions.", variant: "destructive" });
      return;
    }
    const questionsCol = collection(db, 'users', user.uid, 'savedQuestions');
    
    // Explicitly handle optional fields to avoid 'undefined' in Firestore
    const { options, explanation, ...rest } = questionData;
    const dataToSave: any = {
      ...rest,
      timestamp: Date.now(),
    };
    if (options) dataToSave.options = options;
    if (explanation) dataToSave.explanation = explanation;

    await addDoc(questionsCol, dataToSave);
  }, [user, toast]);

  const addMultipleQuestions = useCallback(async (questions: GeneratedQuestionAnswerPair[], context: QuestionContext) => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to save questions.", variant: "destructive" });
      return;
    }
    const batch = writeBatch(db);
    const questionsCol = collection(db, 'users', user.uid, 'savedQuestions');
    
    const uniqueNewQuestions = questions.filter(nq =>
      !savedQuestions.some(pq =>
        pq.text === nq.question &&
        pq.subject === context.subject &&
        pq.chapter === context.chapter &&
        pq.gradeLevel === context.gradeLevel &&
        pq.questionType === context.questionType
      )
    );

    if (uniqueNewQuestions.length === 0) {
      toast({ title: "Already Saved", description: "All displayed questions are already in your saved list."});
      return;
    }

    uniqueNewQuestions.forEach(qaPair => {
      const newDocRef = doc(questionsCol);
      // Explicitly construct object to avoid sending `undefined` fields
      const dataToSet: any = {
        text: qaPair.question,
        answer: qaPair.answer,
        ...context,
        timestamp: Date.now(),
      };
      if (qaPair.options) dataToSet.options = qaPair.options;
      if (qaPair.explanation) dataToSet.explanation = qaPair.explanation;
      
      batch.set(newDocRef, dataToSet);
    });
    await batch.commit();
  }, [user, savedQuestions, toast]);

  const removeQuestion = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'savedQuestions', id));
  }, [user]);

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
