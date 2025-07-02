
'use client';

import type { SavedQuestion, QuestionContext, GeneratedQuestionAnswerPair, AnyQuestionType, BoardId } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SavedQuestionsContextType {
  savedQuestions: SavedQuestion[];
  addQuestion: (questionData: Omit<SavedQuestion, 'id' | 'timestamp'>) => void;
  addMultipleQuestions: (questions: (GeneratedQuestionAnswerPair | SavedQuestion)[], context: QuestionContext) => void;
  removeQuestion: (id: string) => void;
  isSaved: (questionText: string, context: Partial<QuestionContext>) => boolean;
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
    
    // Explicitly copy properties to avoid passing undefined values to Firestore
    const dataToSave: any = {
      text: questionData.text,
      answer: questionData.answer,
      questionType: questionData.questionType,
      gradeLevel: questionData.gradeLevel,
      subject: questionData.subject,
      chapter: questionData.chapter,
      timestamp: Date.now(),
    };
    if (questionData.options) dataToSave.options = questionData.options;
    if (questionData.explanation) dataToSave.explanation = questionData.explanation;
    if (questionData.streamId) dataToSave.streamId = questionData.streamId;
    if (questionData.board) dataToSave.board = questionData.board;
    if (questionData.marks) dataToSave.marks = questionData.marks;
    if (questionData.medium) dataToSave.medium = questionData.medium;


    await addDoc(questionsCol, dataToSave);
  }, [user, toast]);

  const isSaved = useCallback((questionText: string, context: Partial<QuestionContext>): boolean => {
    return savedQuestions.some(
      (q) =>
        q.text === questionText &&
        q.gradeLevel === context.gradeLevel &&
        q.subject === context.subject &&
        q.chapter === context.chapter &&
        q.questionType === context.questionType &&
        q.streamId === context.streamId &&
        q.board === context.board &&
        q.medium === context.medium
    );
  }, [savedQuestions]);

  const addMultipleQuestions = useCallback(async (questions: (GeneratedQuestionAnswerPair | SavedQuestion)[], context: QuestionContext) => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to save questions.", variant: "destructive" });
      return;
    }
    const batch = writeBatch(db);
    const questionsCol = collection(db, 'users', user.uid, 'savedQuestions');
    
    const uniqueNewQuestions = questions.filter(nq => {
        const text = 'text' in nq ? nq.text : nq.question;
        return !isSaved(text, context);
    });

    if (uniqueNewQuestions.length === 0) {
      toast({ title: "Already Saved", description: "All displayed questions are already in your saved list."});
      return;
    }

    uniqueNewQuestions.forEach(q => {
      const newDocRef = doc(questionsCol);
      const questionText = 'text' in q ? q.text : q.question;

      const dataToSet: any = {
        text: questionText,
        answer: q.answer,
        ...context,
        timestamp: Date.now(),
      };
      if (q.options) dataToSet.options = q.options;
      if (q.explanation) dataToSet.explanation = q.explanation;
      if ('marks' in q && q.marks) dataToSet.marks = q.marks;

      batch.set(newDocRef, dataToSet);
    });
    await batch.commit();
    toast({
      title: "Questions Saved!",
      description: `${uniqueNewQuestions.length} unique question(s) have been saved.`
    });
  }, [user, toast, isSaved]);

  const removeQuestion = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'savedQuestions', id));
  }, [user]);

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
