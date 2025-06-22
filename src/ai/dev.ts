
import { config } from 'dotenv';
config();

import '@/ai/flows/regenerate-question.ts';
import '@/ai/flows/generate-questions.ts';
import '@/ai/flows/answer-grammar-question.ts';
import '@/ai/flows/ask-jarvis.ts';
import '@/ai/flows/answer-subject-question.ts'; // Added Subject Expert flow
import '@/ai/flows/generate-notes-by-chapter.ts';
import '@/ai/flows/summarize-text.ts';
import '@/ai/flows/generate-mock-test.ts';
import '@/ai/flows/generate-flashcards.ts';
