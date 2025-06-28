import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

// Base Question Types
export type GradeLevelNCERT = '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type QuestionTypeNCERT =
  | 'multiple_choice'
  | 'assertion_reason'
  | 'short_answer'
  | 'long_answer'
  | 'fill_in_the_blanks'
  | 'true_false';

export const StreamQuestionTypeSchema = z.enum([
    'mcq', 'numerical', 'integer', 'assertion_reason', 'case_based_mcq', 
    'passage_based_mcq', 'theory_mcq'
]);
export type StreamQuestionType = z.infer<typeof StreamQuestionTypeSchema>;

export type AnyQuestionType = QuestionTypeNCERT | StreamQuestionType;

export interface QuestionContext {
  gradeLevel: GradeLevelNCERT | string;
  subject: string;
  chapter: string;
  questionType: AnyQuestionType;
  streamId?: StreamId;
}

export interface GeneratedQuestionAnswerPair {
  question: string;
  answer: string;
  options?: string[];
  explanation?: string;
}

export interface SavedQuestion {
  id: string;
  text: string;
  answer: string;
  options?: string[];
  explanation?: string;
  questionType: AnyQuestionType;
  gradeLevel: GradeLevelNCERT | string; // Can be "1st Year", etc.
  subject: string;
  chapter: string;
  timestamp: number;
  streamId?: StreamId;
}

// --- Generic Component & Constant Types ---
export interface SubjectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface QuestionTypeOption {
  value: QuestionTypeNCERT;
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

// --- Conversation Types ---
export interface ConversationExchange {
  question: string;
  answer: string;
}

export interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
}

export interface SavedJarvisExchange {
  id: string;
  title: string;
  exchanges: ConversationExchange[];
  timestamp: number;
}

export interface SavedSubjectExpertExchange {
  id: string;
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  exchanges: ConversationExchange[];
  timestamp: number;
}

// --- Study Stream Types ---
export type StreamId = 'neet' | 'jee' | 'mbbs' | 'btech' | 'upsc' | 'ssc' | 'banking' | 'cuet' | 'clat' | 'nda' | 'ca-foundation' | 'iti-polytechnic';

export interface Stream {
  id: StreamId;
  name: string;
  description: string;
  icon: LucideIcon;
}

export type StreamSyllabus = Record<StreamId, Record<string, Record<string, string[] | Record<string, string[]>>>>;


// --- User, Auth, and Gamification Types ---
export type SpinMissionType = 'free' | 'practice_session' | 'mock_test' | 'login_streak';

export interface SpinWheelState {
  lastFreeSpinDate: string; // YYYY-MM-DD
  missionsCompletedToday: {
    practice_session: boolean;
    mock_test: boolean;
  }
  spinsClaimedToday: {
    free: boolean;
    practice_session: boolean;
    mock_test: boolean;
    login_streak: boolean;
  }
}

export type BadgeKey = 
  | 'legend' | 'the_goat' | 'streak_master' | 'mock_warrior'
  | 'note_ninja' | 'accuracy_ace' | 'grammar_genius' | 'elite_learner'
  | 'quick_starter' | 'comeback_kid' | 'silent_slayer' | 'xp_hunter'
  | 'xp_prodigy' | 'xp_master' | 'xp_king_queen' | 'xp_legend'
  | 'xp_god_mode' | 'welcome_rookie' | 'lucky_spinner';

export interface UserStats {
  questionsGenerated: number;
  mockTestsCompleted: number;
  perfectMockTests: number;
  notesSaved: number;
  grammarQuestionsCompleted: number;
  highAccuracyMockTests: number;
  lowScoreStreak: number;
  mockTestsToday: number;
  lastMockTestDate: string; // YYYY-MM-DD
  spinsCompleted: number;
  practiceSessionsCompleted: number;
}

export interface BadgeInfo {
  name: string;
  description: string;
  icon: LucideIcon;
  goal: number;
  stat: keyof UserStats | 'xp' | 'badges' | 'streak';
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streak: number;
  lastActivityTimestamp: number;
  unclaimedBadges: BadgeKey[];
  badges: BadgeKey[];
  class: GradeLevelNCERT;
  gender?: Gender;
  stats: UserStats;
  equippedBadge: BadgeKey | null;
  createdAt: number;
  stream?: StreamId;
  spinWheel: SpinWheelState;
}

export interface WrongQuestion {
  id: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
  context: {
    gradeLevel: GradeLevelNCERT | string;
    subject: string;
    chapter: string;
    questionType: AnyQuestionType;
    streamId?: StreamId;
  };
  attemptedAt: number;
}


// --- Flashcard Types ---
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

// --- AI Flow Schemas ---

// AI Answer Recheck Flow
export const RecheckAnswerInputSchema = z.object({
  gradeLevel: z.string().describe('The grade level or academic level of the question.'),
  subject: z.string().describe('The subject of the question.'),
  chapter: z.string().describe('The chapter the question is based on.'),
  question: z.string().describe('The question text.'),
  originalAnswer: z.string().describe('The original answer provided by the AI that needs to be checked.'),
  options: z.array(z.string()).optional().describe('The options for a multiple choice question, if applicable.'),
});
export type RecheckAnswerInput = z.infer<typeof RecheckAnswerInputSchema>;

export const RecheckAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the original answer was correct or not.'),
  correctAnswer: z.string().describe('The verified correct answer. If the original was correct, this will be the same. If not, this is the corrected answer.'),
  explanation: z.string().describe('A brief explanation of why the original answer was correct or incorrect.'),
});
export type RecheckAnswerOutput = z.infer<typeof RecheckAnswerOutputSchema>;

// Stream Question Generation
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const GenerateStreamQuestionsInputSchema = z.object({
  streamId: z.string().describe("The ID of the exam stream (e.g., 'jee', 'upsc')."),
  streamName: z.string().describe("The full name of the exam stream (e.g., 'JEE (Main & Advanced)')."),
  level: z.string().describe("The level within the stream (e.g., 'Class 11', '1st Year', 'Paper I')."),
  subject: z.string().describe('The subject for the questions.'),
  chapter: z.string().describe('The specific chapter/topic to generate questions from.'),
  numberOfQuestions: z.number().int().positive().describe("The number of questions to generate."),
  isComprehensive: z.boolean().optional().describe("If true, generate a wide variety of questions covering the whole topic thoroughly."),
});
export type GenerateStreamQuestionsInput = z.infer<typeof GenerateStreamQuestionsInputSchema>;

export const StreamQuestionSchema = z.object({
  type: StreamQuestionTypeSchema.describe("The type of exam question."),
  text: z.string().describe("The full question text. For passage-based questions, this includes the passage."),
  options: z.array(z.string()).optional().describe("Array of options for MCQ-type questions."),
  answer: z.string().describe("The correct answer. Must match an option if options are provided."),
  explanation: z.string().describe("A clear explanation of the correct answer, which can serve as a step-by-step solution for numerical problems."),
  difficulty: DifficultySchema.describe("The difficulty level of the question."),
});
export type StreamQuestion = z.infer<typeof StreamQuestionSchema>;

export const GenerateStreamQuestionsOutputSchema = z.object({
  questions: z.array(StreamQuestionSchema).describe('An array of generated stream-specific questions.'),
});
export type GenerateStreamQuestionsOutput = z.infer<typeof GenerateStreamQuestionsOutputSchema>;

// Topic to Questions
export const TopicToQuestionsInputSchema = z.object({
  topic: z.string().describe("The user's concept or topic to be converted into questions."),
  numberOfQuestions: z.number().int().min(1).optional().describe("The number of questions to generate."),
  isComprehensive: z.boolean().optional().describe("Whether to generate a comprehensive set of questions covering the whole topic."),
  gradeLevel: z.enum<GradeLevelNCERT, ['5', '6', '7', '8', '9', '10', '11', '12']>(['5', '6', '7', '8', '9', '10', '11', '12']).optional().describe('The grade level, required for comprehensive mode.'),
});
export type TopicToQuestionsInput = z.infer<typeof TopicToQuestionsInputSchema>;

export const GeneratedTopicQuestionSchema = z.object({
    type: z.enum(['multiple_choice', 'true_false', 'fill_in_the_blanks', 'short_answer', 'assertion_reason']).describe('The type of the question.'),
    question: z.string().describe('The question text itself. For fill-in-the-blanks, use [BLANK]. For assertion/reason, separate with \\n.'),
    options: z.array(z.string()).optional().describe('An array of options for "multiple_choice", "true_false", or "assertion_reason" questions.'),
    answer: z.string().describe('The correct answer.'),
    explanation: z.string().describe('A brief explanation for why the answer is correct.'),
});
export type GeneratedTopicQuestion = z.infer<typeof GeneratedTopicQuestionSchema>;

export const TopicToQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedTopicQuestionSchema).describe('An array of generated questions of mixed types.'),
});
export type TopicToQuestionsOutput = z.infer<typeof TopicToQuestionsOutputSchema>;

// All other flow types can be inferred from their respective files.
export type { AnswerGrammarQuestionInput, AnswerGrammarQuestionOutput } from '@/ai/flows/answer-grammar-question';
export type { AnswerSubjectQuestionInput, AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';
export type { GenerateNotesByChapterInput, GenerateNotesByChapterOutput } from '@/ai/flows/generate-notes-by-chapter';
export type { SummarizeTextInput, SummarizeTextOutput } from '@/ai/flows/summarize-text';
export type { GenerateMockTestInput, MockTestQuestion, GenerateMockTestOutput } from '@/ai/flows/generate-mock-test';
export type { GenerateFlashcardsInput, GenerateFlashcardsOutput, FlashcardSchema } from '@/ai/flows/generate-flashcards';
export type { GenerateGrammarTestInput, GrammarQuestionType, GrammarTestQuestion, GenerateGrammarTestOutput } from '@/ai/flows/generate-grammar-test';
