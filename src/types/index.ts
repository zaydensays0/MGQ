
import type { LucideIcon } from 'lucide-react';

// Specific types for NCERT context
export type GradeLevelNCERT = '9' | '10' | '11' | '12';
export type QuestionTypeNCERT =
  | 'multiple_choice'
  | 'short_answer'
  | 'long_answer'
  | 'fill_in_the_blanks'
  | 'true_false';

export interface SavedQuestion {
  id: string;
  text: string;
  answer: string;
  options?: string[];
  questionType: QuestionTypeNCERT;
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  timestamp: number;
}

export interface QuestionContext {
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  questionType: QuestionTypeNCERT;
}

export interface GeneratedQuestionAnswerPair {
  question: string;
  answer: string;
  options?: string[];
}

export interface GeneratedQuestionItem extends QuestionContext {
  text: string;
  answer: string;
  options?: string[];
}


export interface SubjectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface QuestionTypeOption {
  value: QuestionTypeNCERT; // Use specific type
  label: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  linkedQuestionIds: string[];
  createdAt: number;
  updatedAt: number;
}

// Types for Grammar Helper
export type { AnswerGrammarQuestionInput, AnswerGrammarQuestionOutput } from '@/ai/flows/answer-grammar-question';

// Types for Jarvis general Q&A
// export type { AskJarvisInput, AskJarvisOutput } from '@/ai/flows/ask-jarvis'; // Will be re-defined by the flow itself

// Represents a single question-answer pair in a conversation, used for storing
export interface ConversationExchange {
  question: string;
  answer: string;
}

// Types for Saved Jarvis Exchanges - Updated Structure
export interface SavedJarvisExchange {
  id: string;
  title: string; // e.g., the first question of the conversation
  exchanges: ConversationExchange[];
  timestamp: number;
}

// Types for Subject Expert Q&A
export interface ConversationTurn { // Used by AI Flow input
  speaker: 'user' | 'ai';
  text: string;
}
export type { AnswerSubjectQuestionInput, AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';

// Types for Saved Subject Expert Exchanges
export interface SavedSubjectExpertExchange {
  id: string;
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  exchanges: ConversationExchange[]; // Stores the entire conversation thread
  timestamp: number;
}

// Types for Username Suggestion
export type { SuggestUsernameInput, SuggestUsernameOutput } from '@/ai/flows/suggest-username';

// Types for Community/Shared Questions
export interface SharedQuestion {
  id: string;
  username: string;
  userAvatarUrl?: string;
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  text: string;
  answer: string;
  options?: string[];
  timestamp: number;
}

// Types for User Groups
export interface UserGroup {
  id: string;
  name: string;
  usernames: string[];
  createdAt: number;
}

// Badge types for gamification
export type BadgeKey = 'mini_streak' | 'consistent_learner' | 'streak_master';

// Types for User Profile
export interface User {
  fullName: string;
  username: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  lastCorrectAnswerDate: string; // ISO date string: 'YYYY-MM-DD'
  badges: BadgeKey[];
  class?: GradeLevelNCERT;
}
