
// src/ai/flows/generate-questions.ts
'use server';
/**
 * @fileOverview A question generator AI agent that generates questions from a given syllabus.
 *
 * - generateQuestions - A function that handles the question generation process.
 * - GenerateQuestionsInput - The input type for the generateQuestions function.
 * - GenerateQuestionsOutput - The return type for the generateQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionsInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the syllabus.'),
  subject: z.string().describe('The subject of the syllabus.'),
  chapter: z.string().describe('The chapter of the syllabus.'),
  questionType: z.string().describe('The type of questions to generate (e.g., MCQ, short answer, long answer).'),
  numberOfQuestions: z.number().int().positive().describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of generated questions.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are a helpful AI that generates questions for students based on their syllabus.

  Generate exactly {{numberOfQuestions}} questions of type "{{questionType}}" for grade {{gradeLevel}}, subject "{{subject}}", chapter "{{chapter}}".
  Return the questions as a JSON array of strings.
  Make sure the questions are relevant to the chapter and suitable for the specified grade level.
  If you cannot generate the exact number of questions requested, generate as many as you can up to that number.
  Example:
  {
    "questions": [
      "Question 1",
      "Question 2",
      "Question 3"
    ]
  }
  `,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
