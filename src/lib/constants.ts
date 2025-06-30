
import type { SubjectOption, QuestionTypeOption, GradeLevelNCERT, BadgeKey, BadgeInfo, Stream, StreamSyllabus, Board, BoardId } from '@/types';
import { 
    Calculator, FlaskConical, BookOpenText, Globe2, NotebookText, LucideIcon,
    Brain, Trophy, PenLine, Shield, BookMarked, Target, Puzzle, Gem, Rocket,
    TrendingUp, Moon, Coins, Database, Award, Crown, Star, Flame, Unlock, Leaf,
    Stethoscope, Atom, HeartPulse, Code, Landmark, Users, Banknote, GraduationCap, Gavel, Wrench, Ticket, Building
} from 'lucide-react';

export const GRADE_LEVELS: GradeLevelNCERT[] = ['5', '6', '7', '8', '9', '10', '11', '12'];
export const BOARD_CLASSES: ('9' | '10')[] = ['9', '10'];

export const BOARDS: Board[] = [
    { id: 'cbse', name: 'CBSE' },
    { id: 'icse', name: 'ICSE' },
    { id: 'seba', name: 'SEBA (Assam)' },
    { id: 'maharashtra', name: 'Maharashtra State Board' },
    { id: 'tamil_nadu', name: 'Tamil Nadu Board' },
    { id: 'kerala', name: 'Kerala Board' },
    { id: 'west_bengal', name: 'West Bengal Board' },
    { id: 'bihar', name: 'Bihar Board' },
    { id: 'up', name: 'UP Board' },
    { id: 'karnataka', name: 'Karnataka Board' },
];

export const BOARD_QUESTION_TYPES = [
    { value: 'mcq', label: 'MCQ (Multiple Choice)' },
    { value: 'vsa', label: 'Very Short Answer (1 mark)' },
    { value: 'sa', label: 'Short Answer (2-3 marks)' },
    { value: 'la', label: 'Long Answer (5 marks)' },
    { value: 'assertion_reason', label: 'Assertion-Reason' },
    { value: 'case_based', label: 'Case/Source-Based' },
];

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
        description: 'Medical entrance exam prep.',
        icon: Stethoscope,
    },
    {
        id: 'jee',
        name: 'JEE (Main & Advanced)',
        description: 'Engineering entrance exam prep.',
        icon: Atom,
    },
    {
        id: 'mbbs',
        name: 'MBBS Coursework',
        description: 'All-years medical college subjects.',
        icon: HeartPulse,
    },
    {
        id: 'btech',
        name: 'B.Tech Coursework',
        description: 'Subject-wise engineering prep.',
        icon: Code,
    },
    {
        id: 'upsc',
        name: 'UPSC (Prelims)',
        description: 'Civil Services Exam foundation.',
        icon: Landmark,
    },
    {
        id: 'ssc',
        name: 'SSC (CGL/CHSL)',
        description: 'Staff Selection Commission exams.',
        icon: Users,
    },
    {
        id: 'banking',
        name: 'Banking (PO/Clerk)',
        description: 'Prep for IBPS, SBI, and RBI exams.',
        icon: Banknote,
    },
    {
        id: 'cuet',
        name: 'CUET-UG',
        description: 'Common University Entrance Test.',
        icon: GraduationCap,
    },
    {
        id: 'clat',
        name: 'CLAT',
        description: 'Common Law Admission Test prep.',
        icon: Gavel,
    },
    {
        id: 'nda',
        name: 'NDA',
        description: 'National Defence Academy exam.',
        icon: Shield,
    },
    {
        id: 'ca-foundation',
        name: 'CA Exams',
        description: 'Chartered Accountancy prep.',
        icon: Calculator,
    },
    {
        id: 'iti-polytechnic',
        name: 'ITI & Polytechnic',
        description: 'Vocational & technical courses.',
        icon: Wrench,
    }
];

export const STREAM_SYLLABUS: StreamSyllabus = {
    neet: {
        'Class 11': {
            'Physics': ["Physical World", "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids & Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
            'Chemistry': ["Basic Concepts of Chemistry", "Structure of Atom", "Periodicity", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements (Group 13-14)", "Organic Chemistry Basics", "Hydrocarbons", "Environmental Chemistry"],
            'Biology': ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell", "Biomolecules", "Cell Cycle", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration in Plants", "Plant Growth", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products", "Locomotion and Movement", "Neural Control", "Chemical Coordination"],
        },
        'Class 12': {
            'Physics': ["Electric Charges and Fields", "Electrostatic Potential", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Radiation", "Atoms", "Nuclei", "Semiconductor Electronics"],
            'Chemistry': ["Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "p-Block Elements (Group 15-18)", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols, Ethers", "Aldehydes, Ketones, Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
            'Biology': ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Genetics and Evolution", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology", "Biotech Applications", "Organisms and Populations", "Ecosystem", "Biodiversity", "Environmental Issues"]
        }
    },
    jee: {
        'Class 11': {
            'Physics': ["Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations and Waves"],
            'Chemistry': {
                'Physical': ["Some Basic Concepts in Chemistry", "States of Matter", "Atomic Structure", "Chemical Bonding", "Chemical Thermodynamics", "Equilibrium", "Redox Reactions"],
                'Inorganic': ["Classification of Elements", "Hydrogen", "s-Block Elements", "p-Block Elements (Group 13-14)", "Environmental Chemistry"],
                'Organic': ["Purification and Characterisation of Organic Compounds", "Some Basic Principles of Organic Chemistry", "Hydrocarbons"]
            },
            'Mathematics': ["Sets, Relations, and Functions", "Complex Numbers and Quadratic Equations", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", "Introduction to Three-Dimensional Geometry", "Limits and Derivatives", "Mathematical Reasoning", "Statistics", "Probability", "Trigonometry"]
        },
        'Class 12': {
            'Physics': ["Electrostatics", "Current Electricity", "Magnetic Effects of Current", "Electromagnetic Induction and AC", "Electromagnetic Waves", "Optics", "Dual Nature of Matter and Radiation", "Atoms and Nuclei", "Electronic Devices", "Communication Systems"],
            'Chemistry': {
                'Physical': ["Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Solid State"],
                'Inorganic': ["General Principles of Metallurgy", "p-Block Elements (Group 15-18)", "d- and f-Block Elements", "Coordination Compounds"],
                'Organic': ["Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Organic Compounds Containing Nitrogen", "Biomolecules", "Polymers", "Chemistry in Everyday Life"]
            },
            'Mathematics': ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Applications of Derivatives", "Integrals", "Applications of the Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"]
        }
    },
    mbbs: {
        '1st Year': {
            'Anatomy': ["General Anatomy", "Gross Anatomy (Upper Limb, Lower Limb, Thorax, Abdomen, Head & Neck)", "Histology (Microanatomy)", "Embryology", "Neuroanatomy"],
            'Physiology': ["General Physiology", "Nerve-Muscle Physiology", "Blood", "Cardiovascular System", "Respiratory System", "Gastrointestinal System", "Renal Physiology", "Endocrine System", "Reproductive System", "Central Nervous System", "Special Senses"],
            'Biochemistry': ["Chemistry of Biomolecules", "Enzymes", "Metabolism of Carbohydrates", "Metabolism of Lipids", "Metabolism of Amino Acids & Proteins", "Nucleotide Metabolism", "Molecular Biology", "Hormones", "Nutrition", "Organ Function Tests"]
        },
        '2nd Year': {
            'Pathology': ["General Pathology (Cell Injury, Inflammation)", "Systemic Pathology (CVS, RS, GIT, etc.)", "Hematology"],
            'Pharmacology': ["General Pharmacology", "Autonomic Nervous System", "Cardiovascular Drugs", "Antimicrobial Agents", "CNS Pharmacology"],
            'Microbiology': ["General Microbiology", "Immunology", "Bacteriology", "Virology", "Parasitology", "Mycology"],
            'Forensic Medicine': ["Medical Jurisprudence & Ethics", "Thanatology (Death)", "Asphyxial Deaths", "Injuries", "Toxicology"]
        },
        '3rd Year': {
            'Community Medicine (PSM)': ["Epidemiology", "Biostatistics", "Health Programs in India", "Nutrition", "Environmental Health"],
            'ENT (Otorhinolaryngology)': ["Anatomy of Ear, Nose, Throat", "Common Diseases of the Ear", "Common Diseases of the Nose and Sinuses", "Common Throat Conditions"],
            'Ophthalmology': ["Anatomy of the Eye", "Refractive Errors", "Cataract", "Glaucoma", "Common Retinal Diseases"]
        },
        'Final Year': {
            'Medicine': ["Cardiology", "Neurology", "Gastroenterology", "Endocrinology", "Infectious Diseases"],
            'Surgery': ["General Surgery Principles", "Trauma", "Common Abdominal Surgeries", "Surgical Oncology"],
            'Obstetrics & Gynecology': ["Antenatal Care", "Normal Labor", "Common Gynecological Problems", "Contraception"],
            'Pediatrics': ["Normal Newborn", "Growth and Development", "Common Childhood Infections", "Vaccination"]
        }
    },
    btech: {
        '1st Year': {
            'Engineering Mathematics': ["Calculus (Differential & Integral)", "Matrices", "Vector Calculus", "Differential Equations"],
            'Physics': ["Mechanics", "Optics", "Electromagnetism", "Quantum Mechanics", "Thermodynamics"],
            'Basic Electrical Engineering': ["DC Circuits", "AC Circuits", "Transformers", "Electrical Machines (DC/AC Motors)"],
            'Programming in C': ["Introduction to C", "Operators and Expressions", "Control Structures", "Functions", "Arrays", "Pointers", "Structures"],
            'Engineering Drawing (Theory)': ["Drawing Instruments", "Lines and Lettering", "Dimensioning", "Projections of Points and Lines", "Orthographic Projections"]
        },
        '2nd Year': {
            'Advanced Engineering Mathematics': ["Complex Variables", "Laplace Transforms", "Fourier Series", "Probability and Statistics"],
            'Data Structures': ["Arrays, Stacks, Queues", "Linked Lists", "Trees", "Graphs", "Sorting and Searching Algorithms"],
            'Digital Logic Design': ["Number Systems", "Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Memory and PLDs"],
            'Object Oriented Programming': ["Concepts of OOP", "Classes and Objects", "Inheritance", "Polymorphism", "Exception Handling"],
            'Thermodynamics': ["First Law", "Second Law", "Properties of Pure Substances", "Power Cycles", "Refrigeration Cycles"]
        }
    },
    upsc: {
        'Prelims GS': {
            'History': ["Ancient Indian History", "Medieval Indian History", "Modern Indian History (Freedom Struggle)", "Post-Independence India", "World History"],
            'Geography': ["Physical Geography (Geomorphology, Climatology, Oceanography)", "Indian Geography", "World Geography (Regional)", "Human and Economic Geography"],
            'Polity': ["Indian Constitution", "System of Government (Union & State)", "Judiciary", "Panchayati Raj", "Constitutional & Non-Constitutional Bodies", "Governance Issues"],
            'Economy': ["Basics of Indian Economy", "Planning & Economic Development", "Poverty, Inclusion, Demographics", "Fiscal Policy & Budgeting", "Money and Banking", "External Sector"],
            'Environment': ["Ecology and Biodiversity", "Climate Change", "Environmental Pollution", "Conservation Efforts", "National & International Policies"],
            'General Science': ["Biology (Human Body, Diseases, Nutrition)", "Physics (Basic Principles & Applications)", "Chemistry (Applications in Daily Life)", "Space Technology", "Biotechnology"],
            'Current Affairs': ["National Issues", "International Relations", "Economic Developments", "Science & Technology News", "Government Schemes", "Awards and Honors"]
        }
    },
    ssc: {
        'Tier-I': {
            'Reasoning': ["Analogy", "Classification", "Series (Number, Alphabet)", "Coding-Decoding", "Blood Relations", "Syllogism", "Venn Diagrams", "Seating Arrangement", "Puzzles"],
            'Quantitative Aptitude': ["Number System", "Percentage", "Profit and Loss", "Ratio and Proportion", "Time and Work", "Time, Speed and Distance", "Simple & Compound Interest", "Algebra", "Geometry", "Trigonometry", "Data Interpretation"],
            'English Language': ["Reading Comprehension", "Cloze Test", "Fill in the Blanks", "Error Spotting", "Para Jumbles", "Idioms & Phrases", "One Word Substitution", "Synonyms & Antonyms", "Spelling Correction"],
            'General Awareness': ["History", "Geography", "Polity", "Economics", "Static GK (Awards, Books, Culture)", "General Science", "Current Affairs (Last 6 months)"]
        }
    },
    banking: {
        'Prelims': {
            'Reasoning Ability': ["Puzzles", "Seating Arrangement", "Syllogism", "Inequality", "Blood Relations", "Coding-Decoding", "Direction Sense", "Alphanumeric Series"],
            'Quantitative Aptitude': ["Data Interpretation (Tables, Charts)", "Number Series", "Simplification & Approximation", "Quadratic Equations", "Arithmetic Problems (Percentage, Ratio, etc.)"],
            'English Language': ["Reading Comprehension", "Cloze Test", "Error Spotting / Sentence Correction", "Para Jumbles", "Fillers (Single/Double)"]
        },
        'Mains': {
            'Reasoning & Computer Aptitude': ["Advanced Puzzles", "Input-Output", "Data Sufficiency", "Basics of Computers", "Networking"],
            'Data Analysis & Interpretation': ["Advanced DI Sets", "Logical DI", "Quantity-based problems"],
            'English Language': ["Advanced RC", "Vocabulary-based questions", "Sentence Connectors"],
            'General/Financial Awareness': ["Banking History & Terms", "RBI and its Functions", "Monetary Policy", "Financial Markets", "Government Schemes related to Banking", "Recent Banking News (Last 6 months)"]
        }
    },
    cuet: {
        'Domain Subjects': {
            'General Test': ["General Knowledge & Current Affairs", "General Mental Ability", "Numerical Ability", "Quantitative Reasoning", "Logical and Analytical Reasoning"],
            'English': ["Reading Comprehension (Factual, Narrative, Literary)", "Verbal Ability", "Rearranging the parts", "Choosing the correct word", "Synonyms and Antonyms", "Vocabulary"],
            'Physics': ["Class 12 NCERT Full Syllabus"],
            'Chemistry': ["Class 12 NCERT Full Syllabus"],
            'Biology': ["Class 12 NCERT Full Syllabus"],
            'Mathematics': ["Class 12 NCERT Full Syllabus"],
            'Accountancy': ["Accounting for NPOs", "Partnership Firms", "Company Accounts", "Analysis of Financial Statements", "Computerized Accounting"],
            'Business Studies': ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling", "Financial Management", "Financial Markets", "Marketing", "Consumer Protection"],
            'Economics': ["Introductory Microeconomics", "Introductory Macroeconomics", "Indian Economic Development"],
            'History': ["Themes in Indian History Part-I, II &amp; III (Class 12)"],
            'Political Science': ["Contemporary World Politics", "Politics in India Since Independence"],
            'Sociology': ["Indian Society", "Social Change and Development in India"]
        }
    },
    clat: {
        'All Sections': {
            'English Language': ["Passage-based Comprehension", "Vocabulary Questions from Passages", "Inference and Conclusion", "Summary of Passage", "Author's Tone and Arguments"],
            'Current Affairs, including GK': ["Passages on Contemporary Events", "National and International Affairs", "Historical Events of Significance", "Arts and Culture", "International Affairs"],
            'Legal Reasoning': ["Passages with Legal Principles", "Application of Principles to Factual Situations", "Understanding Legal Maxims and Terms", "Law of Torts", "Law of Contracts", "Constitutional Law"],
            'Logical Reasoning': ["Passage-based Critical Reasoning", "Strengthening/Weakening Arguments", "Assumptions and Conclusions", "Syllogism", "Analogies"],
            'Quantitative Techniques': ["Data Interpretation based on Passages/Graphs", "Ratio and Proportion", "Basic Algebra", "Mensuration", "Statistical Estimation"]
        }
    },
    nda: {
        'Paper I': {
            'Mathematics': ["Algebra", "Matrices and Determinants", "Trigonometry", "Analytical Geometry (2D &amp; 3D)", "Differential Calculus", "Integral Calculus and Differential Equations", "Vector Algebra", "Statistics and Probability"]
        },
        'Paper II': {
            'English': ["Spotting Errors", "Vocabulary", "Grammar and Usage", "Comprehension"],
            'Physics': ["Mechanics", "Properties of Matter", "Heat", "Sound", "Optics", "Electricity", "Magnetism"],
            'Chemistry': ["Physical and Chemical Changes", "Elements, Mixtures, Compounds", "Laws of Chemical Combination", "Atomic Structure", "Acids, Bases, Salts", "Carbon and its Compounds"],
            'General Science (Biology)': ["Cell Biology", "Human Body", "Health and Nutrition", "Plant and Animal Kingdom"],
            'History &amp; Freedom Movement': ["Indian History (Ancient, Medieval, Modern)", "Indian Freedom Struggle"],
            'Geography': ["Earth and its Origin", "Weathering", "Atmosphere", "Indian Geography", "World Geography"],
            'Current Events': ["National and International Events", "Important Personalities", "Sports", "Awards"]
        }
    },
    'ca-foundation': {
        'Foundation': {
            'Principles and Practice of Accounting': ["Theoretical Framework", "Accounting Process (Journals, Ledgers)", "Bank Reconciliation Statement", "Inventories", "Depreciation", "Bills of Exchange", "Final Accounts of Sole Proprietors", "Partnership Accounts", "Company Accounts"],
            'Business Laws': ["The Indian Contract Act, 1872", "The Sale of Goods Act, 1930", "The Indian Partnership Act, 1932", "The Limited Liability Partnership Act, 2008", "The Companies Act, 2013"],
            'Business Correspondence and Reporting': ["Communication", "Sentence Types", "Vocabulary", "Comprehension Passages", "Note Making", "Report Writing", "Email Writing"],
            'Business Mathematics, Logical Reasoning &amp; Statistics': ["Ratio and Proportion", "Equations", "Linear Inequalities", "Time Value of Money", "Permutations and Combinations", "Sequences and Series", "Number Series, Coding", "Direction Tests", "Seating Arrangements", "Statistical Description", "Measures of Central Tendency", "Probability", "Correlation and Regression"],
            'Business Economics &amp; Commercial Knowledge': ["Nature &amp; Scope of Business Economics", "Theory of Demand and Supply", "Theory of Production and Cost", "Price Determination", "Business Cycles", "Business Environment", "Business Organizations", "Government Policies"]
        },
        'Intermediate': {
            'Accounting': ["Accounting Standards", "Company Accounts", "Partnership Accounts advanced", "Branch Accounts"],
            'Corporate and Other Laws': ["The Companies Act, 2013 (Advanced)", "Negotiable Instruments Act, 1881", "General Clauses Act, 1897"],
            'Taxation': ["Income-tax Law", "Goods and Services Tax (GST)"],
            'Cost and Management Accounting': ["Cost Ascertainment", "Budgeting", "Standard Costing", "Marginal Costing"]
        },
        'Final': {
            'Financial Reporting': ["Ind AS (Indian Accounting Standards)", "Business Combinations", "Consolidated Financial Statements"],
            'Strategic Financial Management': ["Financial Policy", "Portfolio Management", "Derivatives", "International Financial Management"],
            'Advanced Auditing and Professional Ethics': ["Auditing Standards", "Audit of Different Entities", "Professional Ethics"],
            'Direct Tax Laws &amp; International Taxation': ["Advanced topics in Direct Tax", "International Taxation treaties"],
            'Indirect Tax Laws': ["Advanced topics in GST", "Customs &amp; FTP (Foreign Trade Policy)"]
        }
    },
    'iti-polytechnic': {
        'Year 1': {
            'Applied Mathematics': ["Algebra", "Trigonometry", "Coordinate Geometry", "Calculus Basics", "Vectors"],
            'Applied Science': ["Units and Measurements", "Laws of Motion", "Work, Power, Energy", "Heat and Thermodynamics", "Basic Electricity", "Chemical Bonding", "Acids, Bases, Salts", "Metals and Non-metals"],
            'Engineering Drawing (Theory)': ["Drawing Instruments", "Lines and Lettering", "Dimensioning", "Scales", "Geometric Constructions", "Projections of Points and Lines", "Orthographic Projections", "Isometric Projections"],
            'Workshop Technology': ["Carpentry", "Fitting", "Welding", "Sheet Metal Work"],
        },
        'Year 2': {
             'Trade Theory (Electrician)': ["Safety Practices", "Tools and Instruments", "Conductors and Insulators", "Ohm's Law &amp; Kirchhoff's Law", "AC &amp; DC Circuits", "Transformers", "Electrical Machines", "Wiring Systems"],
            'Trade Theory (Fitter)': ["Safety and First Aid", "Hand Tools", "Measuring Instruments", "Cutting Tools", "Drilling", "Lathe Machine", "Gauges", "Welding"]
        }
    }
};

export const BADGE_DEFINITIONS: Record<BadgeKey, BadgeInfo> = {
  // Stat-based
  legend: { name: 'Legend', description: "Generate {goal} questions.", icon: Brain, goal: 100, stat: 'questionsGenerated' },
  note_ninja: { name: 'Note Ninja', description: "Save {goal} notes.", icon: BookMarked, goal: 50, stat: 'notesSaved' },
  grammar_genius: { name: 'Grammar Genius', description: "Complete {goal} grammar test questions.", icon: Puzzle, goal: 20, stat: 'grammarQuestionsCompleted' },
  lucky_spinner: { name: 'Lucky Spinner', description: "Spin the wheel {goal} times.", icon: Ticket, goal: 10, stat: 'spinsCompleted' },

  // Streak-based
  streak_master: { name: 'Streak Master', description: "Maintain a {goal}-day study streak.", icon: Flame, goal: 7, stat: 'streak' },
  
  // Complex / situational
  elite_learner: { name: 'Elite Learner', description: "Unlock any {goal} badges.", icon: Gem, goal: 5, stat: 'badges' },
  welcome_rookie: { name: 'Welcome Rookie', description: "Earned by successfully logging in for the first time.", icon: Unlock, goal: 1, stat: 'xp' },

  // XP-based
  xp_hunter: { name: 'XP Hunter', description: "Earn {goal} XP.", icon: Coins, goal: 1000, stat: 'xp' },
  xp_prodigy: { name: 'XP Prodigy', description: "Earn {goal} XP.", icon: Database, goal: 10000, stat: 'xp' },
  xp_master: { name: 'XP Master', description: "Earn {goal} XP.", icon: Award, goal: 30000, stat: 'xp' },
  xp_king_queen: { name: 'XP King/Queen', description: "Earn {goal} XP.", icon: Crown, goal: 50000, stat: 'xp' },
  xp_legend: { name: 'XP Legend', description: "Earn {goal} XP.", icon: Star, goal: 70000, stat: 'xp' },
  xp_god_mode: { name: 'XP God Mode', description: "Earn {goal} XP.", icon: Flame, goal: 100000, stat: 'xp' },
};
