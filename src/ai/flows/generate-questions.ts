
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
import type { QuestionTypeNCERT, Language } from '@/types';

const GenerateQuestionsInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the syllabus.'),
  subject: z.string().describe('The subject of the syllabus.'),
  chapter: z.string().describe('The chapter of the syllabus.'),
  questionType: z.custom<QuestionTypeNCERT>().describe('The type of questions to generate (e.g., MCQ, short answer, long answer).'),
  numberOfQuestions: z.number().int().min(1).describe('The number of questions to generate.'),
  medium: z.enum(['english', 'assamese', 'hindi']).optional().default('english').describe('The language for the questions and explanations.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionAnswerPairSchema = z.object({
  question: z.string().describe('The generated question.'),
  options: z.array(z.string()).optional().describe('An array of 4 string options if the questionType is "multiple_choice". Otherwise, this field should be omitted or an empty array.'),
  answer: z.string().describe('The answer to the generated question. If questionType is "multiple_choice", this should be the exact text of one of the provided options.'),
  explanation: z.string().describe("A brief, clear explanation for why the answer is correct."),
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
  prompt: `You are a helpful AI that generates high-quality questions and their corresponding answers for students based on their syllabus.

  Generate exactly {{numberOfQuestions}} questions of type "{{questionType}}" for grade {{gradeLevel}}, subject "{{subject}}", chapter "{{chapter}}".
  The language for all content (questions, options, explanations) MUST be {{medium}}.

  For each question, provide a concise and accurate answer.
  For each question, also provide a brief but clear "explanation" for why the answer is correct.
  Ensure the questions are distinct, cover various aspects of the topic, and are not repetitive.
  
  **Crucially, for multiple-choice questions, there must be only ONE unambiguously correct answer.** If a question could have multiple technically correct options, rephrase the question or options to ensure there is a single best answer. For example, for a question like "Which is a real number?", options like "A rational number" and "An irrational number" are both correct, making the question flawed. A better question would be "Which of the following statements best describes real numbers?", with the correct answer being "They include both rational and irrational numbers".

  If the questionType is "multiple_choice":
  - You MUST provide an "options" field, which is an array of 4 distinct string options (e.g., ["Option A", "Option B", "Option C", "Option D"]).
  - The "answer" field MUST be the exact text of one of these 4 options.
  
  If the questionType is "assertion_reason":
  - The "question" field MUST contain both an assertion and a reason, formatted exactly like this: "Assertion (A): [Your assertion statement]\\nReason (R): [Your reason statement]". Use a newline character to separate them.
  - The "options" field MUST be an array with these exact four strings:
    - "Both A and R are true, and R is the correct explanation of A"
    - "Both A and R are true, but R is not the correct explanation of A"
    - "A is true, but R is false"
    - "A is false, but R is true"
  - The "answer" field MUST be the exact text of one of those four options.

  If the questionType is NOT "multiple_choice" or "assertion_reason":
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
        "answer": "Paris",
        "explanation": "Paris is the capital and most populous city of France."
      }
    ]
  }

  Example for "assertion_reason":
  {
    "questions": [
      {
        "question": "Assertion (A): The sun rises in the east.\\nReason (R): The Earth rotates from west to east.",
        "options": [
          "Both A and R are true, and R is the correct explanation of A",
          "Both A and R are true, but R is not the correct explanation of A",
          "A is true, but R is false",
          "A is false, but R is true"
        ],
        "answer": "Both A and R are true, and R is the correct explanation of A",
        "explanation": "The rotation of the Earth on its axis from west to east is the reason we observe the sun rising in the east."
      }
    ]
  }

  Example for "short_answer":
  {
    "questions": [
      { 
        "question": "What is photosynthesis?",
        "answer": "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to create their own food and release oxygen.",
        "explanation": "This process is vital for plant life and for producing oxygen in the Earth's atmosphere."
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
