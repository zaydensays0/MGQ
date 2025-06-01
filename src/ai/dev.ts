
import { config } from 'dotenv';
config();

import '@/ai/flows/regenerate-question.ts';
import '@/ai/flows/generate-questions.ts';
import '@/ai/flows/answer-grammar-question.ts';
import '@/ai/flows/ask-jarvis.ts'; // Added Jarvis flow
// import '@/ai/flows/answer-subject-question.ts'; // Removed Subject Expert flow

