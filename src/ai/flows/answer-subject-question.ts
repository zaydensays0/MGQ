
'use server';
/**
 * @fileOverview An AI agent that answers subject-specific questions for a given class and chapter.
 *
 * - answerSubjectQuestion - A function that provides answers to subject-related questions.
 * - AnswerSubjectQuestionInput - The input type for the answerSubjectQuestion function.
 * - AnswerSubjectQuestionOutput - The return type for the answerSubjectQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GradeLevelNCERT } from '@/types';

const AnswerSubjectQuestionInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['9', '10', '11', '12']>(['9', '10', '11', '12']).describe('The grade level for the question.'),
  subject: z.string().describe('The subject of the question.'),
  chapter: z.string().describe('The chapter relevant to the question.'),
  userQuestion: z.string().describe('The specific question asked by the user.'),
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
Provide a clear, concise, accurate, and comprehensive answer to the user's question.
If appropriate, include examples, diagrams (described in text), or step-by-step explanations.
Break down complex topics into easily understandable parts.
Ensure your answer is strictly relevant to the specified grade, subject, and chapter.

User's question: "{{userQuestion}}"

Your expert answer:`,
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

