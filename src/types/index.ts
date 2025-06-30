
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

// Base Question Types
export type GradeLevelNCERT = '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type BoardClass = '9' | '10';

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

export const BoardQuestionTypeSchema = z.enum([
    'mcq', 'vsa', 'sa', 'la', 'assertion_reason', 'case_based'
]);
export type BoardQuestionType = z.infer<typeof BoardQuestionTypeSchema>;

export type AnyQuestionType = QuestionTypeNCERT | StreamQuestionType | BoardQuestionType;

export interface QuestionContext {
  gradeLevel: GradeLevelNCERT | string;
  subject: string;
  chapter: string;
  questionType: AnyQuestionType;
  streamId?: StreamId;
  board?: BoardId;
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
  board?: BoardId;
  marks?: number;
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

// --- Board Exam Types ---
export type BoardId = 'cbse' | 'seba' | 'icse' | 'maharashtra' | 'tamil_nadu' | 'kerala' | 'west_bengal' | 'bihar' | 'up' | 'karnataka';

export interface Board {
    id: BoardId;
    name: string;
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
export type SpinMissionType = 'free' | 'practice_session' | 'login_streak';

export interface SpinWheelState {
  lastFreeSpinDate: string; // YYYY-MM-DD
  missionsCompletedToday: {
    practice_session: boolean;
  }
  spinsClaimedToday: {
    free: boolean;
    practice_session: boolean;
    login_streak: boolean;
  }
}

export type BadgeKey = 
  | 'legend' | 'streak_master'
  | 'note_ninja' | 'grammar_genius' | 'elite_learner'
  | 'xp_hunter'
  | 'xp_prodigy' | 'xp_master' | 'xp_king_queen' | 'xp_legend'
  | 'xp_god_mode' | 'welcome_rookie' | 'lucky_spinner';

export interface UserStats {
  questionsGenerated: number;
  notesSaved: number;
  grammarQuestionsCompleted: number;
  spinsCompleted: number;
  practiceSessionsCompleted: number;
  mockTestsCompleted: number;
  perfectMockTests: number;
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
  bio?: string;
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
  marks?: number;
  context: {
    gradeLevel: GradeLevelNCERT | string;
    subject: string;
    chapter: string;
    questionType: AnyQuestionType;
    streamId?: StreamId;
    board?: BoardId;
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
  numberOfQuestions: z.number().int().min(1).describe("The number of questions to generate."),
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

// Board Exam Question Generation
export const GenerateBoardQuestionInputSchema = z.object({
    boardName: z.string().describe("The full name of the educational board (e.g., 'CBSE', 'ICSE')."),
    className: z.enum(['9', '10']).describe("The class level, 9 or 10."),
    subject: z.string().describe('The subject for the questions.'),
    chapters: z.array(z.string()).describe('The specific chapters/topics to generate questions from. Can be ["Full Syllabus"].'),
    questionTypes: z.array(BoardQuestionTypeSchema).describe("The types of questions to generate."),
    numberOfQuestions: z.number().int().min(1).describe("The number of questions to generate."),
    isComprehensive: z.boolean().optional().describe("If true, generate all possible high-probability questions for the given chapters."),
});
export type GenerateBoardQuestionInput = z.infer<typeof GenerateBoardQuestionInputSchema>;

export const BoardQuestionSchema = z.object({
    question: z.string().describe("The full question text."),
    answer: z.string().describe("The correct answer, which should be detailed for long-answer types."),
    options: z.array(z.string()).optional().describe("Array of options for MCQ/Assertion-Reason type questions."),
    type: BoardQuestionTypeSchema.describe("The type of exam question."),
    marks: z.number().int().min(1).describe("The marks allocated for this question as per the board pattern."),
    explanation: z.string().optional().describe("A clear explanation of the correct answer or marking scheme."),
    isLikelyToAppear: z.boolean().describe("True if the AI predicts this is a high-probability question for the exam."),
});
export type BoardQuestion = z.infer<typeof BoardQuestionSchema>;

export const GenerateBoardQuestionOutputSchema = z.object({
    questions: z.array(BoardQuestionSchema).describe('An array of generated board exam style questions.'),
});
export type GenerateBoardQuestionOutput = z.infer<typeof GenerateBoardQuestionOutputSchema>;

// Mock Test Generation
export const GenerateMockTestInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level for the test.'),
  subject: z.string().describe('The subject of the test.'),
  chapters: z.array(z.string()).describe('A list of chapters to include in the test.'),
  numberOfQuestions: z.number().int().min(1).describe('The number of questions to generate.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the test.'),
  isComprehensive: z.boolean().optional().describe('Whether the test should be comprehensive.'),
  questionTypes: z.array(z.string()).optional().describe('An optional list of specific question types to generate.'),
});
export type GenerateMockTestInput = z.infer<typeof GenerateMockTestInputSchema>;

export const MockTestQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false', 'assertion_reason', 'short_answer', 'long_answer', 'fill_in_the_blanks']).describe('The type of question.'),
  text: z.string().describe("The full question text. For assertion/reason, must be formatted as 'Assertion (A): ...\\nReason (R): ...'"),
  options: z.array(z.string()).optional().describe('An array of options for multiple_choice, true_false, or assertion_reason questions.'),
  answer: z.string().describe('The correct answer. Must match one of the options if options are provided.'),
  explanation: z.string().describe('A clear explanation for why the answer is correct.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the question.'),
});
export type MockTestQuestion = z.infer<typeof MockTestQuestionSchema>;

export const GenerateMockTestOutputSchema = z.object({
  questions: z.array(MockTestQuestionSchema).describe('An array of generated mock test questions.'),
});
export type GenerateMockTestOutput = z.infer<typeof GenerateMockTestOutputSchema>;


// All other flow types can be inferred from their respective files.
export type { AnswerGrammarQuestionInput, AnswerGrammarQuestionOutput } from '@/ai/flows/answer-grammar-question';
export type { AnswerSubjectQuestionInput, AnswerSubjectQuestionOutput } from '@/ai/flows/answer-subject-question';
export type { GenerateNotesByChapterInput, GenerateNotesByChapterOutput } from '@/ai/flows/generate-notes-by-chapter';
export type { SummarizeTextInput, SummarizeTextOutput } from '@/ai/flows/summarize-text';
// TODO: Find a way to export these types without circular dependencies
// export type { GenerateFlashcardsInput, GenerateFlashcardsOutput, FlashcardSchema } from '@/ai/flows/generate-flashcards';
// export type { GenerateGrammarTestInput, GrammarQuestionType, GrammarTestQuestion, GenerateGrammarTestOutput } from '@/ai/flows/generate-grammar-test';

export interface GenerateFlashcardsInput {
  gradeLevel: GradeLevelNCERT;
  subject: string;
  chapter: string;
  numberOfCards: number;
}
export interface GenerateFlashcardsOutput {
  flashcards: {
    front: string;
    back: string;
  }[];
}
export interface FlashcardSchema {
    front: string;
    back: string;
}

export type GrammarQuestionType = 'multiple_choice' | 'true_false' | 'direct_answer';
export interface GenerateGrammarTestInput {
  topic: string;
  gradeLevel: GradeLevelNCERT;
  questionType: GrammarQuestionType;
  numberOfQuestions: number;
}
export interface GrammarTestQuestion {
  text: string;
  options?: string[];
  answer: string;
  explanation: string;
}
export interface GenerateGrammarTestOutput {
  questions: GrammarTestQuestion[];
}
