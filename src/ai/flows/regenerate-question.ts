
// src/ai/flows/regenerate-question.ts
'use server';

/**
 * @fileOverview A flow to regenerate a question and its answer based on the same topic.
 *
 * - regenerateQuestion - A function that handles the question and answer regeneration process.
 * - RegenerateQuestionInput - The input type for the regenerateQuestion function.
 * - RegenerateQuestionOutput - The return type for the regenerateQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GradeLevelNCERT, QuestionTypeNCERT } from '@/types';

const RegenerateQuestionInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level of the question.'),
  subject: z.string().describe('The subject of the question.'),
  chapter: z.string().describe('The chapter the question is based on.'),
  questionType: z
    .enum<QuestionTypeNCERT, [
      'multiple_choice',
      'assertion_reason',
      'short_answer',
      'long_answer',
      'fill_in_the_blanks',
      'true_false',
    ]>(['multiple_choice', 'assertion_reason', 'short_answer', 'long_answer', 'fill_in_the_blanks', 'true_false'])
    .describe('The type of question to generate.'),
  originalQuestion: z.string().describe('The original question that needs to be regenerated.'),
  originalOptions: z.array(z.string()).optional().describe('The original options if the questionType was "multiple_choice".'),
});
export type RegenerateQuestionInput = z.infer<typeof RegenerateQuestionInputSchema>;

const RegenerateQuestionOutputSchema = z.object({
  regeneratedQuestion: z.string().describe('The regenerated question.'),
  regeneratedOptions: z.array(z.string()).optional().describe('An array of 4 regenerated string options if the questionType is "multiple_choice". Otherwise, this field should be omitted or an empty array.'),
  regeneratedAnswer: z.string().describe('The answer to the regenerated question. If questionType is "multiple_choice", this should be the exact text of one of the regenerated options.'),
});
export type RegenerateQuestionOutput = z.infer<typeof RegenerateQuestionOutputSchema>;

export async function regenerateQuestion(input: RegenerateQuestionInput): Promise<RegenerateQuestionOutput> {
  return regenerateQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'regenerateQuestionPrompt',
  input: {schema: RegenerateQuestionInputSchema},
  output: {schema: RegenerateQuestionOutputSchema},
  prompt: `You are an expert teacher specializing in creating NCERT textbook questions and answers for classes 9-12.

You will generate a NEW question of type "{{{questionType}}}" and its corresponding answer for grade level "{{{gradeLevel}}}", subject "{{{subject}}}", and chapter "{{{chapter}}}".

The original question was: "{{{originalQuestion}}}"
{{#if originalOptions}}
The original options were:
{{#each originalOptions}}
- {{{this}}}
{{/each}}
{{/if}}

Ensure the new question is substantially different from the original, testing a different aspect of the same concept if possible, but still relevant to the topic.

If the questionType is "multiple_choice":
- You MUST provide a "regeneratedOptions" field, which is an array of 4 distinct string options.
- The "regeneratedAnswer" field MUST be the exact text of one of these 4 regenerated options.

If the questionType is "assertion_reason":
- The "regeneratedQuestion" field MUST contain both an assertion and a reason, formatted exactly like this: "Assertion (A): [Your assertion statement]\\nReason (R): [Your reason statement]". Use a newline character to separate them.
- The "regeneratedOptions" field MUST be an array with these exact four strings:
    - "Both A and R are true, and R is the correct explanation of A"
    - "Both A and R are true, but R is not the correct explanation of A"
    - "A is true, but R is false"
    - "A is false, but R is true"
- The "regeneratedAnswer" field MUST be the exact text of one of those four options.

If the questionType is NOT "multiple_choice" or "assertion_reason":
- The "regeneratedOptions" field should be omitted or be an empty array.

Provide a concise and accurate answer for the new question.

New Question, Options (if any), and Answer:`,
});

const regenerateQuestionFlow = ai.defineFlow(
  {
    name: 'regenerateQuestionFlow',
    inputSchema: RegenerateQuestionInputSchema,
    outputSchema: RegenerateQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      return { 
        regeneratedQuestion: "Failed to regenerate question. Please try again.", 
        regeneratedAnswer: "N/A",
        regeneratedOptions: (input.questionType === 'multiple_choice' || input.questionType === 'assertion_reason') ? [] : undefined,
      };
    }
    return {
      regeneratedQuestion: output.regeneratedQuestion,
      regeneratedOptions: output.regeneratedOptions,
      regeneratedAnswer: output.regeneratedAnswer,
    };
  }
);
