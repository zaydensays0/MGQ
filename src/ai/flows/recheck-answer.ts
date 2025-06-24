
'use server';
/**
 * @fileOverview An AI agent that re-checks and verifies answers to questions.
 *
 * - recheckAnswer - A function that handles the answer verification process.
 */

import {ai} from '@/ai/genkit';
import {
    RecheckAnswerInputSchema,
    RecheckAnswerOutputSchema,
    type RecheckAnswerInput,
    type RecheckAnswerOutput
} from '@/types';


export async function recheckAnswer(input: RecheckAnswerInput): Promise<RecheckAnswerOutput> {
  return recheckAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recheckAnswerPrompt',
  input: {schema: RecheckAnswerInputSchema},
  output: {schema: RecheckAnswerOutputSchema},
  prompt: `You are an expert educator and fact-checker for NCERT syllabus, classes 9-12.
Your task is to verify an AI-generated answer for a given question.

Context:
- Grade Level: {{gradeLevel}}
- Subject: {{subject}}
- Chapter: {{chapter}}

Question to evaluate:
"{{question}}"

The AI's original answer was:
"{{originalAnswer}}"

Carefully evaluate if the original answer is correct and accurate based on the provided context.
1.  Set 'isCorrect' to true if the original answer is entirely correct, otherwise set it to false.
2.  In 'correctAnswer', provide the definitively correct answer. If the original was correct, just repeat it. If it was wrong, provide the corrected answer.
3.  In 'explanation', provide a concise reason for your evaluation. If the original answer was wrong, explain the mistake. If it was correct, briefly confirm its accuracy.`,
});

const recheckAnswerFlow = ai.defineFlow(
  {
    name: 'recheckAnswerFlow',
    inputSchema: RecheckAnswerInputSchema,
    outputSchema: RecheckAnswerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to recheck the answer.');
    }
    return output;
  }
);
