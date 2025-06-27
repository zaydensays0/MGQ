
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
import type { GradeLevelNCERT } from '@/types'; // Removed ConversationTurn as it's implicitly defined by the schema

const AnswerSubjectQuestionInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['5', '6', '7', '8', '9', '10', '11', '12']>(['5', '6', '7', '8', '9', '10', '11', '12']).describe('The grade level for the question context.'),
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
  input: {schema: AnswerSubjectQuestionInputSchema}, // This schema describes the 'input' param to the prompt() call
  output: {schema: AnswerSubjectQuestionOutputSchema},
  prompt: `You are a knowledgeable and helpful Subject Expert AI focusing on the NCERT syllabus.
You are assisting a student in Class {{gradeLevel}} with the subject: {{subject}}, specifically the chapter: "{{chapter}}".

Please consider the entire conversation history provided to give the most relevant and contextual answer to the current question.
If the conversation history is empty, this is the first question.

{{#if conversationHistory.length}}
Conversation History:
{{#each conversationHistory}}
  {{#if this.isUser}}User: {{this.text}}{{/if}}
  {{#if this.isAI}}Expert: {{this.text}}{{/if}}
{{/each}}
{{/if}}

Current User Question: "{{userQuestion}}"

Your expert answer:`,
});


const answerSubjectQuestionFlow = ai.defineFlow(
  {
    name: 'answerSubjectQuestionFlow',
    inputSchema: AnswerSubjectQuestionInputSchema,
    outputSchema: AnswerSubjectQuestionOutputSchema,
  },
  async (input) => {
    // Pre-process conversation history for easier templating, adding isUser and isAI flags
    const processedHistory = input.conversationHistory?.map(turn => ({
      text: turn.text,
      speaker: turn.speaker, // Keep original speaker if needed, or omit if only flags are used by template
      isUser: turn.speaker === 'user',
      isAI: turn.speaker === 'ai',
    }));

    // Pass the original input structure, but with the processed conversationHistory
    const promptInput = {
        ...input,
        conversationHistory: processedHistory,
    };
    
    const {output} = await prompt(promptInput);
    if (!output) {
      return { aiAnswer: "I'm sorry, I couldn't generate an answer for this specific topic at this time. Please try rephrasing or ask a different question." };
    }
    return output;
  }
);
