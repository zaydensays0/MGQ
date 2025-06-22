
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

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
  gradeLevel?: GradeLevelNCERT;
  subject?: string;
  chapter?: string;
}

// Types for Grammar Helper
export type { AnswerGrammarQuestionInput, AnswerGrammarQuestionOutput } from '@/ai/flows/answer-grammar-question';

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

// Community & Group Chat Types
export interface ChatMessage {
  id: string;
  senderUsername: string;
  senderAvatarUrl: string;
  text: string;
  timestamp: number;
}

export interface UserGroup {
  id: string;
  name: string;
  adminUsername: string;
  members: { username: string; avatarUrl: string }[];
  messages: ChatMessage[];
  createdAt: number;
}

// Type for community shared posts
export interface SharedPost {
  id: string;
  author: {
    username: string;
    avatarUrl: string;
  };
  message: string | null;
  questions: SavedQuestion[];
  timestamp: number;
}


// Badge types for gamification
export type BadgeKey = 'mini_streak' | 'consistent_learner' | 'streak_master';

// Types for User Profile & Authentication
export interface User {
  fullName: string;
  username: string; // This will be the unique ID for a user in our system
  email: string;
  password?: string; // Stored only in prototype. NEVER in production.
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  lastCorrectAnswerDate: string; // ISO date string: 'YYYY-MM-DD'
  badges: BadgeKey[];
  class?: GradeLevelNCERT;
}

// AI Notes Generator Flow Types
export type { GenerateNotesByChapterInput, GenerateNotesByChapterOutput } from '@/ai/flows/generate-notes-by-chapter';
export type { SummarizeTextInput, SummarizeTextOutput } from '@/ai/flows/summarize-text';

// AI Mock Test Flow Types
export const GenerateMockTestInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level for the test.'),
  subject: z.string().describe('The subject of the test.'),
  chapters: z.string().describe('A comma-separated list of chapter names for the test.'),
  numberOfQuestions: z.number().int().positive().describe('The total number of questions to generate for the test.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the test questions.'),
});
export type GenerateMockTestInput = z.infer<typeof GenerateMockTestInputSchema>;

export const MockTestQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false']).describe('The type of the question.'),
  text: z.string().describe('The question text itself.'),
  options: z.array(z.string()).optional().describe('An array of 4 strings for "multiple_choice" questions, or 2 strings (["True", "False"]) for "true_false".'),
  answer: z.string().describe('The correct answer. For "multiple_choice", it must match one of the options. For "true_false", it must be "True" or "False".'),
});
export type MockTestQuestion = z.infer<typeof MockTestQuestionSchema>;

export const GenerateMockTestOutputSchema = z.object({
  questions: z.array(MockTestQuestionSchema).describe('An array of generated test questions.'),
});
export type GenerateMockTestOutput = z.infer<typeof GenerateMockTestOutputSchema>;
