
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
  prompt: `You are an expert question creator for the NEET medical entrance exam in India, focusing on NCERT syllabus for Class {{classLevel}}.
  
  Generate exactly {{numberOfQuestions}} high-quality, NEET-pattern questions for the subject "{{subject}}", covering the chapter "{{chapter}}".
  
  Ensure a good mix of the following question types:
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
  - "explanation": A clear, concise explanation for why the provided answer is correct, including calculations for numerical problems.
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
