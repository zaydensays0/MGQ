
'use client';

import type { Note } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './user-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface NotesContextType {
  notes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note | undefined>;
  updateNote: (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Note | undefined>;
  removeNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const { user, trackStats } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && db) {
      const q = query(collection(db, 'users', user.uid, 'notes'), orderBy('updatedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData: Note[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Note));
        setNotes(notesData);
      }, (error) => {
        console.error("Error fetching notes:", error);
        toast({ title: "Error", description: "Could not fetch your notes.", variant: "destructive" });
      });
      return () => unsubscribe();
    } else {
      setNotes([]);
    }
  }, [user, toast]);
  
  const addNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | undefined> => {
    if (!user || !db) {
      toast({ title: "Not Logged In", description: "You must be logged in to create notes.", variant: "destructive" });
      return;
    }
    const notesCol = collection(db, 'users', user.uid, 'notes');
    const newNoteData = {
      ...noteData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const docRef = await addDoc(notesCol, newNoteData);
    
    // Track stat for badge
    trackStats({ notesSaved: 1 });

    return { id: docRef.id, ...newNoteData };
  }, [user, toast, trackStats]);

  const updateNote = useCallback(async (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note | undefined> => {
    if (!user || !db) return;
    const noteDocRef = doc(db, 'users', user.uid, 'notes', id);
    await updateDoc(noteDocRef, {
      ...noteData,
      updatedAt: Date.now(),
    });
    const updatedDoc = await getDoc(noteDocRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Note;
  }, [user]);

  const removeNote = useCallback(async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
  }, [user]);

  const getNoteById = useCallback(
    (id: string) => {
      return notes.find((note) => note.id === id);
    },
    [notes]
  );

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, removeNote, getNoteById }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = (): NotesContextType => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
