
'use server';
/**
 * @fileOverview An AI agent that generates grammar tests.
 *
 * - generateGrammarTest - A function that handles the grammar test generation process.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateGrammarTestInputSchema,
    GenerateGrammarTestOutputSchema,
    type GenerateGrammarTestInput,
    type GenerateGrammarTestOutput,
} from '@/types';


export async function generateGrammarTest(input: GenerateGrammarTestInput): Promise<GenerateGrammarTestOutput> {
  return generateGrammarTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGrammarTestPrompt',
  input: {schema: GenerateGrammarTestInputSchema},
  output: {schema: GenerateGrammarTestOutputSchema},
  prompt: `You are an expert English grammar teacher.
  
  Generate a grammar test with exactly {{numberOfQuestions}} questions of type "{{questionType}}" for a Class {{gradeLevel}} student.
  The test should focus on the grammar topic: "{{topic}}".
  
  For each question, you MUST adhere to the following rules:
  - For 'multiple_choice' questions:
    - The "text" field should contain the question.
    - The "options" field MUST contain an array of exactly 4 distinct string options.
    - The "answer" field MUST be the exact text of one of the 4 options.
  - For 'true_false' questions:
    - The "text" field should contain the statement.
    - The "options" field must be omitted or be an empty array.
    - The "answer" field MUST be either "True" or "False".
  - For 'direct_answer' questions:
    - The "text" field should be a question that requires the user to type an answer (e.g., filling in a blank, correcting a sentence).
    - The "options" field must be omitted or be an empty array.
    - The "answer" field must contain the single, correct word or phrase.

  Return the questions in a JSON array. Ensure the questions are relevant and appropriate for the specified grade level and topic.
  `,
});

const generateGrammarTestFlow = ai.defineFlow(
  {
    name: 'generateGrammarTestFlow',
    inputSchema: GenerateGrammarTestInputSchema,
    outputSchema: GenerateGrammarTestOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error('Failed to generate grammar test for the specified criteria.');
    }
    return output;
  }
);
