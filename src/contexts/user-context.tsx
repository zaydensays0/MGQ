'use client';

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// For this prototype, we'll store a list of users in localStorage.
// In a real app, this would be handled by a backend server and database.
const USER_DB_KEY = 'MGQsUserDatabase';
const CURRENT_USER_KEY = 'MGQsCurrentUserEmail';

// Mock initial user data for the first-ever user
const MOCK_INITIAL_USER: User = {
  fullName: 'Mehdi',
  email: 'mehdi@example.com',
  username: 'realmehdi',
  password: 'password123', // INSECURE: For prototype only
  avatarUrl: 'https://placehold.co/100x100.png',
};

interface AuthResult {
    success: boolean;
    message: string;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (userData: Omit<User, 'password'> & { password?: string }) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (newUserData: Partial<User>) => void;
  isInitialized: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDatabase, setUserDatabase] = useState<User[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const db = window.localStorage.getItem(USER_DB_KEY);
        let users: User[] = db ? JSON.parse(db) : [];
        
        // If the database is empty, seed it with the mock user
        if (users.length === 0) {
            users.push(MOCK_INITIAL_USER);
        }
        setUserDatabase(users);

        const currentUserEmail = window.localStorage.getItem(CURRENT_USER_KEY);
        if (currentUserEmail) {
          const loggedInUser = users.find(u => u.email === currentUserEmail);
          setUser(loggedInUser || null);
        }
      } catch (error) {
        console.error("Failed to load user data from localStorage:", error);
        // On error, start fresh
        setUserDatabase([MOCK_INITIAL_USER]);
        setUser(null);
      }
      setIsInitialized(true);
    }
  }, []);

  // Persist user database changes to localStorage
  useEffect(() => {
    if (isInitialized) {
      window.localStorage.setItem(USER_DB_KEY, JSON.stringify(userDatabase));
    }
  }, [userDatabase, isInitialized]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const userToLogin = userDatabase.find(u => u.email === email);
    if (!userToLogin) {
      return { success: false, message: 'No account found with that email.' };
    }
    if (userToLogin.password !== password) { // Plain text check for prototype
      return { success: false, message: 'Incorrect password.' };
    }
    setUser(userToLogin);
    window.localStorage.setItem(CURRENT_USER_KEY, email);
    return { success: true, message: 'Logged in successfully!' };
  }, [userDatabase]);

  const signup = useCallback(async (userData: Omit<User, 'password'> & { password?: string }): Promise<AuthResult> => {
    if (!userData.password) {
        return { success: false, message: 'Password is required for signup.' };
    }

    if (userDatabase.some(u => u.email === userData.email)) {
        return { success: false, message: 'An account with this email already exists.' };
    }
    if (userDatabase.some(u => u.username === userData.username)) {
        return { success: false, message: 'This username is already taken.' };
    }

    const newUser: User = { ...userData, password: userData.password };
    setUserDatabase(prev => [...prev, newUser]);
    
    // Automatically log in after successful signup
    return login(newUser.email, newUser.password);
  }, [userDatabase, login]);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    if (!user) return;

    setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...newUserData };
        
        // Also update the master user database
        setUserDatabase(prevDb => prevDb.map(u => u.email === updatedUser.email ? updatedUser : u));

        return updatedUser;
    });
  }, [user]);

  return (
    <UserContext.Provider value={{ user, login, signup, logout, updateUser, isInitialized }}>
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
