import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, QuestionTypeNCERT } from '@/types';
import { Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon } from 'lucide-react';

export const GRADE_LEVELS: GradeLevelNCERT[] = ['9', '10', '11', '12'];

export const SUBJECTS: SubjectOption[] = [
  { value: 'maths', label: 'Maths', icon: Calculator as LucideIcon },
  { value: 'science', label: 'Science', icon: FlaskConical as LucideIcon },
  { value: 'english', label: 'English', icon: BookOpenText as LucideIcon },
  { value: 'social_science', label: 'Social Science', icon: Globe2 as LucideIcon },
  { value: 'hindi', label: 'Hindi', icon: NotebookText as LucideIcon },
];

export const QUESTION_TYPES: QuestionTypeOption[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'fill_in_the_blanks', label: 'Fill in the Blanks' },
  { value: 'true_false', label: 'True/False' },
];

