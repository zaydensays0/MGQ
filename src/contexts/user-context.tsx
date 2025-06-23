'use client';

import type { User, BadgeKey, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

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
  isInitialized: boolean;
  updateUser: (newUserData: Partial<User>) => void;
  handleCorrectAnswer: (baseXp: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
const LOCAL_STORAGE_KEY_USER = 'MGQsUser';

const defaultUser: User = {
  fullName: 'Student User',
  username: 'student',
  email: 'student@example.com',
  avatarUrl: `https://placehold.co/100x100.png?text=S`,
  xp: 0,
  level: 1,
  streak: 0,
  lastCorrectAnswerDate: '',
  badges: [],
  class: '10',
};


export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem(LOCAL_STORAGE_KEY_USER);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(defaultUser);
        }
      } catch (error) {
        console.error("Failed to access localStorage, using default user:", error);
        setUser(defaultUser);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && user) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    }
  }, [user, isInitialized]);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    setUser(prevUser => {
      const updatedUser = prevUser ? { ...prevUser, ...newUserData } : null;
      return updatedUser;
    });
  }, []);

  const handleCorrectAnswer = useCallback((baseXp: number) => {
    if (!user) return;
    let xpGained = baseXp;
    let newStreak = user.streak;
    const newBadges = [...(user.badges || [])];

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastAnswerDate = user.lastCorrectAnswerDate ? parseISO(user.lastCorrectAnswerDate) : null;
    
    let isFirstAnswerToday = true;
    if(lastAnswerDate) {
        const lastDateStr = format(lastAnswerDate, 'yyyy-MM-dd');
        isFirstAnswerToday = lastDateStr !== todayStr;
    }

    if (isFirstAnswerToday) {
      if (lastAnswerDate && differenceInCalendarDays(today, lastAnswerDate) === 1) {
        newStreak += 1; // Continue streak
      } else {
        newStreak = 1; // Start or reset streak
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

    if (newLevel > oldLevel) {
      toast({ title: '🎉 Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
    } else {
        toast({ title: `+${xpGained.toLocaleString()} XP!`, description: 'Keep up the great work!' });
    }
    
    updateUser({
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        badges: newBadges,
        lastCorrectAnswerDate: todayStr,
    });
  }, [user, toast, updateUser]);

  return (
    <UserContext.Provider value={{ user, isInitialized, updateUser, handleCorrectAnswer }}>
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
