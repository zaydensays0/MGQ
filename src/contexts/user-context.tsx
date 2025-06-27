
'use client';

import type { User, GradeLevelNCERT, Gender } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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
  isGuest: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT, gender: Gender) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  handleCorrectAnswer: (baseXp: number) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changeUserPassword: (currentPass: string, newPass: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
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
        setIsGuest(false);
        await fetchUserData(fbUser.uid);
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setFirebaseUser(null);
    toast({ title: "Welcome, Guest!", description: "You can now explore and generate questions." });
  };
  
  const login = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    await signInWithEmailAndPassword(auth, email, pass);
    setIsGuest(false);
    new Audio('/sounds/login-success.mp3').play().catch(e => console.error("Error playing sound:", e));
    toast({ title: 'Logged In Successfully', description: "Welcome back!" });
  };

  const signup = async (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT, gender: Gender) => {
    if (!auth || !db) throw new Error("Firebase is not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { uid } = userCredential.user;

    const newUser: User = {
      uid,
      fullName,
      email,
      avatarUrl: `https://placehold.co/100x100.png?text=${fullName.charAt(0).toUpperCase()}`,
      xp: 0,
      level: 1,
      streak: 0,
      lastCorrectAnswerDate: '',
      badges: [],
      class: userClass,
      gender,
    };
    
    await setDoc(doc(db, 'users', uid), newUser);
    setUser(newUser);
    setIsGuest(false);
    toast({ title: 'Account Created!', description: 'Welcome! You have been logged in.' });
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase is not configured.");
    if (!isGuest && firebaseUser) {
      await signOut(auth);
    }
    setUser(null);
    setFirebaseUser(null);
    setIsGuest(false);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };
  
  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!firebaseUser || !db) {
      toast({ title: "Update Failed", description: "Not logged in or database unavailable.", variant: "destructive" });
      throw new Error("User not authenticated");
    }
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      await updateDoc(userDocRef, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ title: "Update Failed", description: "Could not save your changes.", variant: "destructive" });
      throw error;
    }
  }, [firebaseUser, toast]);

  const handleCorrectAnswer = useCallback(async (baseXp: number) => {
    if (!user || !firebaseUser || !db || isGuest) return;
    
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
    
    const updates: Partial<User> = {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        badges: newBadges,
        lastCorrectAnswerDate: todayStr,
    };
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, {
        xp: increment(xpGained), // Use increment for atomicity
        level: newLevel,
        streak: newStreak,
        badges: newBadges,
        lastCorrectAnswerDate: todayStr,
    });
    
    // Optimistically update local state
    setUser(prev => prev ? {...prev, ...updates} : null);

    if (newLevel > oldLevel) {
      toast({ title: '🎉 Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
    } else {
      toast({ title: `+${xpGained.toLocaleString()} XP!`, description: 'Keep up the great work!' });
    }
  }, [user, firebaseUser, toast, isGuest]);

  const sendPasswordReset = async (email: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Please check your inbox to reset your password.' });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({ title: 'Error', description: error.message || 'Failed to send password reset email.', variant: 'destructive' });
      throw error;
    }
  };

  const changeUserPassword = async (currentPass: string, newPass: string) => {
    if (!auth || !firebaseUser || !firebaseUser.email) {
      throw new Error("User not properly authenticated.");
    }
    
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPass);
      toast({ title: 'Password Changed!', description: 'Your password has been updated successfully.' });
    } catch (error: any) {
      console.error("Error changing password:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/wrong-password') {
        description = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        description = 'The new password is too weak. It must be at least 6 characters long.';
      }
      toast({ title: 'Password Change Failed', description, variant: 'destructive' });
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, firebaseUser, isInitialized, isGuest, login, signup, logout, continueAsGuest, handleCorrectAnswer, updateUserProfile, sendPasswordReset, changeUserPassword }}>
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
