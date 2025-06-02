
'use server';
/**
 * @fileOverview A general question answering AI agent named Jarvis, with conversation history support.
 *
 * - askJarvis - A function that provides answers to general questions, considering conversation history.
 * - AskJarvisInput - The input type for the askJarvis function.
 * - AskJarvisOutput - The return type for the askJarvis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ConversationTurn } from '@/types';

const AskJarvisInputSchema = z.object({
  userQuestion: z.string().describe('The current question asked by the user.'),
  conversationHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']).describe('Who previously spoke.'),
    text: z.string().describe('The text of the previous turn.')
  })).optional().describe('The history of the current conversation, if any.'),
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
If the question is ambiguous, ask for clarification.
If you don't know the answer, say so honestly.

{{#if conversationHistory.length}}
Here is the conversation so far:
{{#each conversationHistory}}
  {{#if this.isUser}}User: {{this.text}}{{/if}}
  {{#if this.isAI}}Jarvis: {{this.text}}{{/if}}
{{/each}}
{{/if}}

Based on this conversation (if any), please answer the following new question from the user.
User's current question: "{{userQuestion}}"

Jarvis's answer:`,
});

const askJarvisFlow = ai.defineFlow(
  {
    name: 'askJarvisFlow',
    inputSchema: AskJarvisInputSchema,
    outputSchema: AskJarvisOutputSchema,
  },
  async (input) => {
    const processedHistory = input.conversationHistory?.map(turn => ({
      text: turn.text,
      isUser: turn.speaker === 'user',
      isAI: turn.speaker === 'ai',
    }));

    const promptInput = {
        userQuestion: input.userQuestion,
        conversationHistory: processedHistory,
    };

    const {output} = await prompt(promptInput);
    if (!output) {
      return { jarvisAnswer: "I'm sorry, I couldn't process your request at this time. Please try again." };
    }
    return output;
  }
);
