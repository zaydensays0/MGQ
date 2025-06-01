
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
  options?: string[]; // Added for MCQs
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
  options?: string[]; // Added for MCQs
}

export interface GeneratedQuestionItem extends QuestionContext {
  text: string;
  answer: string;
  options?: string[]; // Added for MCQs
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
export type { AskJarvisInput, AskJarvisOutput } from '@/ai/flows/ask-jarvis';

// Types for Saved Jarvis Exchanges
export interface SavedJarvisExchange {
  id: string;
  userQuestion: string;
  jarvisAnswer: string;
  timestamp: number;
}

