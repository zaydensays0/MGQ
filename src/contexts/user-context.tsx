
'use client';

import type { User, BadgeKey, GradeLevelNCERT } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

const USER_DB_KEY = 'MGQsUserDatabase_v1';
const CURRENT_USER_SESSION_KEY = 'MGQsCurrentUserSession_v1';

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
type SignupData = Pick<User, 'fullName' | 'username' | 'avatarUrl'> & { email: string; password: string };
type LoginResult = { success: boolean; message: string };

interface UserContextType {
  user: User | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (data: SignupData) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (newUserData: Partial<User>) => void;
  handleCorrectAnswer: (baseXp: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Load database and session on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = window.localStorage.getItem(USER_DB_KEY);
        const userDb = storedUsers ? JSON.parse(storedUsers) : {};
        setUsers(userDb);

        const sessionUser = window.localStorage.getItem(CURRENT_USER_SESSION_KEY);
        if (sessionUser && userDb[sessionUser]) {
          setUser(userDb[sessionUser]);
        }
      } catch (error) {
        console.error("Failed to initialize user state from localStorage:", error);
      }
      setIsInitialized(true);
    }
  }, []);

  const saveUsersToDb = (updatedDb: Record<string, User>) => {
    setUsers(updatedDb);
    window.localStorage.setItem(USER_DB_KEY, JSON.stringify(updatedDb));
  };

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const foundUser = Object.values(users).find(u => u.email === email && u.password === password); // Simple check for prototype
    if (foundUser) {
      setUser(foundUser);
      window.localStorage.setItem(CURRENT_USER_SESSION_KEY, foundUser.username);
      return { success: true, message: 'Login successful.' };
    }
    return { success: false, message: 'Invalid email or password.' };
  }, [users]);

  const signup = useCallback(async (data: SignupData): Promise<LoginResult> => {
    if (users[data.username]) {
      return { success: false, message: 'Username is already taken.' };
    }
    if (Object.values(users).some(u => u.email === data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: User = {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      password: data.password, // Storing plain text for prototype ONLY. NEVER do this in production.
      avatarUrl: data.avatarUrl,
      xp: 0,
      level: 1,
      streak: 0,
      lastCorrectAnswerDate: '',
      badges: [],
    };

    const updatedDb = { ...users, [newUser.username]: newUser };
    saveUsersToDb(updatedDb);
    setUser(newUser);
    window.localStorage.setItem(CURRENT_USER_SESSION_KEY, newUser.username);

    return { success: true, message: 'Signup successful.' };
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  }, []);

  const updateUser = useCallback((newUserData: Partial<User>) => {
    if (!user) return;
    
    // Create the updated user object
    const updatedUser = { ...user, ...newUserData };
    
    // Update the state for the current user
    setUser(updatedUser);
    
    // Update the user's data in the "database"
    const updatedDb = { ...users, [user.username]: updatedUser };
    saveUsersToDb(updatedDb);
  }, [user, users]);

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
    <UserContext.Provider value={{ user, isInitialized, login, signup, logout, updateUser, handleCorrectAnswer }}>
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
