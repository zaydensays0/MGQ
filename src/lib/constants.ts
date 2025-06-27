
import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, QuestionTypeNCERT, BadgeKey, BadgeInfo } from '@/types';
import { Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon, Sparkles, Award, Sword, BrainCircuit, Flame } from 'lucide-react';

export const GRADE_LEVELS: GradeLevelNCERT[] = ['9', '10', '11', '12'];

export const SUBJECTS: SubjectOption[] = [
  { value: 'maths', label: 'Maths', icon: Calculator as LucideIcon },
  { value: 'science', label: 'Science', icon: FlaskConical as LucideIcon },
  { value: 'english', label: 'English', icon: BookOpenText as LucideIcon },
  { value: 'social_science', label: 'Social Science', icon: Globe2 as LucideIcon },
  { value: 'hindi', label: 'Hindi', icon: NotebookText as LucideIcon },
  { value: 'assamese', label: 'Assamese', icon: NotebookText as LucideIcon },
];

export const QUESTION_TYPES: QuestionTypeOption[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'assertion_reason', label: 'Assertion and Reason' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'fill_in_the_blanks', label: 'Fill in the Blanks' },
  { value: 'true_false', label: 'True/False' },
];

export const BADGE_DEFINITIONS: Record<BadgeKey, BadgeInfo> = {
  // Question Generation Badges
  novice_creator: {
    name: 'Novice Creator',
    description: "Generate {goal} questions.",
    icon: Sparkles,
    goal: 10,
    stat: 'questionsGenerated',
  },
  prolific_creator: {
    name: 'Prolific Creator',
    description: "Generate {goal} questions.",
    icon: Sparkles,
    goal: 50,
    stat: 'questionsGenerated',
  },
  legend: {
    name: 'Legend',
    description: "Generate {goal} questions.",
    icon: Award,
    goal: 100,
    stat: 'questionsGenerated',
  },
  // Mock Test Badges
  quiz_taker: {
    name: 'Quiz Taker',
    description: "Complete {goal} mock test.",
    icon: Sword,
    goal: 1,
    stat: 'mockTestsCompleted',
  },
  mock_warrior: {
    name: 'Mock Warrior',
    description: "Complete {goal} mock tests.",
    icon: Sword,
    goal: 10,
    stat: 'mockTestsCompleted',
  },
  smarty_pants: {
    name: 'Smarty Pants',
    description: "Get a perfect score on {goal} mock test.",
    icon: BrainCircuit,
    goal: 1,
    stat: 'perfectMockTests',
  },
  the_goat: {
    name: 'The GOAT',
    description: "Get {goal} perfect scores on mock tests.",
    icon: BrainCircuit,
    goal: 5,
    stat: 'perfectMockTests',
  },
  // Streak Badges (progress is user.streak, not a stat)
  mini_streak: {
    name: 'Mini Streak',
    description: "Maintain a {goal}-day study streak.",
    icon: Flame,
    goal: 3,
    stat: 'questionsGenerated', // Placeholder stat, logic is special-cased
  },
  streak_master: {
    name: 'Streak Master',
    description: "Maintain a {goal}-day study streak.",
    icon: Flame,
    goal: 7,
    stat: 'questionsGenerated', // Placeholder stat, logic is special-cased
  },
};
