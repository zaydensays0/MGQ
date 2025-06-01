// src/ai/flows/regenerate-question.ts
'use server';

/**
 * @fileOverview A flow to regenerate a question based on the same topic.
 *
 * - regenerateQuestion - A function that handles the question regeneration process.
 * - RegenerateQuestionInput - The input type for the regenerateQuestion function.
 * - RegenerateQuestionOutput - The return type for the regenerateQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RegenerateQuestionInputSchema = z.object({
  gradeLevel: z.enum(['9', '10', '11', '12']).describe('The grade level of the question.'),
  subject: z.string().describe('The subject of the question.'),
  chapter: z.string().describe('The chapter the question is based on.'),
  questionType: z
    .enum([
      'multiple choice',
      'short answer',
      'long answer',
      'fill in the blanks',
      'true/false',
    ])
    .describe('The type of question to generate.'),
  originalQuestion: z.string().describe('The original question that needs to be regenerated.'),
});
export type RegenerateQuestionInput = z.infer<typeof RegenerateQuestionInputSchema>;

const RegenerateQuestionOutputSchema = z.object({
  regeneratedQuestion: z.string().describe('The regenerated question.'),
});
export type RegenerateQuestionOutput = z.infer<typeof RegenerateQuestionOutputSchema>;

export async function regenerateQuestion(input: RegenerateQuestionInput): Promise<RegenerateQuestionOutput> {
  return regenerateQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'regenerateQuestionPrompt',
  input: {schema: RegenerateQuestionInputSchema},
  output: {schema: RegenerateQuestionOutputSchema},
  prompt: `You are an expert teacher specializing in creating NCERT textbook questions for classes 9-12.

You will generate a new question of type "{{{questionType}}}" for grade level "{{{gradeLevel}}}", subject "{{{subject}}}", and chapter "{{{chapter}}}".

The original question was: "{{{originalQuestion}}}".

Ensure the new question is different from the original but still relevant to the topic.

New Question:`,
});

const regenerateQuestionFlow = ai.defineFlow(
  {
    name: 'regenerateQuestionFlow',
    inputSchema: RegenerateQuestionInputSchema,
    outputSchema: RegenerateQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      regeneratedQuestion: output!.regeneratedQuestion,
    };
  }
);
