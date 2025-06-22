
'use client';

import type { User, BadgeKey, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';


const USER_KEY = 'MGQsUser_v3_single'; // Use a new key for the single user model

// A default user for the prototype experience
const DEFAULT_USER: User = {
    fullName: "Alex Doe",
    username: "alex_d", // Internal ID, not for display or editing by user
    email: "alex.doe@example.com",
    avatarUrl: "https://placehold.co/100x100.png",
    xp: 1200,
    level: 2,
    streak: 1,
    lastCorrectAnswerDate: format(new Date(), 'yyyy-MM-dd'),
    badges: [],
    class: '10',
};

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
  logout: () => void;
  updateUser: (newUserData: Partial<User>) => void;
  handleCorrectAnswer: (baseXp: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Load user on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem(USER_KEY);
        setUser(storedUser ? JSON.parse(storedUser) : DEFAULT_USER);
      } catch (error) {
        console.error("Failed to initialize user state from localStorage:", error);
        setUser(DEFAULT_USER);
      }
      setIsInitialized(true);
    }
  }, []);

  const saveUserToDb = (updatedUser: User) => {
    setUser(updatedUser);
    window.localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const logout = useCallback(() => {
    // In a single user prototype, logout can reset to the default state
    window.localStorage.removeItem(USER_KEY);
    setUser(DEFAULT_USER); 
    window.location.reload(); // Force a refresh to reset all component states
  }, []);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    if (!user) return;
    
    // Prevent username from being changed, as it's an internal ID
    if (newUserData.username && newUserData.username !== user.username) {
        delete newUserData.username;
        console.warn("Attempted to change username. This is not allowed.");
    }

    const updatedUser = { ...user, ...newUserData };
    saveUserToDb(updatedUser);
  }, [user]);

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
    <UserContext.Provider value={{ user, isInitialized, logout, updateUser, handleCorrectAnswer }}>
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
