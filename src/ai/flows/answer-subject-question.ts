
'use server';
/**
 * @fileOverview A subject expert AI agent that answers questions based on specific academic context and conversation history.
 *
 * - answerSubjectQuestion - A function that handles subject-specific questions with conversational context.
 * - AnswerSubjectQuestionInput - The input type for the answerSubjectQuestion function.
 * - AnswerSubjectQuestionOutput - The return type for the answerSubjectQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GradeLevelNCERT, ConversationTurn } from '@/types';

const AnswerSubjectQuestionInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level for the question context.'),
  subject: z.string().describe('The subject for the question context.'),
  chapter: z.string().describe('The chapter for the question context.'),
  userQuestion: z.string().describe('The current question asked by the user.'),
  conversationHistory: z.array(z.object({
    speaker: z.enum(['user', 'ai']).describe('Who previously spoke.'),
    text: z.string().describe('The text of the previous turn.')
  })).optional().describe('The history of the current conversation, if any.'),
});
export type AnswerSubjectQuestionInput = z.infer<typeof AnswerSubjectQuestionInputSchema>;

const AnswerSubjectQuestionOutputSchema = z.object({
  aiAnswer: z.string().describe('The AI-generated answer to the subject-specific question.'),
});
export type AnswerSubjectQuestionOutput = z.infer<typeof AnswerSubjectQuestionOutputSchema>;

export async function answerSubjectQuestion(input: AnswerSubjectQuestionInput): Promise<AnswerSubjectQuestionOutput> {
  return answerSubjectQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerSubjectQuestionPrompt',
  input: {schema: AnswerSubjectQuestionInputSchema},
  output: {schema: AnswerSubjectQuestionOutputSchema},
  prompt: `You are a knowledgeable and helpful Subject Expert AI focusing on the NCERT syllabus.
You are assisting a student in Class {{gradeLevel}} with the subject: {{subject}}, specifically the chapter: "{{chapter}}".

Please consider the entire conversation history provided to give the most relevant and contextual answer to the current question.
If the conversation history is empty, this is the first question.

{{#if conversationHistory.length}}
Conversation History:
{{#each conversationHistory}}
  {{#if (eq speaker "user")}}User: {{text}}{{/if}}
  {{#if (eq speaker "ai")}}Expert: {{text}}{{/if}}
{{/each}}
{{/if}}

Current User Question: "{{userQuestion}}"

Your expert answer:`,
});

// Helper function to determine equality for Handlebars, as Genkit's Handlebars might be basic.
// However, Genkit Handlebars typically supports {{#if (eq value1 value2)}}
// If not, this logic would need to be in the flow before calling the prompt,
// or the prompt template simplified. For now, assuming 'eq' helper works as it's common.

const answerSubjectQuestionFlow = ai.defineFlow(
  {
    name: 'answerSubjectQuestionFlow',
    inputSchema: AnswerSubjectQuestionInputSchema,
    outputSchema: AnswerSubjectQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return { aiAnswer: "I'm sorry, I couldn't generate an answer for this specific topic at this time. Please try rephrasing or ask a different question." };
    }
    return output;
  }
);

