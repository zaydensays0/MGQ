
'use server';
/**
 * @fileOverview An AI agent that generates flashcards for a specific topic.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateFlashcardsInputSchema, GenerateFlashcardsOutputSchema, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from '@/types';

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educator who creates concise and effective study flashcards for students.
  
  Generate exactly {{numberOfCards}} flashcards for a Class {{gradeLevel}} student studying the chapter "{{chapter}}" in the subject "{{subject}}".
  
  Each flashcard should have a 'front' (a key term, concept, or question) and a 'back' (a clear and concise definition or answer).
  Focus on the most important information from the chapter.

  Return the flashcards in a JSON array.
  `,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate flashcards for the specified chapter.');
    }
    return output;
  }
);
