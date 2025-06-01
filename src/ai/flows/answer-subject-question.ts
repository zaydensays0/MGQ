
'use server';
/**
 * @fileOverview An AI agent that answers subject-specific questions for a given class and chapter,
 * supporting conversational follow-ups.
 *
 * - answerSubjectQuestion - A function that provides answers to subject-related questions.
 * - AnswerSubjectQuestionInput - The input type for the answerSubjectQuestion function.
 * - AnswerSubjectQuestionOutput - The return type for the answerSubjectQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GradeLevelNCERT } from '@/types';

const ConversationTurnSchema = z.object({
  speaker: z.enum(['user', 'ai']).describe('Who said this, the user or the AI.'),
  text: z.string().describe('The text of the turn.'),
});

const AnswerSubjectQuestionInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level for the question.'),
  subject: z.string().describe('The subject of the question.'),
  chapter: z.string().describe('The chapter relevant to the question.'),
  userQuestion: z.string().describe('The specific question asked by the user this turn.'),
  conversationHistory: z.array(ConversationTurnSchema).optional().describe('The history of the conversation so far, if any.'),
});
export type AnswerSubjectQuestionInput = z.infer<typeof AnswerSubjectQuestionInputSchema>;

const AnswerSubjectQuestionOutputSchema = z.object({
  aiAnswer: z.string().describe('The AI-generated answer to the subject-specific question, including explanations and examples if relevant.'),
});
export type AnswerSubjectQuestionOutput = z.infer<typeof AnswerSubjectQuestionOutputSchema>;

export async function answerSubjectQuestion(input: AnswerSubjectQuestionInput): Promise<AnswerSubjectQuestionOutput> {
  return answerSubjectQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerSubjectQuestionPrompt',
  input: {schema: AnswerSubjectQuestionInputSchema},
  output: {schema: AnswerSubjectQuestionOutputSchema},
  prompt: `You are an expert tutor specializing in the NCERT syllabus for Class {{gradeLevel}} {{subject}}, specifically the chapter titled "{{chapter}}".
The user has a question related to this context.
{{#if conversationHistory}}
Here is the conversation history so far:
{{#each conversationHistory}}
{{#if (eq speaker "user")}}User: {{text}}{{/if}}
{{#if (eq speaker "ai")}}AI: {{text}}{{/if}}
{{/each}}
{{/if}}

User's current question: "{{userQuestion}}"

Your expert answer:
Provide a clear, concise, accurate, and comprehensive answer.
If appropriate, include examples, diagrams (described in text), or step-by-step explanations.
Break down complex topics into easily understandable parts.
Ensure your answer is strictly relevant to the specified grade, subject, chapter, and ongoing conversation if any.
If it's a follow-up question, make sure your answer directly addresses the new question while maintaining context from the previous exchanges.`,
});

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

