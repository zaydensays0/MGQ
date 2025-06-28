
'use server';
/**
 * @fileOverview An AI agent that generates mock tests with a mix of question types.
 *
 * - generateMockTest - A function that handles the test generation process.
 * - GenerateMockTestInput - The input type for the generateMockTest function.
 * - MockTestQuestion - The type for a single question in the generated test.
 * - GenerateMockTestOutput - The return type for the generateMockTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
    GenerateMockTestInputSchema,
    GenerateMockTestOutputSchema,
    type GenerateMockTestInput,
    type GenerateMockTestOutput
} from '@/types';

export async function generateMockTest(input: GenerateMockTestInput): Promise<GenerateMockTestOutput> {
  return generateMockTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMockTestPrompt',
  input: {schema: GenerateMockTestInputSchema},
  output: {schema: GenerateMockTestOutputSchema},
  prompt: `You are an expert test creator for students.
  
  Generate a mock test with exactly {{numberOfQuestions}} questions of "{{difficulty}}" difficulty for a Class {{gradeLevel}} student.
  The test should cover the following subject: "{{subject}}" and chapter(s): "{{chapters}}".
  Ensure the questions are unique, cover a broad range of topics from the chapter(s), and are not repetitive.
  
  Create a random mix of the following three question types:
  1. 'multiple_choice' (MCQ)
  2. 'true_false' (T/F)
  3. 'assertion_reason' (A/R)

  For each question, you MUST adhere to the following rules:
  - For 'multiple_choice' questions:
    - The "text" field should contain the question.
    - The "options" field MUST contain an array of exactly 4 distinct string options.
    - The "answer" field MUST be the exact text of one of the 4 options.
  - For 'true_false' questions:
    - The "text" field should contain the statement.
    - The "options" field MUST contain the array ["True", "False"].
    - The "answer" field MUST be either "True" or "False".
  - For 'assertion_reason' questions:
    - The "text" field MUST contain both an assertion and a reason, formatted with a newline separator: "Assertion (A): [Your assertion statement]\\nReason (R): [Your reason statement]".
    - The "options" field MUST be an array with the four standard options: ["Both A and R are true, and R is the correct explanation of A", "Both A and R are true, but R is not the correct explanation of A", "A is true, but R is false", "A is false, but R is true"].
    - The "answer" field MUST be the exact text of one of the four options.
  - For every question, you MUST also provide a concise "explanation" for why the answer is correct.

  Return the questions in a JSON array. Ensure the questions are relevant and challenging for the specified grade level and difficulty.
  `,
});

const generateMockTestFlow = ai.defineFlow(
  {
    name: 'generateMockTestFlow',
    inputSchema: GenerateMockTestInputSchema,
    outputSchema: GenerateMockTestOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate mock test for the specified criteria.');
    }
    return output;
  }
);
