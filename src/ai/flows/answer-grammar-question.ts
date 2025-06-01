
'use server';
/**
 * @fileOverview A grammar question answering AI agent.
 *
 * - answerGrammarQuestion - A function that provides answers to grammar-related questions.
 * - AnswerGrammarQuestionInput - The input type for the answerGrammarQuestion function.
 * - AnswerGrammarQuestionOutput - The return type for the answerGrammarQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerGrammarQuestionInputSchema = z.object({
  userQuestion: z.string().describe('The grammar-related question asked by the user.'),
});
export type AnswerGrammarQuestionInput = z.infer<typeof AnswerGrammarQuestionInputSchema>;

const AnswerGrammarQuestionOutputSchema = z.object({
  aiAnswer: z.string().describe('The AI-generated answer to the grammar question, including explanations and examples if relevant.'),
});
export type AnswerGrammarQuestionOutput = z.infer<typeof AnswerGrammarQuestionOutputSchema>;

export async function answerGrammarQuestion(input: AnswerGrammarQuestionInput): Promise<AnswerGrammarQuestionOutput> {
  return answerGrammarQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerGrammarQuestionPrompt',
  input: {schema: AnswerGrammarQuestionInputSchema},
  output: {schema: AnswerGrammarQuestionOutputSchema},
  prompt: `You are an expert English grammar tutor. The user has a grammar-related question.
Provide a clear, concise, and accurate answer to the user's question.
If appropriate, include examples to illustrate your explanation.
Break down complex topics into easily understandable parts.

User's question: "{{userQuestion}}"

Your answer:`,
});

const answerGrammarQuestionFlow = ai.defineFlow(
  {
    name: 'answerGrammarQuestionFlow',
    inputSchema: AnswerGrammarQuestionInputSchema,
    outputSchema: AnswerGrammarQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
