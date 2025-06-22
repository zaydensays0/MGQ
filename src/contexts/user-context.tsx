'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// For this prototype, we'll store a SINGLE user object in localStorage.
// This simplifies the system back to a single-user experience without login/signup.
const USER_DATA_KEY = 'MGQsUserData';

const MOCK_INITIAL_USER: User = {
  fullName: 'Mehdi',
  email: 'mehdi@example.com',
  username: 'realmehdi',
  password: 'password123', // INSECURE: For prototype only, used for mock password change.
  avatarUrl: 'https://placehold.co/100x100.png',
};

interface UserContextType {
  user: User | null;
  updateUser: (newUserData: Partial<User>) => void;
  isInitialized: boolean;
  // Login, signup, and logout have been removed.
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize user from localStorage, or use mock data if none exists.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem(USER_DATA_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no user is in localStorage, initialize with the mock user.
          setUser(MOCK_INITIAL_USER);
          window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(MOCK_INITIAL_USER));
        }
      } catch (error) {
        console.error("Failed to load user data from localStorage:", error);
        setUser(MOCK_INITIAL_USER);
      }
      setIsInitialized(true);
    }
  }, []);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...newUserData };
        // Persist the updated user data to localStorage.
        window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    });
  }, []);

  // Login, signup, and logout functionality has been removed.

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
