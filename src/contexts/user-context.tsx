
'use client';

import type { User, GradeLevelNCERT, Gender, UserStats, BadgeKey, StreamId, WrongQuestion } from '@/types';
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
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { BADGE_DEFINITIONS } from '@/lib/constants';

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
  wrongQuestions: WrongQuestion[];
  isInitialized: boolean;
  isGuest: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT, gender: Gender, stream?: StreamId) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  handleCorrectAnswer: (baseXp: number) => void;
  trackStats: (statsToUpdate: Partial<UserStats & { accuracy: number; isFirstTest: boolean }>) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  claimBadge: (badgeKey: BadgeKey) => Promise<void>;
  equipBadge: (badgeKey: BadgeKey | null) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changeUserPassword: (currentPass: string, newPass: string) => Promise<void>;
  addWrongQuestion: (questionData: Omit<WrongQuestion, 'id' | 'attemptedAt'>) => Promise<void>;
  removeWrongQuestion: (id: string) => Promise<void>;
  clearAllWrongQuestions: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const getDefaultUserStats = (): UserStats => ({
    questionsGenerated: 0,
    mockTestsCompleted: 0,
    perfectMockTests: 0,
    notesSaved: 0,
    grammarQuestionsCompleted: 0,
    highAccuracyMockTests: 0,
    lowScoreStreak: 0,
    mockTestsToday: 0,
    lastMockTestDate: '',
});

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const checkAndAwardBadges = useCallback(async (userObject: User): Promise<User> => {
    if (!firebaseUser || !db || !userObject) return userObject;

    let newlyUnlockableBadges: BadgeKey[] = [];
    const currentlyClaimable = userObject.unclaimedBadges || [];
    const alreadyClaimed = userObject.badges || [];

    for (const key in BADGE_DEFINITIONS) {
        const badgeKey = key as BadgeKey;
        if (currentlyClaimable.includes(badgeKey) || alreadyClaimed.includes(badgeKey)) continue;

        const badge = BADGE_DEFINITIONS[badgeKey];
        let conditionMet = false;
        const statName = badge.stat;
        
        if (statName === 'xp') {
            if (userObject.xp >= badge.goal) conditionMet = true;
        } else if (statName === 'streak') {
            if (userObject.streak >= badge.goal) conditionMet = true;
        } else if (statName === 'badges') {
            if (userObject.badges.length >= badge.goal) conditionMet = true;
        } else if (userObject.stats && statName in userObject.stats) {
            const userStatValue = userObject.stats[statName as keyof UserStats];
            if (userStatValue >= badge.goal) {
                // Special handling for situational badges
                if (badgeKey === 'quick_starter') {
                    const twentyFourHours = 24 * 60 * 60 * 1000;
                    if ((Date.now() - userObject.createdAt) < twentyFourHours) {
                        conditionMet = true;
                    }
                } else {
                    conditionMet = true;
                }
            }
        }
        
        if (conditionMet) {
            newlyUnlockableBadges.push(badgeKey);
        }
    }

    if (newlyUnlockableBadges.length > 0) {
      const allUnclaimed = [...currentlyClaimable, ...newlyUnlockableBadges];
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { unclaimedBadges: allUnclaimed });
      
      newlyUnlockableBadges.forEach(badgeKey => {
        const badge = BADGE_DEFINITIONS[badgeKey];
        toast({ title: '🌟 New Badge Available!', description: `You can now collect the "${badge.name}" badge!` });
      });

      return { ...userObject, unclaimedBadges: allUnclaimed };
    }

    return userObject;
  }, [firebaseUser, db, toast]);
  
  const fetchUserData = useCallback(async (uid: string, fbUser: FirebaseUser) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const data = userDoc.data();
        const userWithDefaults: User = {
            ...data,
            lastActivityTimestamp: data.lastActivityTimestamp || (data.lastCorrectAnswerDate ? new Date(data.lastCorrectAnswerDate).getTime() : 0),
            stats: { ...getDefaultUserStats(), ...(data.stats || {}) },
            unclaimedBadges: data.unclaimedBadges || [],
            badges: data.badges || [],
            equippedBadge: data.equippedBadge || null,
            createdAt: data.createdAt || Date.now(),
        } as User;
        
        const finalUser = await checkAndAwardBadges(userWithDefaults);
        setUser(finalUser);
    }
  }, [checkAndAwardBadges]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsInitialized(true);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsGuest(false);
        await fetchUserData(fbUser.uid, fbUser);
      } else {
        setUser(null);
        setWrongQuestions([]); // Clear wrong questions on logout
      }
      setIsInitialized(true);
    });

    return () => unsubscribeAuth();
  }, [fetchUserData]);

  // Listener for wrong questions
  useEffect(() => {
      if (user && db) {
          const q = query(collection(db, 'users', user.uid, 'wrongQuestions'),);
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const userWrongQuestions: WrongQuestion[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WrongQuestion));
              setWrongQuestions(userWrongQuestions);
          }, (error) => {
              console.error("Error fetching wrong questions:", error);
              toast({ title: "Error", description: "Could not fetch your list of wrong questions.", variant: "destructive" });
          });
          return () => unsubscribe();
      }
  }, [user, db, toast]);


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

  const signup = async (fullName: string, email: string, pass: string, userClass: GradeLevelNCERT, gender: Gender, stream?: StreamId) => {
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
      lastActivityTimestamp: 0,
      unclaimedBadges: [],
      badges: ['welcome_rookie'],
      class: userClass,
      gender,
      stream,
      stats: getDefaultUserStats(),
      equippedBadge: null,
      createdAt: Date.now(),
    };
    
    await setDoc(doc(db, 'users', uid), newUser);
    setUser(newUser);
    setIsGuest(false);
    toast({ title: 'Account Created!', description: 'Welcome! You have been logged in.' });
    toast({ title: '🏆 Badge Unlocked!', description: 'You earned the "Welcome Rookie" badge!' });
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
  
  const claimBadge = useCallback(async (badgeKey: BadgeKey) => {
    if (!user || !firebaseUser || !db || isGuest) {
        toast({ title: "Action Failed", description: "You must be logged in to collect badges.", variant: "destructive" });
        return;
    }

    const updatedUnclaimed = user.unclaimedBadges.filter(b => b !== badgeKey);
    const updatedClaimed = [...user.badges, badgeKey];

    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, {
            unclaimedBadges: updatedUnclaimed,
            badges: updatedClaimed
        });

        setUser(prev => prev ? { ...prev, unclaimedBadges: updatedUnclaimed, badges: updatedClaimed } : null);
        
        const badge = BADGE_DEFINITIONS[badgeKey];
        toast({ title: "🏆 Badge Collected!", description: `You have collected the "${badge.name}" badge!` });
    } catch (error) {
        console.error("Error claiming badge:", error);
        toast({ title: "Collection Failed", description: "Could not collect the badge. Please try again.", variant: "destructive"});
    }
  }, [user, firebaseUser, isGuest, db, toast]);

  const equipBadge = useCallback(async (badgeKey: BadgeKey | null) => {
    if (!user || !firebaseUser || !db || isGuest) {
      toast({ title: "Action Failed", description: "You must be logged in to equip badges.", variant: "destructive" });
      return;
    }

    try {
      await updateUserProfile({ equippedBadge: badgeKey });
      toast({ title: "Badge Equipped!", description: "Your new badge is now visible on the leaderboard." });
    } catch (error) {
      // Error toast handled in updateUserProfile
    }
  }, [user, firebaseUser, isGuest, updateUserProfile, toast]);

  const trackStats = useCallback(async (statsToUpdate: Partial<UserStats & { accuracy: number; isFirstTest: boolean }>) => {
    if (!user || !firebaseUser || !db || isGuest) return;

    const { accuracy, isFirstTest, ...statsToIncrement } = statsToUpdate;
    const increments: { [key: string]: any } = {};
    const newStats: UserStats = { ...user.stats };

    for (const key in statsToIncrement) {
      const statKey = key as keyof UserStats;
      const value = statsToIncrement[statKey]!;
      increments[`stats.${statKey}`] = increment(value);
      newStats[statKey] += value;
    }
    
    // Handle complex badge logic
    if (accuracy !== undefined) {
        // Accuracy Ace
        if (accuracy >= 0.9) {
            increments['stats.highAccuracyMockTests'] = increment(1);
            newStats.highAccuracyMockTests++;
        }
        // Comeback Kid
        if (accuracy < 0.6) {
            increments['stats.lowScoreStreak'] = increment(1);
            newStats.lowScoreStreak++;
        } else {
            if (user.stats.lowScoreStreak >= 2 && !user.badges.includes('comeback_kid')) {
                // Award comeback_kid, no increment needed as we just need to check this condition
            }
            increments['stats.lowScoreStreak'] = 0; // Reset on a good score
            newStats.lowScoreStreak = 0;
        }
    }
    // Silent Slayer
    if (statsToIncrement.mockTestsCompleted) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (user.stats.lastMockTestDate === todayStr) {
            increments['stats.mockTestsToday'] = increment(1);
            newStats.mockTestsToday++;
        } else {
            increments['stats.mockTestsToday'] = 1;
            increments['stats.lastMockTestDate'] = todayStr;
            newStats.mockTestsToday = 1;
            newStats.lastMockTestDate = todayStr;
        }
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    if (Object.keys(increments).length > 0) {
        await updateDoc(userDocRef, increments);
    }

    let updatedUser = { ...user, stats: newStats };
    updatedUser = await checkAndAwardBadges(updatedUser);
    setUser(updatedUser);
  }, [user, firebaseUser, isGuest, db, checkAndAwardBadges]);

  const handleCorrectAnswer = useCallback(async (baseXp: number) => {
    if (!user || !firebaseUser || !db || isGuest) return;
    
    let xpGained = baseXp;
    let newStreak = user.streak;
    const today = new Date();
    const lastAnswerDate = user.lastActivityTimestamp ? new Date(user.lastActivityTimestamp) : null;
    
    let isFirstAnswerToday = true;
    if (lastAnswerDate) {
        isFirstAnswerToday = differenceInCalendarDays(today, lastAnswerDate) >= 1;
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
    }

    const newXp = user.xp + xpGained;
    const oldLevel = user.level;
    const newLevel = getLevelFromXp(newXp);
    
    const updates = { xp: newXp, level: newLevel, streak: newStreak, lastActivityTimestamp: Date.now() };
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, {
        xp: increment(xpGained),
        level: newLevel,
        streak: newStreak,
        lastActivityTimestamp: Date.now(),
    });
    
    let updatedUser = { ...user, ...updates };
    updatedUser = await checkAndAwardBadges(updatedUser);
    setUser(updatedUser);

    if (newLevel > oldLevel) {
      toast({ title: '🎉 Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
    } else {
      toast({ title: `+${xpGained.toLocaleString()} XP!`, description: 'Keep up the great work!' });
    }
  }, [user, firebaseUser, toast, isGuest, db, checkAndAwardBadges]);

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

  const addWrongQuestion = useCallback(async (questionData: Omit<WrongQuestion, 'id' | 'attemptedAt'>) => {
    if (!user || !db || isGuest) return;
    const wrongQuestionsCol = collection(db, 'users', user.uid, 'wrongQuestions');
    const dataToSave = { ...questionData, attemptedAt: Date.now() };
    await addDoc(wrongQuestionsCol, dataToSave);
  }, [user, isGuest, db]);

  const removeWrongQuestion = useCallback(async (id: string) => {
    if (!user || !db || isGuest) return;
    const questionDocRef = doc(db, 'users', user.uid, 'wrongQuestions', id);
    await deleteDoc(questionDocRef);
  }, [user, isGuest, db]);

  const clearAllWrongQuestions = useCallback(async () => {
    if (!user || !db || isGuest) return;
    const wrongQuestionsCol = collection(db, 'users', user.uid, 'wrongQuestions');
    const snapshot = await getDocs(wrongQuestionsCol);

    if (snapshot.empty) {
      toast({ title: "Nothing to clear!", description: "Your revision list is already empty." });
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    toast({ title: "List Cleared!", description: "Your 'Recently Wrong Questions' list has been reset." });
  }, [user, isGuest, db, toast]);

  return (
    <UserContext.Provider value={{ user, firebaseUser, wrongQuestions, isInitialized, isGuest, login, signup, logout, continueAsGuest, handleCorrectAnswer, trackStats, updateUserProfile, claimBadge, equipBadge, sendPasswordReset, changeUserPassword, addWrongQuestion, removeWrongQuestion, clearAllWrongQuestions }}>
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
