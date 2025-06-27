
import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, BadgeKey, BadgeInfo, Stream } from '@/types';
import { 
    Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon,
    Brain, Trophy, PenLine, Shield, BookMarked, Target, Puzzle, Gem, Rocket,
    TrendingUp, Moon, Coins, Database, Award, Crown, Star, Flame, Unlock, Leaf,
    Stethoscope, Atom, HeartPulse, Code, Landmark, Users, Banknote, GraduationCap, Gavel, Wrench
} from 'lucide-react';

export const GRADE_LEVELS: GradeLevelNCERT[] = ['5', '6', '7', '8', '9', '10', '11', '12'];

export const SUBJECTS: SubjectOption[] = [
  { value: 'maths', label: 'Maths', icon: Calculator as LucideIcon },
  { value: 'science', label: 'Science', icon: FlaskConical as LucideIcon },
  { value: 'evs', label: 'Environmental Science', icon: Leaf as LucideIcon },
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

export const STREAMS: Stream[] = [
    {
        id: 'neet',
        name: 'NEET',
        description: 'Prepare for the National Eligibility cum Entrance Test for medical courses.',
        icon: Stethoscope,
        subjects: ['Physics', 'Chemistry', 'Biology'],
        questionTypes: ['MCQs (Single Correct)', 'Assertion & Reason', 'Conceptual and numerical questions']
    },
    {
        id: 'jee',
        name: 'JEE',
        description: 'Prepare for the Joint Entrance Examination for engineering colleges.',
        icon: Atom,
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
        questionTypes: ['Single & Multiple Correct MCQs', 'Integer/Numerical Type', 'Matrix Match', 'Paragraph-Based Sets']
    },
    {
        id: 'mbbs',
        name: 'MBBS',
        description: 'Resources and questions for medical college (MBBS) coursework.',
        icon: HeartPulse,
        subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology'],
        questionTypes: ['Short Answer Questions (SAQs)', 'Long Answer Questions (LAQs)', 'Clinical Case-Based Questions']
    },
    {
        id: 'btech',
        name: 'B.Tech',
        description: 'Subject-wise preparation for engineering (B.Tech) coursework.',
        icon: Code,
        subjects: ['Varies by branch (e.g., CSE, ECE, ME)'],
        questionTypes: ['Conceptual Theory Questions', 'Numerical & Technical MCQs', 'Code-based Questions (for CSE)']
    },
    {
        id: 'upsc',
        name: 'UPSC',
        description: 'Foundation preparation for the Civil Services Examination.',
        icon: Landmark,
        subjects: ['Polity', 'History', 'Geography', 'Economy', 'Science', 'Current Affairs'],
        questionTypes: ['General Awareness MCQs', 'Assertion & Reason', 'Elimination-based logic questions']
    },
    {
        id: 'ssc',
        name: 'SSC',
        description: 'Prepare for exams conducted by the Staff Selection Commission.',
        icon: Users,
        subjects: ['General Intelligence', 'Quantitative Aptitude', 'English', 'General Awareness'],
        questionTypes: ['Speed-based MCQs', 'Reasoning & Puzzle-type questions', 'Grammar and Vocabulary MCQs']
    },
    {
        id: 'banking',
        name: 'Banking',
        description: 'Preparation for banking exams like SBI, IBPS, and RBI.',
        icon: Banknote,
        subjects: ['Reasoning', 'Quantitative Aptitude', 'English', 'Banking Awareness'],
        questionTypes: ['Logical Reasoning and Data Interpretation MCQs', 'English Comprehension', 'General Banking & Financial Awareness']
    },
    {
        id: 'cuet',
        name: 'CUET',
        description: 'Prepare for the Common University Entrance Test for UG courses.',
        icon: GraduationCap,
        subjects: ['Domain-specific subjects', 'English', 'General Test'],
        questionTypes: ['Chapter-wise MCQs', 'Comprehension & Logical Reasoning', 'Language and Grammar MCQs']
    },
    {
        id: 'clat',
        name: 'CLAT',
        description: 'Prepare for the Common Law Admission Test for law schools.',
        icon: Gavel,
        subjects: ['Legal Aptitude', 'English', 'Logical Reasoning', 'GK', 'Quantitative Techniques'],
        questionTypes: ['Passage-based MCQs', 'Logical puzzles', 'Legal reasoning-based questions']
    },
    {
        id: 'nda',
        name: 'NDA',
        description: 'Prepare for the National Defence Academy entrance examination.',
        icon: Shield,
        subjects: ['Mathematics', 'English', 'General Ability'],
        questionTypes: ['Numerical and MCQs', 'GK & current affairs', 'Reasoning-based questions']
    },
    {
        id: 'ca',
        name: 'CA Foundation',
        description: 'Preparation for the Chartered Accountancy Foundation exam.',
        icon: Calculator,
        subjects: ['Accounts', 'Business Law', 'Math', 'Business Economics'],
        questionTypes: ['Numerical and concept-based MCQs', 'Theoretical objective questions', 'Business logic and application']
    },
    {
        id: 'iti',
        name: 'ITI & Polytechnic',
        description: 'Vocational and technical course preparation.',
        icon: Wrench,
        subjects: ['Trade Theory', 'Workshop Science', 'Engineering Drawing'],
        questionTypes: ['Technical MCQs', 'Procedure-based theory questions', 'Trade-specific calculations']
    }
];


export const BADGE_DEFINITIONS: Record<BadgeKey, BadgeInfo> = {
  // Stat-based
  legend: { name: 'Legend', description: "Generate {goal} questions.", icon: Brain, goal: 100, stat: 'questionsGenerated' },
  the_goat: { name: 'The GOAT', description: "Score 100% in any mock test.", icon: Trophy, goal: 1, stat: 'perfectMockTests' },
  mock_warrior: { name: 'Mock Warrior', description: "Complete {goal} mock tests.", icon: Shield, goal: 10, stat: 'mockTestsCompleted' },
  note_ninja: { name: 'Note Ninja', description: "Save {goal} notes.", icon: BookMarked, goal: 50, stat: 'notesSaved' },
  accuracy_ace: { name: 'Accuracy Ace', description: "Maintain 90%+ accuracy in {goal} mock tests.", icon: Target, goal: 5, stat: 'highAccuracyMockTests' },
  grammar_genius: { name: 'Grammar Genius', description: "Complete {goal} grammar test questions.", icon: Puzzle, goal: 20, stat: 'grammarQuestionsCompleted' },
  
  // Streak-based
  streak_master: { name: 'Streak Master', description: "Maintain a {goal}-day study streak.", icon: Flame, goal: 7, stat: 'streak' },
  
  // Complex / situational
  elite_learner: { name: 'Elite Learner', description: "Unlock any {goal} badges.", icon: Gem, goal: 5, stat: 'badges' },
  quick_starter: { name: 'Quick Starter', description: "Take your first mock test within 24 hours of joining.", icon: Rocket, goal: 1, stat: 'mockTestsCompleted' },
  comeback_kid: { name: 'Comeback Kid', description: "Score higher after two low-score tests.", icon: TrendingUp, goal: 1, stat: 'mockTestsCompleted' },
  silent_slayer: { name: 'Silent Slayer', description: "Complete {goal} full mock tests in a single day.", icon: Moon, goal: 3, stat: 'mockTestsCompleted' },
  welcome_rookie: { name: 'Welcome Rookie', description: "Earned by successfully logging in for the first time.", icon: Unlock, goal: 1, stat: 'xp' },

  // XP-based
  xp_hunter: { name: 'XP Hunter', description: "Earn {goal} XP.", icon: Coins, goal: 1000, stat: 'xp' },
  xp_prodigy: { name: 'XP Prodigy', description: "Earn {goal} XP.", icon: Database, goal: 10000, stat: 'xp' },
  xp_master: { name: 'XP Master', description: "Earn {goal} XP.", icon: Award, goal: 30000, stat: 'xp' },
  xp_king_queen: { name: 'XP King/Queen', description: "Earn {goal} XP.", icon: Crown, goal: 50000, stat: 'xp' },
  xp_legend: { name: 'XP Legend', description: "Earn {goal} XP.", icon: Star, goal: 70000, stat: 'xp' },
  xp_god_mode: { name: 'XP God Mode', description: "Earn {goal} XP.", icon: Flame, goal: 100000, stat: 'xp' },
};
