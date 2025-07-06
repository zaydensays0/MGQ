'use server';
/**
 * @fileOverview An AI agent that generates study notes for a specific chapter.
 *
 * - generateNotesByChapter - A function that handles the note generation process.
 * - GenerateNotesByChapterInput - The input type for the generateNotesByChapter function.
 * - GenerateNotesByChapterOutput - The return type for the generateNotesByChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GradeLevelNCERT } from '@/types';

const GenerateNotesByChapterInputSchema = z.object({
  gradeLevel: z.enum<GradeLevelNCERT, ['5', '6', '7', '8', '9', '10', '11', '12']>(['5', '6', '7', '8', '9', '10', '11', '12']).describe('The grade level for the chapter.'),
  subject: z.string().describe('The subject of the chapter.'),
  chapter: z.string().describe('The name of the chapter.'),
});
export type GenerateNotesByChapterInput = z.infer<typeof GenerateNotesByChapterInputSchema>;

const GenerateNotesByChapterOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the chapter's main themes, suitable for exam revision."),
  keyTerms: z.array(z.object({
    term: z.string().describe("An important key term, concept, or vocabulary word from the chapter."),
    definition: z.string().describe("A clear and simple definition of the term.")
  })).describe("A list of important key terms from the chapter, each with its definition."),
  mainPoints: z.array(z.string()).describe("A bulleted list of the most critical points and key takeaways from the chapter, ideal for quick review."),
  formulas: z.array(z.object({
      name: z.string().describe("The name or title of the formula (e.g., 'Newton's Second Law')."),
      formula: z.string().describe("The formula itself, expressed in a readable string format (e.g., 'F = m * a').")
  })).optional().describe("A list of important formulas from the chapter. Omit if not applicable (e.g., for History)."),
  sampleQuestions: z.array(z.object({
    question: z.string().describe("A sample exam-style question to test understanding."),
    answer: z.string().describe("The correct, concise answer to the sample question."),
  })).describe("A list of 2-3 sample questions with answers to test understanding.")
});
export type GenerateNotesByChapterOutput = z.infer<typeof GenerateNotesByChapterOutputSchema>;

export async function generateNotesByChapter(input: GenerateNotesByChapterInput): Promise<GenerateNotesByChapterOutput> {
  return generateNotesByChapterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNotesByChapterPrompt',
  input: {schema: GenerateNotesByChapterInputSchema},
  output: {schema: GenerateNotesByChapterOutputSchema},
  prompt: `You are an expert educator who creates high-quality, exam-focused study materials for students following the NCERT syllabus. Your notes must be clear, concise, and easy to read.
Generate a set of study notes for a Class {{gradeLevel}} student studying the chapter "{{chapter}}" in the subject "{{subject}}".

The notes must be structured and comprehensive for exam preparation. Please provide the following sections in your output, adhering to the specified format:
1.  **summary**: A concise overview of the entire chapter.
2.  **keyTerms**: A list of important vocabulary and concepts, where each item is an object with a 'term' and its 'definition'.
3.  **mainPoints**: A bulleted list of the key takeaways and most important information.
4.  **formulas**: (If applicable) A list of crucial formulas from the chapter. For subjects like History, this field can be omitted. Each item should have a 'name' and the 'formula' string.
5.  **sampleQuestions**: 2-3 relevant exam-style questions with their answers to help the student test their knowledge.

Ensure the content is accurate and directly relevant to the specified chapter and grade level.
`,
});

const generateNotesByChapterFlow = ai.defineFlow(
  {
    name: 'generateNotesByChapterFlow',
    inputSchema: GenerateNotesByChapterInputSchema,
    outputSchema: GenerateNotesByChapterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate notes for the specified chapter.');
    }
    return output;
  }
);
