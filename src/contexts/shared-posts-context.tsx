
'use client';

import type { SharedPost, SavedQuestion } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from './user-context';

// MOCK DATA for initial state
const MOCK_SHARED_POSTS: SharedPost[] = [
    {
        id: 'mock_post_1',
        author: { username: 'priya_p', fullName: 'Priya Patel', avatarUrl: 'https://placehold.co/40x40.png' },
        message: 'Hey everyone, found these tricky questions on Life Processes. Hope they help!',
        questions: [
            { id: 'mq1', text: 'What is the role of acid in our stomach?', answer: 'It kills germs and activates pepsin.', questionType: 'short_answer', gradeLevel: '10', subject: 'Science', chapter: 'Life Processes', timestamp: Date.now() - 86400000 },
            { id: 'mq2', text: 'The exit of unabsorbed food material is regulated by the anal sphincter.', answer: 'True', options: ['True', 'False'], questionType: 'true_false', gradeLevel: '10', subject: 'Science', chapter: 'Life Processes', timestamp: Date.now() - 86400000 },
        ],
        timestamp: Date.now() - 86400000, // 1 day ago
    },
    {
        id: 'mock_post_2',
        author: { username: 'arjun_m', fullName: 'Arjun Mehta', avatarUrl: 'https://placehold.co/40x40.png' },
        message: 'Some good revision questions for The French Revolution.',
        questions: [
            { id: 'mq3', text: 'Who was the ruler of France during the revolution?', answer: 'Louis XVI', questionType: 'short_answer', gradeLevel: '9', subject: 'Social Science', chapter: 'The French Revolution', timestamp: Date.now() - 172800000 },
        ],
        timestamp: Date.now() - 172800000, // 2 days ago
    }
];
// END MOCK DATA

interface SharedPostsContextType {
  posts: SharedPost[];
  addPost: (postData: Omit<SharedPost, 'id' | 'timestamp' | 'author'>) => void;
}

const SharedPostsContext = createContext<SharedPostsContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'MGQsSharedPosts_v2'; // Version up for new author structure

export const SharedPostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<SharedPost[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        if (typeof window !== 'undefined') {
          try {
            const items = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            // Load mock data if local storage is empty
            setPosts(items ? JSON.parse(items) : MOCK_SHARED_POSTS);
          } catch (error) {
            console.error("Failed to load shared posts from localStorage:", error);
            setPosts(MOCK_SHARED_POSTS);
          }
          setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (isInitialized) {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
        }
    }, [posts, isInitialized]);

    const addPost = useCallback((postData: Omit<SharedPost, 'id' | 'timestamp' | 'author'>) => {
        if (!user) {
            console.error("Cannot add post: no user logged in.");
            return;
        }
        const newPost: SharedPost = {
            id: uuidv4(),
            timestamp: Date.now(),
            author: {
                username: user.username,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl
            },
            ...postData
        };
        setPosts(prev => [newPost, ...prev]);
    }, [user]);

    return (
        <SharedPostsContext.Provider value={{ posts, addPost }}>
            {children}
        </SharedPostsContext.Provider>
    );
}

export const useSharedPosts = (): SharedPostsContextType => {
    const context = useContext(SharedPostsContext);
    if (context === undefined) {
        throw new Error('useSharedPosts must be used within a SharedPostsProvider');
    }
    return context;
};
