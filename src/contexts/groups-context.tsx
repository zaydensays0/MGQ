'use client';

import type { UserGroup, ChatMessage } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface GroupCreationData {
  name: string;
  adminUsername: string;
  members: { username: string; avatarUrl: string }[];
}

export interface MessageCreationData {
    text: string;
    senderUsername: string;
    senderAvatarUrl: string;
}

interface GroupsContextType {
  groups: UserGroup[];
  addGroup: (groupData: GroupCreationData) => UserGroup;
  getGroupById: (id: string) => UserGroup | undefined;
  addMessageToGroup: (groupId: string, messageData: MessageCreationData) => void;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_GROUPS = 'MGQsUserGroups_v3_chat'; // Version up for chat feature

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const items = window.localStorage.getItem(LOCAL_STORAGE_KEY_GROUPS);
        setGroups(items ? JSON.parse(items) : []);
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

  const addGroup = useCallback((groupData: GroupCreationData): UserGroup => {
    const newGroup: UserGroup = {
      ...groupData,
      id: uuidv4(),
      messages: [],
      createdAt: Date.now(),
    };
    setGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  }, []);

  const getGroupById = useCallback((id: string) => groups.find((group) => group.id === id), [groups]);

  const addMessageToGroup = useCallback((groupId: string, messageData: MessageCreationData) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
            return {
                ...group,
                messages: [...group.messages, newMessage]
            };
        }
        return group;
    }));
  }, []);

  return (
    <GroupsContext.Provider value={{ groups, addGroup, getGroupById, addMessageToGroup }}>
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
