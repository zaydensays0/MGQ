
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
import type { QuestionTypeNCERT } from '@/types';

const GenerateQuestionsInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the syllabus.'),
  subject: z.string().describe('The subject of the syllabus.'),
  chapter: z.string().describe('The chapter of the syllabus.'),
  questionType: z.custom<QuestionTypeNCERT>().describe('The type of questions to generate (e.g., MCQ, short answer, long answer).'),
  numberOfQuestions: z.number().int().positive().describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionAnswerPairSchema = z.object({
  question: z.string().describe('The generated question.'),
  options: z.array(z.string()).optional().describe('An array of 4 string options if the questionType is "multiple_choice". Otherwise, this field should be omitted or an empty array.'),
  answer: z.string().describe('The answer to the generated question. If questionType is "multiple_choice", this should be the exact text of one of the provided options.'),
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
  
  If the questionType is "multiple_choice":
  - You MUST provide an "options" field, which is an array of 4 distinct string options (e.g., ["Option A", "Option B", "Option C", "Option D"]).
  - The "answer" field MUST be the exact text of one of these 4 options.
  
  If the questionType is NOT "multiple_choice":
  - The "options" field should be omitted or be an empty array.
  
  Return the questions and answers as a JSON array of objects.
  Make sure the questions are relevant to the chapter and suitable for the specified grade level.
  If you cannot generate the exact number of questions requested, generate as many as you can up to that number.
  
  Example for "multiple_choice":
  {
    "questions": [
      { 
        "question": "What is the capital of France?", 
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "answer": "Paris" 
      }
    ]
  }

  Example for "short_answer":
  {
    "questions": [
      { 
        "question": "What is photosynthesis?",
        "answer": "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen."
      }
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
    if (!output) {
      return { questions: [] };
    }
    return output;
  }
);
