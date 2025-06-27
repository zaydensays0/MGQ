
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
  summary: z.string().describe("A concise summary of the chapter."),
  keyTerms: z.array(z.object({
    term: z.string().describe("The key term or vocabulary word."),
    definition: z.string().describe("The definition of the term.")
  })).describe("A list of important key terms from the chapter, each with its definition."),
  mainPoints: z.array(z.string()).describe("A list of the main points or key takeaways from the chapter, in bullet point format."),
  sampleQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
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
  prompt: `You are an expert educator who creates high-quality study materials for students following the NCERT syllabus.
Generate a set of study notes for a Class {{gradeLevel}} student studying the chapter "{{chapter}}" in the subject "{{subject}}".

The notes should be structured and comprehensive. Please provide the following sections in your output, adhering to the specified format:
1.  **summary**: A concise overview of the entire chapter.
2.  **keyTerms**: A list of important vocabulary, where each item is an object with a 'term' and its corresponding 'definition'.
3.  **mainPoints**: A bulleted list of the key concepts and most important information.
4.  **sampleQuestions**: 2-3 relevant questions with their answers to help the student test their knowledge.

If a section is not applicable or you cannot generate content for it, provide an empty string for the summary or an empty array for the lists.
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
