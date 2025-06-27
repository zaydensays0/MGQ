
'use server';
/**
 * @fileOverview An AI agent that generates NEET-specific questions.
 *
 * - generateNeetQuestions - A function that handles the NEET question generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateNeetQuestionsInputSchema, GenerateNeetQuestionsOutputSchema, type GenerateNeetQuestionsInput, type GenerateNeetQuestionsOutput } from '@/types';


export async function generateNeetQuestions(input: GenerateNeetQuestionsInput): Promise<GenerateNeetQuestionsOutput> {
  return generateNeetQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNeetQuestionsPrompt',
  input: {schema: GenerateNeetQuestionsInputSchema},
  output: {schema: GenerateNeetQuestionsOutputSchema},
  prompt: `You are an expert paper setter for the NEET medical entrance exam in India, focusing on the NCERT syllabus for Class {{classLevel}}.

{{#if isComprehensive}}
Your task is to generate a COMPREHENSIVE set of high-quality, NEET-pattern questions for the subject "{{subject}}", covering the chapter "{{chapter}}". Your goal is to create a question bank that allows a student to fully master the chapter. The questions should be so thorough that there is a high probability of similar questions appearing in the actual NEET exam.
Generate a sufficient number of questions (around 15-25, depending on chapter length) to cover all critical concepts, important diagrams, data, formulas, and potential tricky areas within the chapter.
{{else}}
Your task is to generate exactly {{numberOfQuestions}} high-quality, NEET-pattern questions for the subject "{{subject}}", covering the chapter "{{chapter}}".
{{/if}}

Ensure a good mix of the following question types, reflecting the real NEET exam pattern:
- 'mcq': A standard multiple-choice question with a single correct answer.
- 'assertion_reason': An assertion and reason style question.
- 'numerical': A problem-solving question where the answer is a number (especially for Physics and Chemistry).

For each question, you MUST provide:
- "type": One of 'mcq', 'assertion_reason', or 'numerical'.
- "text": The question text. For 'assertion_reason', it MUST contain both, formatted with a newline separator: "Assertion (A): [statement]\\nReason (R): [statement]".
- "options":
  - For 'mcq' and 'assertion_reason', provide an array of exactly 4 distinct string options. For 'assertion_reason', use the four standard A/R options.
  - This field can be omitted for 'numerical' questions.
- "answer": The single correct answer. For 'mcq'/'assertion_reason', it must match an option. For 'numerical', it should be the numerical result as a string.
- "explanation": A clear, concise explanation for why the provided answer is correct. For numerical problems, this MUST be a detailed, step-by-step solution.
- "difficulty": The difficulty level, which must be one of 'easy', 'medium', or 'hard'.

Generate the questions now, ensuring they are unique, challenging, and strictly relevant to the specified chapter and NEET exam standard.`,
});

const generateNeetQuestionsFlow = ai.defineFlow(
  {
    name: 'generateNeetQuestionsFlow',
    inputSchema: GenerateNeetQuestionsInputSchema,
    outputSchema: GenerateNeetQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error('Failed to generate NEET questions for the provided chapter. Please try again.');
    }
    return output;
  }
);
