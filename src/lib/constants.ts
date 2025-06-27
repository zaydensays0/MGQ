
import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, BadgeKey, BadgeInfo } from '@/types';
import { 
    Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon,
    Brain, Trophy, PenLine, Shield, BookMarked, Target, Puzzle, Gem, Rocket,
    TrendingUp, Moon, Coins, Database, Award, Crown, Star, Flame, Unlock 
} from 'lucide-react';

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
  // Stat-based
  legend: { name: 'Legend', description: "Generate {goal} questions.", icon: Brain, goal: 100, stat: 'questionsGenerated' },
  the_goat: { name: 'The GOAT', description: "Score 100% in {goal} mock test.", icon: Trophy, goal: 1, stat: 'perfectMockTests' },
  mock_warrior: { name: 'Mock Warrior', description: "Complete {goal} mock tests.", icon: Shield, goal: 10, stat: 'mockTestsCompleted' },
  note_ninja: { name: 'Note Ninja', description: "Save {goal} notes.", icon: BookMarked, goal: 50, stat: 'notesSaved' },
  accuracy_ace: { name: 'Accuracy Ace', description: "Maintain 90%+ accuracy in {goal} mock tests.", icon: Target, goal: 5, stat: 'highAccuracyMockTests' },
  grammar_genius: { name: 'Grammar Genius', description: "Complete {goal} grammar test questions.", icon: Puzzle, goal: 20, stat: 'grammarQuestionsCompleted' },
  
  // Streak-based
  streak_master: { name: 'Streak Master', description: "Maintain a {goal}-day study streak.", icon: PenLine, goal: 7, stat: 'questionsGenerated' }, // stat is placeholder
  
  // Complex / situational
  elite_learner: { name: 'Elite Learner', description: "Unlock any {goal} badges.", icon: Gem, goal: 5, stat: 'badges' },
  quick_starter: { name: 'Quick Starter', description: "Take your first mock test within 24 hours of joining.", icon: Rocket, goal: 1, stat: 'mockTestsCompleted' },
  comeback_kid: { name: 'Comeback Kid', description: "Score higher after two low-score tests.", icon: TrendingUp, goal: 1, stat: 'mockTestsCompleted' },
  silent_slayer: { name: 'Silent Slayer', description: "Complete {goal} full mock tests in a single day.", icon: Moon, goal: 3, stat: 'mockTestsCompleted' },
  welcome_rookie: { name: 'Welcome Rookie', description: "Earned by successfully logging in for the first time.", icon: Unlock, goal: 1, stat: 'questionsGenerated' }, // stat is placeholder

  // XP-based
  xp_hunter: { name: 'XP Hunter', description: "Earn {goal} XP.", icon: Coins, goal: 1000, stat: 'xp' },
  xp_prodigy: { name: 'XP Prodigy', description: "Earn {goal} XP.", icon: Database, goal: 10000, stat: 'xp' },
  xp_master: { name: 'XP Master', description: "Earn {goal} XP.", icon: Award, goal: 30000, stat: 'xp' },
  xp_king_queen: { name: 'XP King/Queen', description: "Earn {goal} XP.", icon: Crown, goal: 50000, stat: 'xp' },
  xp_legend: { name: 'XP Legend', description: "Earn {goal} XP.", icon: Star, goal: 70000, stat: 'xp' },
  xp_god_mode: { name: 'XP God Mode', description: "Earn {goal} XP.", icon: Flame, goal: 100000, stat: 'xp' },
};
