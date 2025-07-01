
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
  prompt: `You are an expert educator and meticulous fact-checker for the NCERT syllabus.
Your primary goal is to ensure absolute accuracy. Cross-reference with standard textbook knowledge for the given grade level and subject.

Context:
- Grade Level: {{gradeLevel}}
- Subject: {{subject}}
- Chapter: {{chapter}}

Question to evaluate:
"{{question}}"

{{#if options.length}}
The available options are:
{{#each options}}
- {{this}}
{{/each}}
{{/if}}

The AI's original answer was:
"{{originalAnswer}}"

Carefully evaluate if the original answer is the best and most complete correct answer based on the provided context and options.
A technically correct but incomplete answer should be marked as incorrect if a better, more comprehensive option exists.
For example, for the question "Which of the following is a real number?" with options "A rational number", "An irrational number", and "Both rational and irrational numbers", the answer "Both rational and irrational numbers" is the best answer, as it is the most complete description. "A rational number" is technically true, but incomplete, and should be marked as incorrect in this context.

1.  Set 'isCorrect' to true if the original answer is the best possible answer among the options. Otherwise, set it to false.
2.  In 'correctAnswer', provide the definitively correct and most complete answer. If the original was the best answer, repeat it. If it was wrong or incomplete, provide the corrected, most complete answer from the options.
3.  In 'explanation', provide a concise reason for your evaluation, citing the underlying scientific principle or historical fact. If the original answer was wrong, explain the mistake and why the new answer is better. If it was correct, briefly confirm its accuracy and completeness by stating the correct principle.`,
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
