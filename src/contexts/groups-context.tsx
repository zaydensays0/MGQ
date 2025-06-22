'use client';

import type { UserGroup } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface GroupsContextType {
  groups: UserGroup[];
  addGroup: (groupData: Omit<UserGroup, 'id' | 'createdAt'>) => UserGroup;
  updateGroup: (id: string, groupData: Partial<Omit<UserGroup, 'id' | 'createdAt'>>) => UserGroup | undefined;
  removeGroup: (id: string) => void;
  getGroupById: (id: string) => UserGroup | undefined;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_GROUPS = 'MGQsUserGroups';

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_GROUPS);
        setGroups(items ? JSON.parse(items) : [
          // Add some mock data for prototyping
          { id: 'group-1', name: 'Study Buddies', usernames: ['study_with_anu', 'smart_gk_123'], createdAt: Date.now() },
          { id: 'group-2', name: 'Class 10 Science', usernames: ['realmehdi', 'study_with_anu'], createdAt: Date.now() },
        ]);
      } catch (error) {
        console.error("Failed to load groups from localStorage:", error);
        setGroups([]);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY_GROUPS, JSON.stringify(groups));
      } catch (error) {
        console.error("Failed to save groups to localStorage:", error);
      }
    }
  }, [groups, isInitialized]);

  const addGroup = useCallback((groupData: Omit<UserGroup, 'id' | 'createdAt'>): UserGroup => {
    const newGroup: UserGroup = {
      ...groupData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  }, []);

  const updateGroup = useCallback((id: string, groupData: Partial<Omit<UserGroup, 'id' | 'createdAt'>>): UserGroup | undefined => {
    let updatedGroup: UserGroup | undefined;
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === id) {
          updatedGroup = { ...group, ...groupData };
          return updatedGroup;
        }
        return group;
      })
    );
    return updatedGroup;
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== id));
  }, []);

  const getGroupById = useCallback((id: string) => groups.find((group) => group.id === id), [groups]);

  return (
    <GroupsContext.Provider value={{ groups, addGroup, updateGroup, removeGroup, getGroupById }}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};
