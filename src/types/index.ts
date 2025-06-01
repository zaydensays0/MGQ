import type { LucideIcon } from 'lucide-react';

export interface SavedQuestion {
  id: string;
  text: string;
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

export interface GeneratedQuestionItem extends QuestionContext {
  text: string;
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
