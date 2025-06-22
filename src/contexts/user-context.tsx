
'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Mock initial user data as a fallback
const MOCK_USER: User = {
  fullName: 'Mehdi Gokal',
  email: 'mehdi.gokal@example.com',
  username: 'mehdi_g',
  avatarUrl: 'https://placehold.co/100x100.png',
};

interface UserContextType {
  user: User;
  updateUser: (newUserData: Partial<User>) => void;
  isInitialized: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = 'MGQsUserData';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem(LOCAL_STORAGE_KEY_USER);
        setUser(storedUser ? JSON.parse(storedUser) : MOCK_USER);
      } catch (error) {
        console.error("Failed to load user data from localStorage:", error);
        setUser(MOCK_USER);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
      } catch (error) {
        console.error("Failed to save user data to localStorage:", error);
      }
    }
  }, [user, isInitialized]);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser((prevUser) => ({ ...prevUser, ...newUserData }));
  }, []);

  return (
    <UserContext.Provider value={{ user, updateUser, isInitialized }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
