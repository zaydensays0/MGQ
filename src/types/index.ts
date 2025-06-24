
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

// Specific types for NCERT context
export type GradeLevelNCERT = '9' | '10' | '11' | '12';
export type QuestionTypeNCERT =
  | 'multiple_choice'
  | 'assertion_reason'
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

// Badge types for gamification
export type BadgeKey = 'mini_streak' | 'consistent_learner' | 'streak_master';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Types for User Profile & Authentication
export interface User {
  uid: string;
  fullName: string;
  email: string;
  password?: string; // Only used during signup, not stored
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  lastCorrectAnswerDate: string; // ISO date string: 'YYYY-MM-DD'
  badges: BadgeKey[];
  class: GradeLevelNCERT;
  gender?: Gender;
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
  type: z.enum(['multiple_choice', 'true_false', 'assertion_reason']).describe('The type of the question.'),
  text: z.string().describe('The question text itself. For Assertion/Reason, it should contain both parts.'),
  options: z.array(z.string()).optional().describe('An array of 4 strings for "multiple_choice", the standard 4 for "assertion_reason", or 2 strings (["True", "False"]) for "true_false".'),
  answer: z.string().describe('The correct answer. For "multiple_choice" and "assertion_reason", it must match one of the options. For "true_false", it must be "True" or "False".'),
});
export type MockTestQuestion = z.infer<typeof MockTestQuestionSchema>;

export const GenerateMockTestOutputSchema = z.object({
  questions: z.array(MockTestQuestionSchema).describe('An array of generated test questions.'),
});
export type GenerateMockTestOutput = z.infer<typeof GenerateMockTestOutputSchema>;


// Flashcards
export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: number;
  gradeLevel?: GradeLevelNCERT;
  subject?: string;
  chapter?: string;
}

// AI Flashcard Generation
export const GenerateFlashcardsInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level for the flashcards.'),
  subject: z.string().describe('The subject for the flashcards.'),
  chapter: z.string().describe('The chapter to generate flashcards from.'),
  numberOfCards: z.number().int().positive().describe('The number of flashcards to generate.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

export const FlashcardSchema = z.object({
  front: z.string().describe("The text for the front of the flashcard (e.g., a term or a question)."),
  back: z.string().describe("The text for the back of the flashcard (e.g., the definition or the answer)."),
});

export const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;


// AI Grammar Test Flow Types
export const GrammarQuestionTypeSchema = z.enum(['multiple_choice', 'true_false', 'direct_answer']);
export type GrammarQuestionType = z.infer<typeof GrammarQuestionTypeSchema>;

export const GenerateGrammarTestInputSchema = z.object({
  topic: z.string().describe('The specific grammar topic for the test (e.g., Tenses, Articles).'),
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level for the test.'),
  questionType: GrammarQuestionTypeSchema.describe('The type of questions to generate.'),
  numberOfQuestions: z.number().int().positive().describe('The number of questions to generate for the test.'),
});
export type GenerateGrammarTestInput = z.infer<typeof GenerateGrammarTestInputSchema>;

export const GrammarTestQuestionSchema = z.object({
  text: z.string().describe('The question text itself.'),
  options: z.array(z.string()).optional().describe('An array of 4 string options for "multiple_choice" questions. Omitted for other types.'),
  answer: z.string().describe('The correct answer. For "multiple_choice", it must match one of the options. For "true_false", it must be "True" or "False".'),
});
export type GrammarTestQuestion = z.infer<typeof GrammarTestQuestionSchema>;


export const GenerateGrammarTestOutputSchema = z.object({
  questions: z.array(GrammarTestQuestionSchema).describe('An array of generated grammar test questions.'),
});
export type GenerateGrammarTestOutput = z.infer<typeof GenerateGrammarTestOutputSchema>;
