
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NeetQuestion } from '@/types';
import { useToast } from './use-toast';

export const useStreamBookmarks = (streamKey: string) => {
  const [bookmarks, setBookmarks] = useState<NeetQuestion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedBookmarks = localStorage.getItem(streamKey);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error("Failed to load bookmarks from local storage", error);
      setBookmarks([]);
    }
  }, [streamKey]);

  const saveBookmarks = (newBookmarks: NeetQuestion[]) => {
    try {
      localStorage.setItem(streamKey, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error("Failed to save bookmarks to local storage", error);
      toast({ title: "Error", description: "Could not save bookmarks.", variant: "destructive" });
    }
  };

  const addBookmark = useCallback((question: NeetQuestion) => {
    let newBookmarks: NeetQuestion[] = [];
    setBookmarks(prev => {
      newBookmarks = [...prev, question];
      return newBookmarks;
    });
    saveBookmarks(newBookmarks);
    toast({ title: "Bookmarked!", description: "Question saved for this session." });
  }, [toast]);

  const removeBookmark = useCallback((questionText: string) => {
    let newBookmarks: NeetQuestion[] = [];
    setBookmarks(prev => {
      newBookmarks = prev.filter(q => q.text !== questionText);
      return newBookmarks;
    });
    saveBookmarks(newBookmarks);
    toast({ title: "Bookmark Removed", description: "Question removed from this session's bookmarks." });
  }, [toast]);

  const isBookmarked = useCallback((questionText: string) => {
    return bookmarks.some(q => q.text === questionText);
  }, [bookmarks]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
};
