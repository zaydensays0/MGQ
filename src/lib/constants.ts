import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, BadgeKey, BadgeInfo, Stream, StreamSyllabus } from '@/types';
import { 
    Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon,
    Brain, Trophy, PenLine, Shield, BookMarked, Target, Puzzle, Gem, Rocket,
    TrendingUp, Moon, Coins, Database, Award, Crown, Star, Flame, Unlock, Leaf,
    Stethoscope, Atom, HeartPulse, Code, Landmark, Users, Banknote, GraduationCap, Gavel, Wrench, Ticket
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
  { value: 'physics', label: 'Physics', icon: Atom as LucideIcon },
  { value: 'chemistry', label: 'Chemistry', icon: FlaskConical as LucideIcon },
  { value: 'biology', label: 'Biology', icon: Stethoscope as LucideIcon },
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
    },
    {
        id: 'jee',
        name: 'JEE (Main & Advanced)',
        description: 'Prepare for the Joint Entrance Examination for engineering colleges.',
        icon: Atom,
    },
    {
        id: 'mbbs',
        name: 'MBBS (1st Year)',
        description: 'Resources and questions for first-year medical college coursework.',
        icon: HeartPulse,
    },
    {
        id: 'btech',
        name: 'B.Tech (1st Year)',
        description: 'Subject-wise preparation for first-year engineering coursework.',
        icon: Code,
    },
    {
        id: 'upsc',
        name: 'UPSC (Prelims)',
        description: 'Foundation preparation for the Civil Services Examination.',
        icon: Landmark,
    },
    {
        id: 'ssc',
        name: 'SSC (CGL/CHSL)',
        description: 'Prepare for exams conducted by the Staff Selection Commission.',
        icon: Users,
    },
    {
        id: 'banking',
        name: 'Banking (PO/Clerk)',
        description: 'Preparation for banking exams like SBI, IBPS, and RBI.',
        icon: Banknote,
    },
    {
        id: 'cuet',
        name: 'CUET-UG',
        description: 'Prepare for the Common University Entrance Test for UG courses.',
        icon: GraduationCap,
    },
    {
        id: 'clat',
        name: 'CLAT',
        description: 'Prepare for the Common Law Admission Test for law schools.',
        icon: Gavel,
    },
    {
        id: 'nda',
        name: 'NDA',
        description: 'Prepare for the National Defence Academy entrance examination.',
        icon: Shield,
    },
    {
        id: 'ca-foundation',
        name: 'CA Foundation',
        description: 'Preparation for the Chartered Accountancy Foundation exam.',
        icon: Calculator,
    },
    {
        id: 'iti-polytechnic',
        name: 'ITI & Polytechnic',
        description: 'Vocational and technical course preparation.',
        icon: Wrench,
    }
];

export const STREAM_SYLLABUS: StreamSyllabus = {
    neet: {
        'Physics': {
            'Class 11': ["Physical World", "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids & Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
            'Class 12': ["Electric Charges and Fields", "Electrostatic Potential", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Radiation", "Atoms", "Nuclei", "Semiconductor Electronics"]
        },
        'Chemistry': {
            'Class 11': ["Basic Concepts of Chemistry", "Structure of Atom", "Periodicity", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements (Group 13-14)", "Organic Chemistry Basics", "Hydrocarbons", "Environmental Chemistry"],
            'Class 12': ["Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "p-Block Elements (Group 15-18)", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols, Ethers", "Aldehydes, Ketones, Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"]
        },
        'Biology': {
            'Class 11': ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell", "Biomolecules", "Cell Cycle", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration in Plants", "Plant Growth", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products", "Locomotion and Movement", "Neural Control", "Chemical Coordination"],
            'Class 12': ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Genetics and Evolution", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology", "Biotech Applications", "Organisms and Populations", "Ecosystem", "Biodiversity", "Environmental Issues"]
        }
    },
    jee: {
        'Physics': {
            'Class 11': ["Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations and Waves"],
            'Class 12': ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction and AC", "Electromagnetic Waves", "Optics", "Dual Nature of Matter and Radiation", "Atoms and Nuclei", "Electronic Devices", "Communication Systems"]
        },
        'Chemistry': {
            'Physical': ["Some Basic Concepts in Chemistry", "States of Matter", "Atomic Structure", "Chemical Bonding", "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions and Electrochemistry", "Chemical Kinetics", "Surface Chemistry"],
            'Inorganic': ["Classification of Elements", "Hydrogen", "s-Block Elements", "p-Block Elements", "d- and f-Block Elements", "Coordination Compounds", "Environmental Chemistry", "General Principles of Metallurgy"],
            'Organic': ["Purification and Characterisation of Organic Compounds", "Some Basic Principles of Organic Chemistry", "Hydrocarbons", "Organic Compounds Containing Halogens", "Organic Compounds Containing Oxygen", "Organic Compounds Containing Nitrogen", "Polymers", "Biomolecules", "Chemistry in Everyday Life"]
        },
        'Mathematics': {
            'Topics': ["Sets, Relations, and Functions", "Complex Numbers and Quadratic Equations", "Matrices and Determinants", "Permutations and Combinations", "Mathematical Induction", "Binomial Theorem", "Sequences and Series", "Limit, Continuity and Differentiability", "Integral Calculus", "Differential Equations", "Coordinate Geometry", "Three Dimensional Geometry", "Vector Algebra", "Statistics and Probability", "Trigonometry", "Mathematical Reasoning"]
        }
    },
    mbbs: {
        'Anatomy': { 'Topics': ["General Anatomy", "Gross Anatomy (Upper Limb, Lower Limb, Thorax, Abdomen, Head & Neck)", "Histology (Microanatomy)", "Embryology", "Neuroanatomy"] },
        'Physiology': { 'Topics': ["General Physiology", "Nerve-Muscle Physiology", "Blood", "Cardiovascular System", "Respiratory System", "Gastrointestinal System", "Renal Physiology", "Endocrine System", "Reproductive System", "Central Nervous System", "Special Senses"] },
        'Biochemistry': { 'Topics': ["Chemistry of Biomolecules", "Enzymes", "Metabolism of Carbohydrates", "Metabolism of Lipids", "Metabolism of Amino Acids & Proteins", "Nucleotide Metabolism", "Molecular Biology", "Hormones", "Nutrition", "Organ Function Tests"] }
    },
    btech: {
        'Engineering Mathematics': { 'Topics': ["Calculus (Differential & Integral)", "Matrices", "Vector Calculus", "Differential Equations", "Complex Variables", "Laplace Transforms", "Fourier Series"] },
        'Physics': { 'Topics': ["Mechanics", "Optics", "Electromagnetism", "Quantum Mechanics", "Thermodynamics", "Solid State Physics"] },
        'Basic Electrical Engineering': { 'Topics': ["DC Circuits", "AC Circuits", "Transformers", "Electrical Machines (DC/AC Motors)", "Power Systems Introduction"] },
        'Programming in C': { 'Topics': ["Introduction to C", "Operators and Expressions", "Control Structures", "Functions", "Arrays and Strings", "Pointers", "Structures and Unions", "File Handling"] },
        'Environmental Studies': { 'Topics': ["Ecosystems", "Biodiversity", "Pollution (Air, Water, Soil)", "Solid Waste Management", "Social Issues and the Environment"] }
    },
    upsc: {
        'History': { 'Topics': ["Ancient Indian History", "Medieval Indian History", "Modern Indian History (Freedom Struggle)", "Post-Independence India", "World History"] },
        'Geography': { 'Topics': ["Physical Geography (Geomorphology, Climatology, Oceanography)", "Indian Geography", "World Geography (Regional)", "Human and Economic Geography"] },
        'Polity': { 'Topics': ["Indian Constitution", "System of Government (Union & State)", "Judiciary", "Panchayati Raj", "Constitutional & Non-Constitutional Bodies", "Governance Issues"] },
        'Economy': { 'Topics': ["Basics of Indian Economy", "Planning & Economic Development", "Poverty, Inclusion, Demographics", "Fiscal Policy & Budgeting", "Money and Banking", "External Sector"] },
        'Environment': { 'Topics': ["Ecology and Biodiversity", "Climate Change", "Environmental Pollution", "Conservation Efforts", "National & International Policies"] },
        'General Science': { 'Topics': ["Biology (Human Body, Diseases, Nutrition)", "Physics (Basic Principles & Applications)", "Chemistry (Applications in Daily Life)", "Space Technology", "Biotechnology"] },
        'Current Affairs': { 'Topics': ["National Issues", "International Relations", "Economic Developments", "Science & Technology News", "Government Schemes", "Awards and Honors"] }
    },
    ssc: {
        'Reasoning': { 'Topics': ["Analogy", "Classification", "Series (Number, Alphabet)", "Coding-Decoding", "Blood Relations", "Syllogism", "Venn Diagrams", "Seating Arrangement", "Puzzles"] },
        'Quantitative Aptitude': { 'Topics': ["Number System", "Percentage", "Profit and Loss", "Ratio and Proportion", "Time and Work", "Time, Speed and Distance", "Simple & Compound Interest", "Algebra", "Geometry", "Trigonometry", "Data Interpretation"] },
        'English Language': { 'Topics': ["Reading Comprehension", "Cloze Test", "Fill in the Blanks", "Error Spotting", "Para Jumbles", "Idioms & Phrases", "One Word Substitution", "Synonyms & Antonyms", "Spelling Correction"] },
        'General Awareness': { 'Topics': ["History", "Geography", "Polity", "Economics", "Static GK (Awards, Books, Culture)", "General Science", "Current Affairs (Last 6 months)"] }
    },
    banking: {
        'Reasoning Ability': { 'Topics': ["Puzzles", "Seating Arrangement", "Syllogism", "Inequality", "Blood Relations", "Coding-Decoding", "Direction Sense", "Alphanumeric Series"] },
        'Quantitative Aptitude': { 'Topics': ["Data Interpretation (Tables, Charts)", "Number Series", "Simplification & Approximation", "Quadratic Equations", "Arithmetic Problems (Percentage, Ratio, etc.)"] },
        'English Language': { 'Topics': ["Reading Comprehension", "Cloze Test", "Error Spotting / Sentence Correction", "Para Jumbles", "Fillers (Single/Double)"] },
        'Banking & Financial Awareness': { 'Topics': ["Banking History & Terms", "RBI and its Functions", "Monetary Policy", "Financial Markets", "Government Schemes related to Banking", "Recent Banking News"] },
        'Computer Aptitude': { 'Topics': ["Basics of Computers", "Hardware & Software", "Operating Systems", "MS Office", "Networking", "Computer Abbreviations"] }
    },
    cuet: {
        'General Test': { 'Topics': ["General Knowledge & Current Affairs", "General Mental Ability", "Numerical Ability", "Quantitative Reasoning", "Logical and Analytical Reasoning"] },
        'English': { 'Topics': ["Reading Comprehension (Factual, Narrative, Literary)", "Verbal Ability", "Rearranging the parts", "Choosing the correct word", "Synonyms and Antonyms", "Vocabulary"] },
        'Physics': { 'Chapters': ["Based on Class 12 NCERT Syllabus"] },
        'Chemistry': { 'Chapters': ["Based on Class 12 NCERT Syllabus"] },
        'Biology': { 'Chapters': ["Based on Class 12 NCERT Syllabus"] },
        'Mathematics': { 'Chapters': ["Based on Class 12 NCERT Syllabus"] },
        'Accountancy': { 'Chapters': ["Accounting for NPOs", "Partnership Firms", "Company Accounts", "Analysis of Financial Statements", "Computerized Accounting"] },
        'Business Studies': { 'Chapters': ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling", "Financial Management", "Financial Markets", "Marketing", "Consumer Protection"] },
        'Economics': { 'Chapters': ["Introductory Microeconomics", "Introductory Macroeconomics", "Indian Economic Development"] },
        'History': { 'Chapters': ["Themes in Indian History Part-I, II & III (Class 12)"] },
        'Political Science': { 'Chapters': ["Contemporary World Politics", "Politics in India Since Independence"] },
        'Sociology': { 'Chapters': ["Indian Society", "Social Change and Development in India"] }
    },
    clat: {
        'English Language': { 'Topics': ["Passage-based Comprehension", "Vocabulary Questions from Passages", "Inference and Conclusion", "Summary of Passage", "Author's Tone and Arguments"] },
        'Current Affairs, including GK': { 'Topics': ["Passages on Contemporary Events", "National and International Affairs", "Historical Events of Significance", "Arts and Culture", "International Affairs"] },
        'Legal Reasoning': { 'Topics': ["Passages with Legal Principles", "Application of Principles to Factual Situations", "Understanding Legal Maxims and Terms", "Law of Torts", "Law of Contracts", "Constitutional Law"] },
        'Logical Reasoning': { 'Topics': ["Passage-based Critical Reasoning", "Strengthening/Weakening Arguments", "Assumptions and Conclusions", "Syllogism", "Analogies"] },
        'Quantitative Techniques': { 'Topics': ["Data Interpretation based on Passages/Graphs", "Ratio and Proportion", "Basic Algebra", "Mensuration", "Statistical Estimation"] }
    },
    nda: {
        'Mathematics': { 'Topics': ["Algebra", "Matrices and Determinants", "Trigonometry", "Analytical Geometry (2D & 3D)", "Differential Calculus", "Integral Calculus and Differential Equations", "Vector Algebra", "Statistics and Probability"] },
        'General Ability Test': {
            'English': ["Spotting Errors", "Vocabulary", "Grammar and Usage", "Comprehension"],
            'Physics': ["Mechanics", "Properties of Matter", "Heat", "Sound", "Optics", "Electricity", "Magnetism"],
            'Chemistry': ["Physical and Chemical Changes", "Elements, Mixtures, Compounds", "Laws of Chemical Combination", "Atomic Structure", "Acids, Bases, Salts", "Carbon and its Compounds"],
            'General Science (Biology)': ["Cell Biology", "Human Body", "Health and Nutrition", "Plant and Animal Kingdom"],
            'History & Freedom Movement': ["Indian History (Ancient, Medieval, Modern)", "Indian Freedom Struggle"],
            'Geography': ["Earth and its Origin", "Weathering", "Atmosphere", "Indian Geography", "World Geography"],
            'Current Events': ["National and International Events", "Important Personalities", "Sports", "Awards"]
        }
    },
    'ca-foundation': {
        'Principles and Practice of Accounting': { 'Topics': ["Theoretical Framework", "Accounting Process (Journals, Ledgers)", "Bank Reconciliation Statement", "Inventories", "Depreciation", "Bills of Exchange", "Final Accounts of Sole Proprietors", "Partnership Accounts", "Company Accounts"] },
        'Business Laws': { 'Topics': ["The Indian Contract Act, 1872", "The Sale of Goods Act, 1930", "The Indian Partnership Act, 1932", "The Limited Liability Partnership Act, 2008", "The Companies Act, 2013"] },
        'Business Correspondence and Reporting': { 'Topics': ["Communication", "Sentence Types", "Vocabulary", "Comprehension Passages", "Note Making", "Report Writing", "Email Writing"] },
        'Business Mathematics': { 'Topics': ["Ratio and Proportion, Indices, Logarithms", "Equations and Matrices", "Linear Inequalities", "Time Value of Money", "Permutations and Combinations", "Sequences and Series", "Calculus Basics"] },
        'Logical Reasoning': { 'Topics': ["Number Series, Coding, Decoding", "Direction Tests", "Seating Arrangements", "Blood Relations", "Syllogism"] },
        'Statistics': { 'Topics': ["Statistical Description of Data", "Measures of Central Tendency and Dispersion", "Probability", "Correlation and Regression", "Index Numbers"] },
        'Business Economics': { 'Topics': ["Nature & Scope of Business Economics", "Theory of Demand and Supply", "Theory of Production and Cost", "Price Determination in Different Markets", "Business Cycles"] },
        'Business and Commercial Knowledge': { 'Topics': ["Introduction to BCK", "Business Environment", "Business Organizations", "Government Policies for Business Growth", "Organizations Facilitating Business", "Common Business Terminologies"] }
    },
    'iti-polytechnic': {
        'Applied Mathematics': { 'Topics': ["Algebra", "Trigonometry", "Coordinate Geometry", "Calculus Basics", "Vectors"] },
        'Applied Science': { 'Topics': ["Units and Measurements", "Laws of Motion", "Work, Power, Energy", "Heat and Thermodynamics", "Basic Electricity", "Chemical Bonding", "Acids, Bases, Salts", "Metals and Non-metals"] },
        'Engineering Drawing (Theory)': { 'Topics': ["Drawing Instruments", "Lines and Lettering", "Dimensioning", "Scales", "Geometric Constructions", "Projections of Points and Lines", "Orthographic Projections", "Isometric Projections"] },
        'Electrician Trade': { 'Topics': ["Safety Practices", "Tools and Instruments", "Conductors and Insulators", "Ohm's Law & Kirchhoff's Law", "AC & DC Circuits", "Transformers", "Electrical Machines", "Wiring Systems"] },
        'Fitter Trade': { 'Topics': ["Safety and First Aid", "Hand Tools", "Measuring Instruments", "Cutting Tools", "Drilling", "Lathe Machine", "Gauges", "Welding"] }
    }
};



export const BADGE_DEFINITIONS: Record<BadgeKey, BadgeInfo> = {
  // Stat-based
  legend: { name: 'Legend', description: "Generate {goal} questions.", icon: Brain, goal: 100, stat: 'questionsGenerated' },
  the_goat: { name: 'The GOAT', description: "Score 100% in any mock test.", icon: Trophy, goal: 1, stat: 'perfectMockTests' },
  mock_warrior: { name: 'Mock Warrior', description: "Complete {goal} mock tests.", icon: Shield, goal: 10, stat: 'mockTestsCompleted' },
  note_ninja: { name: 'Note Ninja', description: "Save {goal} notes.", icon: BookMarked, goal: 50, stat: 'notesSaved' },
  accuracy_ace: { name: 'Accuracy Ace', description: "Maintain 90%+ accuracy in {goal} mock tests.", icon: Target, goal: 5, stat: 'highAccuracyMockTests' },
  grammar_genius: { name: 'Grammar Genius', description: "Complete {goal} grammar test questions.", icon: Puzzle, goal: 20, stat: 'grammarQuestionsCompleted' },
  lucky_spinner: { name: 'Lucky Spinner', description: "Spin the wheel {goal} times.", icon: Ticket, goal: 10, stat: 'spinsCompleted' },

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
