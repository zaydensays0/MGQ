
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

// Specific types for NCERT context
export type GradeLevelNCERT = '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type QuestionTypeNCERT =
  | 'multiple_choice'
  | 'assertion_reason'
  | 'short_answer'
  | 'long_answer'
  | 'fill_in_the_blanks'
  | 'true_false'
  | 'numerical'; // Added for NEET

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

// --- Study Stream Types ---
export type StreamId = 'neet' | 'jee' | 'mbbs' | 'btech' | 'upsc' | 'ssc' | 'banking' | 'cuet' | 'clat' | 'nda' | 'ca' | 'iti';

export interface Stream {
  id: StreamId;
  name: string;
  description: string;
  icon: LucideIcon;
  subjects: string[];
  questionTypes: string[];
}

export interface NeetSyllabus {
    physics: { class11: string[], class12: string[] };
    chemistry: { class11: string[], class12: string[] };
    biology: { class11: string[], class12: string[] };
}

// --- Badge Types ---
export type BadgeKey = 
  | 'legend' | 'the_goat' | 'streak_master' | 'mock_warrior'
  | 'note_ninja' | 'accuracy_ace' | 'grammar_genius' | 'elite_learner'
  | 'quick_starter' | 'comeback_kid' | 'silent_slayer' | 'xp_hunter'
  | 'xp_prodigy' | 'xp_master' | 'xp_king_queen' | 'xp_legend'
  | 'xp_god_mode' | 'welcome_rookie';

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
}

export interface BadgeInfo {
  name: string;
  description: string;
  icon: LucideIcon;
  goal: number;
  stat: keyof UserStats | 'xp' | 'badges' | 'streak';
}

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
  lastActivityTimestamp: number; // Unix timestamp in milliseconds
  unclaimedBadges: BadgeKey[];
  badges: BadgeKey[];
  class: GradeLevelNCERT;
  gender?: Gender;
  stats: UserStats;
  equippedBadge: BadgeKey | null;
  createdAt: number;
  stream?: StreamId;
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
  gradeLevel: z.enum<GradeLevelNCERT, ['5', '6', '7', '8', '9', '10', '11', '12']>(['5', '6', '7', '8', '9', '10', '11', '12']).describe('The grade level for the flashcards.'),
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
  gradeLevel: z.enum<GradeLevelNCERT, ['5', '6', '7', '8', '9', '10', '11', '12']>(['5', '6', '7', '8', '9', '10', '11', '12']).describe('The grade level for the test.'),
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

// AI Answer Recheck Flow Types
export const RecheckAnswerInputSchema = z.object({
  gradeLevel: z.string().describe('The grade level of the question.'),
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

// AI Topic to Questions Flow Types
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


// NEET Question Generation Types
export const NeetQuestionTypeSchema = z.enum(['mcq', 'assertion_reason', 'numerical']);
export type NeetQuestionType = z.infer<typeof NeetQuestionTypeSchema>;

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const GenerateNeetQuestionsInputSchema = z.object({
  subject: z.string().describe('The subject for the questions (e.g., physics).'),
  classLevel: z.string().describe('The class level for the questions (e.g., 11 or 12).'),
  chapter: z.string().describe('The specific chapter to generate questions from.'),
});
export type GenerateNeetQuestionsInput = z.infer<typeof GenerateNeetQuestionsInputSchema>;

export const NeetQuestionSchema = z.object({
  type: NeetQuestionTypeSchema.describe("The type of NEET question."),
  text: z.string().describe("The full question text. For Assertion/Reason, it must contain both parts separated by a newline."),
  options: z.array(z.string()).optional().describe("Array of 4 options for MCQ and Assertion/Reason types."),
  answer: z.string().describe("The correct answer. Must match an option if options are provided."),
  explanation: z.string().describe("A clear explanation of the correct answer."),
  difficulty: DifficultySchema.describe("The difficulty level of the question."),
});
export type NeetQuestion = z.infer<typeof NeetQuestionSchema>;

export const GenerateNeetQuestionsOutputSchema = z.object({
  questions: z.array(NeetQuestionSchema).describe('An array of generated NEET questions.'),
});
export type GenerateNeetQuestionsOutput = z.infer<typeof GenerateNeetQuestionsOutputSchema>;
