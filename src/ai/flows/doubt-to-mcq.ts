'use server';
/**
 * @fileOverview An AI agent that converts a user's doubt or topic into a set of multiple-choice questions.
 *
 * - doubtToMcq - A function that handles the MCQ generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
    DoubtToMcqInputSchema,
    DoubtToMcqOutputSchema,
    type DoubtToMcqInput,
    type DoubtToMcqOutput,
} from '@/types';


export async function doubtToMcq(input: DoubtToMcqInput): Promise<DoubtToMcqOutput> {
  return doubtToMcqFlow(input);
}

const prompt = ai.definePrompt({
  name: 'doubtToMcqPrompt',
  input: {schema: DoubtToMcqInputSchema},
  output: {schema: DoubtToMcqOutputSchema},
  prompt: `You are an expert educator who excels at creating practice questions to help students solidify their understanding.
  
A student has provided a doubt, a concept, or a topic they are confused about. Your task is to generate 3-5 high-quality Multiple Choice Questions (MCQs) directly related to their input. These questions should be designed to test their understanding and help them overcome their confusion.

For each question, you MUST adhere to the following structure:
- "question": The question text.
- "options": An array of exactly 4 distinct string options.
- "answer": The single correct answer, which must exactly match one of the four options.

User's doubt/topic: "{{doubt}}"

Generate the MCQs now.`,
});

const doubtToMcqFlow = ai.defineFlow(
  {
    name: 'doubtToMcqFlow',
    inputSchema: DoubtToMcqInputSchema,
    outputSchema: DoubtToMcqOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error('Failed to generate MCQs for the provided topic. Please try rephrasing.');
    }
    return output;
  }
);
