
// src/ai/flows/generate-questions.ts
'use server';
/**
 * @fileOverview A question generator AI agent that generates questions and their answers from a given syllabus.
 *
 * - generateQuestions - A function that handles the question and answer generation process.
 * - GenerateQuestionsInput - The input type for the generateQuestions function.
 * - GenerateQuestionsOutput - The return type for the generateQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GeneratedQuestionAnswerPair } from '@/types';

const GenerateQuestionsInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the syllabus.'),
  subject: z.string().describe('The subject of the syllabus.'),
  chapter: z.string().describe('The chapter of the syllabus.'),
  questionType: z.string().describe('The type of questions to generate (e.g., MCQ, short answer, long answer).'),
  numberOfQuestions: z.number().int().positive().describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionAnswerPairSchema = z.object({
  question: z.string().describe('The generated question.'),
  answer: z.string().describe('The answer to the generated question.'),
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionAnswerPairSchema).describe('An array of generated question-answer pairs.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are a helpful AI that generates questions and their corresponding answers for students based on their syllabus.

  Generate exactly {{numberOfQuestions}} questions of type "{{questionType}}" for grade {{gradeLevel}}, subject "{{subject}}", chapter "{{chapter}}".
  For each question, provide a concise and accurate answer.
  Return the questions and answers as a JSON array of objects, where each object has a "question" field and an "answer" field.
  Make sure the questions are relevant to the chapter and suitable for the specified grade level.
  If you cannot generate the exact number of questions requested, generate as many as you can up to that number.
  Example:
  {
    "questions": [
      { "question": "Question 1 text?", "answer": "Answer 1 text." },
      { "question": "Question 2 text?", "answer": "Answer 2 text." },
      { "question": "Question 3 text?", "answer": "Answer 3 text." }
    ]
  }
  `,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
