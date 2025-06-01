
import type { LucideIcon } from 'lucide-react';

export interface FollowUpExchange {
  userQuery: string;
  aiResponse: string;
}

export interface SavedQuestion {
  id: string;
  text: string;
  answer: string;
  questionType: string;
  gradeLevel: string;
  subject: string;
  chapter: string;
  timestamp: number;
  followUps?: FollowUpExchange[]; // Added for storing follow-up history
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

