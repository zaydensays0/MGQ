
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

export const GenerateMockTestInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level for the test.'),
  subject: z.string().describe('The subject of the test.'),
  chapters: z.string().describe('A comma-separated list of chapter names for the test.'),
  numberOfQuestions: z.number().int().positive().describe('The total number of questions to generate for the test.'),
});
export type GenerateMockTestInput = z.infer<typeof GenerateMockTestInputSchema>;

export const MockTestQuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false']).describe('The type of the question.'),
  text: z.string().describe('The question text itself.'),
  options: z.array(z.string()).optional().describe('An array of 4 strings for "multiple_choice" questions, or 2 strings (["True", "False"]) for "true_false".'),
  answer: z.string().describe('The correct answer. For "multiple_choice", it must match one of the options. For "true_false", it must be "True" or "False".'),
});
export type MockTestQuestion = z.infer<typeof MockTestQuestionSchema>;

const GenerateMockTestOutputSchema = z.object({
  questions: z.array(MockTestQuestionSchema).describe('An array of generated test questions.'),
});
export type GenerateMockTestOutput = z.infer<typeof GenerateMockTestOutputSchema>;

export async function generateMockTest(input: GenerateMockTestInput): Promise<GenerateMockTestOutput> {
  return generateMockTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMockTestPrompt',
  input: {schema: GenerateMockTestInputSchema},
  output: {schema: GenerateMockTestOutputSchema},
  prompt: `You are an expert test creator for students.
  
  Generate a mock test with exactly {{numberOfQuestions}} questions for a Class {{gradeLevel}} student.
  The test should cover the following subject: "{{subject}}" and chapter(s): "{{chapters}}".
  
  Create a random mix of the following two question types:
  1. 'multiple_choice' (MCQ)
  2. 'true_false' (T/F)

  For each question, you MUST adhere to the following rules:
  - For 'multiple_choice' questions:
    - The "options" field MUST contain an array of exactly 4 distinct string options.
    - The "answer" field MUST be the exact text of one of the 4 options.
  - For 'true_false' questions:
    - The "options" field MUST contain the array ["True", "False"].
    - The "answer" field MUST be either "True" or "False".

  Return the questions in a JSON array. Ensure the questions are relevant and challenging for the specified grade level.
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
