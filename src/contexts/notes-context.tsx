
'use client';

import type { Note } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface NotesContextType {
  notes: Note[];
  addNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>) => Note | undefined;
  removeNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_NOTES = 'MGQsNotes';

export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
        if (items) {
          setNotes(JSON.parse(items));
        }
      } catch (error) {
        console.error("Failed to load notes from localStorage:", error);
        setNotes([]);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notes));
      } catch (error) {
        console.error("Failed to save notes to localStorage:", error);
      }
    }
  }, [notes, isInitialized]);

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...noteData,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Note | undefined => {
    let updatedNote: Note | undefined;
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === id) {
          updatedNote = { ...note, ...noteData, updatedAt: Date.now() };
          return updatedNote;
        }
        return note;
      })
    );
    return updatedNote;
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  }, []);

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
