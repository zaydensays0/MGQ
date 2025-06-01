
'use server';
/**
 * @fileOverview A general question answering AI agent named Jarvis.
 *
 * - askJarvis - A function that provides answers to general questions.
 * - AskJarvisInput - The input type for the askJarvis function.
 * - AskJarvisOutput - The return type for the askJarvis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskJarvisInputSchema = z.object({
  userQuestion: z.string().describe('The general question asked by the user.'),
});
export type AskJarvisInput = z.infer<typeof AskJarvisInputSchema>;

const AskJarvisOutputSchema = z.object({
  jarvisAnswer: z.string().describe('The AI-generated answer from Jarvis to the general question.'),
});
export type AskJarvisOutput = z.infer<typeof AskJarvisOutputSchema>;

export async function askJarvis(input: AskJarvisInput): Promise<AskJarvisOutput> {
  return askJarvisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askJarvisPrompt',
  input: {schema: AskJarvisInputSchema},
  output: {schema: AskJarvisOutputSchema},
  prompt: `You are Jarvis, a highly intelligent and versatile AI assistant.
You are helpful, polite, and knowledgeable across a wide range of topics.
The user has asked a question. Provide a comprehensive, clear, and accurate answer.
If the question is ambiguous, ask for clarification.
If you don't know the answer, say so honestly.

User's question: "{{userQuestion}}"

Jarvis's answer:`,
});

const askJarvisFlow = ai.defineFlow(
  {
    name: 'askJarvisFlow',
    inputSchema: AskJarvisInputSchema,
    outputSchema: AskJarvisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
