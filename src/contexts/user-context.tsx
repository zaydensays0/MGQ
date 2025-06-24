
'use client';

import type { User, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

// --- Gamification Constants ---
const generateLevelThresholds = (maxLevel = 50) => {
    const thresholds = [0];
    let currentTotalXp = 0;
    let nextLevelIncrement = 500;
    for (let level = 2; level <= maxLevel; level++) {
        currentTotalXp += nextLevelIncrement;
        thresholds.push(currentTotalXp);
        nextLevelIncrement += (level > 2) ? 400 : 300;
    }
    return thresholds;
};

const LEVEL_THRESHOLDS = generateLevelThresholds();
const STREAK_BONUSES = [50, 70, 90, 110, 130, 150, 200];

// --- Gamification Helper Functions ---
const getLevelFromXp = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
};

export const getXpForLevel = (level: number): { currentLevelStart: number; nextLevelTarget: number } => {
    if (level < 1) level = 1;
    const currentLevelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextLevelTarget = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2400);
    return { currentLevelStart, nextLevelTarget };
};

// --- Context Types ---
interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isInitialized: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT) => Promise<void>;
  logout: () => Promise<void>;
  handleCorrectAnswer: (baseXp: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (uid: string) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setUser(userDoc.data() as User);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsInitialized(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchUserData(fbUser.uid);
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    await signInWithEmailAndPassword(auth, email, pass);
    toast({ title: 'Logged In Successfully', description: "Welcome back!" });
  };

  const signup = async (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT) => {
    if (!auth || !db) throw new Error("Firebase is not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { uid } = userCredential.user;

    const newUser: User = {
      uid,
      fullName,
      email,
      username: email.split('@')[0],
      avatarUrl: `https://placehold.co/100x100.png?text=${fullName.charAt(0).toUpperCase()}`,
      xp: 0,
      level: 1,
      streak: 0,
      lastCorrectAnswerDate: '',
      badges: [],
      class: userClass,
    };
    
    await setDoc(doc(db, 'users', uid), newUser);
    setUser(newUser);
    toast({ title: 'Account Created!', description: 'Welcome! You have been logged in.' });
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase is not configured.");
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const handleCorrectAnswer = useCallback(async (baseXp: number) => {
    if (!user || !firebaseUser || !db) return;
    
    let xpGained = baseXp;
    let newStreak = user.streak;
    const newBadges = [...(user.badges || [])];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastAnswerDate = user.lastCorrectAnswerDate ? parseISO(user.lastCorrectAnswerDate) : null;
    
    let isFirstAnswerToday = true;
    if (lastAnswerDate) {
        isFirstAnswerToday = format(lastAnswerDate, 'yyyy-MM-dd') !== todayStr;
    }

    if (isFirstAnswerToday) {
      if (lastAnswerDate && differenceInCalendarDays(today, lastAnswerDate) === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      const streakIndex = newStreak - 1;
      const streakBonus = STREAK_BONUSES[Math.min(streakIndex, STREAK_BONUSES.length - 1)];
      xpGained += streakBonus;

      if (newStreak === 7 && !newBadges.includes('streak_master')) {
        newBadges.push('streak_master');
        toast({ title: 'Badge Unlocked! 🏆', description: 'You earned the "Streak Master" badge for a 7-day streak!' });
      }
    }

    const newXp = user.xp + xpGained;
    const oldLevel = user.level;
    const newLevel = getLevelFromXp(newXp);
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, {
        xp: increment(xpGained),
        level: newLevel,
        streak: newStreak,
        badges: newBadges,
        lastCorrectAnswerDate: todayStr,
    });
    
    // Optimistically update local state
    setUser(prev => prev ? {...prev, xp: newXp, level: newLevel, streak: newStreak, badges: newBadges, lastCorrectAnswerDate: todayStr} : null);

    if (newLevel > oldLevel) {
      toast({ title: '🎉 Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
    } else {
      toast({ title: `+${xpGained.toLocaleString()} XP!`, description: 'Keep up the great work!' });
    }
  }, [user, firebaseUser, toast]);

  return (
    <UserContext.Provider value={{ user, firebaseUser, isInitialized, login, signup, logout, handleCorrectAnswer }}>
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
