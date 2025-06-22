
'use client';

import type { User, BadgeKey } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

const USER_DATA_KEY = 'MGQsUserData';

const MOCK_INITIAL_USER: User = {
  fullName: 'Mehdi',
  email: 'mehdi@example.com',
  username: 'realmehdi',
  password: 'password123',
  avatarUrl: 'https://placehold.co/100x100.png',
  xp: 0,
  level: 1,
  streak: 0,
  lastCorrectAnswerDate: '', // Initialize as empty
  badges: [],
};

// --- Gamification Constants ---
// XP needed to *reach* the next level. Index corresponds to the level you are trying to reach.
// e.g., to reach level 2, you need 10 total XP.
const LEVEL_THRESHOLDS = [
    0, // Level 1 starts at 0
    10, // Reach Lvl 2
    25, // Reach Lvl 3
    45, // Reach Lvl 4
    70, // Reach Lvl 5
    100, // Reach Lvl 6
    135, // ... and so on
    175,
    220,
    270,
    325,
];

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
    const currentLevelStart = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelTarget = LEVEL_THRESHOLDS[level] || (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 50); // Fallback for max level
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
          setUser(JSON.parse(storedUser));
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

    let xpGained = 3; // Base XP for correct answer
    let newStreak = user.streak;
    let newBadges = [...user.badges];
    let justLeveledUp = false;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastAnswerDate = user.lastCorrectAnswerDate ? parseISO(user.lastCorrectAnswerDate) : null;
    const isFirstAnswerToday = !lastAnswerDate || !format(lastAnswerDate, 'yyyy-MM-dd').includes(todayStr);

    if (isFirstAnswerToday) {
        xpGained += 1; // Daily login bonus

        if (lastAnswerDate && differenceInCalendarDays(today, lastAnswerDate) === 1) {
            newStreak += 1; // Continue streak
        } else {
            newStreak = 1; // Start a new streak
        }
        
        // Streak bonuses
        if (newStreak === 1) xpGained += 2;
        if (newStreak === 3) {
            xpGained += 5;
            if (!newBadges.includes('mini_streak')) {
                newBadges.push('mini_streak');
                toast({ title: 'Badge Unlocked!', description: 'You earned the "Mini Streak" badge! 🔥' });
            }
        }
        if (newStreak === 7) {
            xpGained += 10;
            if (!newBadges.includes('consistent_learner')) {
                newBadges.push('consistent_learner');
                toast({ title: 'Badge Unlocked!', description: 'You earned the "Consistent Learner" badge! 🌟' });
            }
        }
    }

    const newXp = user.xp + xpGained;
    const newLevel = getLevelFromXp(newXp);

    if (newLevel > user.level) {
        justLeveledUp = true;
        toast({
            title: '🎉 Level Up!',
            description: `Congratulations, you've reached Level ${newLevel}!`,
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
    
    // Final toast with summary
    if (!justLeveledUp) {
        const { nextLevelTarget } = getXpForLevel(newLevel);
        const xpToGo = nextLevelTarget - newXp;
        let description = `You're now at ${newXp} XP.`;
        if (xpToGo > 0) {
            description += ` Only ${xpToGo} XP to go for Level ${newLevel + 1}!`;
        }
        toast({
            title: `+${xpGained} XP! Keep it up!`,
            description: description,
        });
    }


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
