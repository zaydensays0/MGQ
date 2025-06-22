
'use client';

import type { User, BadgeKey, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

const USER_DATA_KEY = 'MGQsUserData';

const MOCK_INITIAL_USER: User = {
  fullName: 'Mehdi',
  username: 'realmehdi',
  avatarUrl: 'https://placehold.co/100x100.png',
  xp: 0,
  level: 1,
  streak: 0,
  lastCorrectAnswerDate: '', // Initialize as empty
  badges: [],
  class: undefined, // User needs to set their class
};

// --- Gamification Constants ---

// Generate level thresholds based on the new system
// Levels require progressively more XP: 500, 800, 1200, 1600, etc.
const generateLevelThresholds = (maxLevel = 50) => {
  const thresholds = [0]; // XP for level 1 is 0. Reaching level 2 requires 500 total XP.
  let currentTotalXp = 0;
  let nextLevelIncrement = 500;
  for (let level = 2; level <= maxLevel; level++) {
    currentTotalXp += nextLevelIncrement;
    thresholds.push(currentTotalXp);
    
    // The amount of XP needed for the *next* level increases
    if (level === 2) {
      nextLevelIncrement = 800; // XP needed to get from Lvl 2 to 3
    } else {
      nextLevelIncrement += 400; // Increment increases by 400 for subsequent levels
    }
  }
  return thresholds;
};

const LEVEL_THRESHOLDS = generateLevelThresholds();
const STREAK_BONUSES = [50, 70, 90, 110, 130, 150, 200]; // XP bonus for day 1 through 7


// --- Gamification Helper Functions ---
const getLevelFromXp = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
};

export const getXpForLevel = (level: number): { currentLevelStart: number; nextLevelTarget: number } => {
    if (level < 1) level = 1;
    const currentLevelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextLevelTarget = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2400); // Fallback for max level
    return { currentLevelStart, nextLevelTarget };
}


interface UserContextType {
  user: User | null;
  updateUser: (newUserData: Partial<User>) => void;
  isInitialized: boolean;
  handleCorrectAnswer: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = window.localStorage.getItem(USER_DATA_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Ensure badges is an array to prevent errors with old data structures
          if (!Array.isArray(parsedUser.badges)) {
            parsedUser.badges = [];
          }
          setUser(parsedUser);
        } else {
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
  
  const saveUser = (updatedUser: User) => {
    setUser(updatedUser);
    window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
  }

  const updateUser = useCallback((newUserData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...newUserData };
    saveUser(updatedUser);
  }, [user]);

  const handleCorrectAnswer = useCallback(() => {
    if (!user) return;

    let xpGained = 100; // Base XP for correct answer
    let newStreak = user.streak;
    let newBadges = [...(user.badges || [])];

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastAnswerDate = user.lastCorrectAnswerDate ? parseISO(user.lastCorrectAnswerDate) : null;
    const isFirstAnswerToday = !lastAnswerDate || !format(lastAnswerDate, 'yyyy-MM-dd').includes(todayStr);

    if (isFirstAnswerToday) {
        if (lastAnswerDate && differenceInCalendarDays(today, lastAnswerDate) === 1) {
            newStreak += 1; // Continue streak
        } else {
            newStreak = 1; // Start or reset streak
        }
        
        // Add streak bonus
        const streakIndex = newStreak - 1;
        if (streakIndex < STREAK_BONUSES.length) {
            xpGained += STREAK_BONUSES[streakIndex];
        } else { // For streaks longer than 7 days, use the 7-day bonus
            xpGained += STREAK_BONUSES[STREAK_BONUSES.length - 1];
        }

        // Award badge on day 7
        if (newStreak === 7 && !newBadges.includes('streak_master')) {
            newBadges.push('streak_master');
            toast({ title: 'Badge Unlocked! 🏆', description: 'You earned the "Streak Master" badge for a 7-day streak!' });
        }
    }

    const newXp = user.xp + xpGained;
    const oldLevel = user.level;
    const newLevel = getLevelFromXp(newXp);

    if (newLevel > oldLevel) {
        toast({
            title: '🎉 Level Up!',
            description: `Congratulations, you've reached Level ${newLevel}!`,
        });
    } else {
        const { nextLevelTarget } = getXpForLevel(newLevel);
        const xpToGo = nextLevelTarget - newXp;
        let description = `You're now at ${newXp.toLocaleString()} XP.`;
        if (xpToGo > 0) {
            description += ` Just ${xpToGo.toLocaleString()} XP to go for Level ${newLevel + 1}!`;
        }
        toast({
            title: `+${xpGained.toLocaleString()} XP! Keep it up!`,
            description: description,
        });
    }

    const updatedUser: User = {
        ...user,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        badges: newBadges,
        lastCorrectAnswerDate: todayStr,
    };
    
    saveUser(updatedUser);

  }, [user, toast]);

  return (
    <UserContext.Provider value={{ user, updateUser, isInitialized, handleCorrectAnswer }}>
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
