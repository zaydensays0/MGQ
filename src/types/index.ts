
import type { LucideIcon } from 'lucide-react';

export interface SavedQuestion {
  id: string;
  text: string;
  answer: string;
  questionType: string;
  gradeLevel: string;
  subject: string;
  chapter: string;
  timestamp: number;
}

export interface QuestionContext {
  gradeLevel: string;
  subject: string;
  chapter: string;
  questionType: string;
}

export interface GeneratedQuestionAnswerPair {
  question: string;
  answer: string;
}

export interface GeneratedQuestionItem extends QuestionContext {
  text: string;
  answer: string;
}


export interface SubjectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface QuestionTypeOption {
  value: string;
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
