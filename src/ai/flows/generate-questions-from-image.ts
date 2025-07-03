
'use server';
/**
 * @fileOverview An AI agent that generates questions from uploaded images of study material.
 *
 * - generateQuestionsFromImage - A function that handles OCR and question generation from images.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateQuestionsFromImageInputSchema,
    GenerateQuestionsFromImageOutputSchema,
    type GenerateQuestionsFromImageInput,
    type GenerateQuestionsFromImageOutput
} from '@/types';

export async function generateQuestionsFromImage(input: GenerateQuestionsFromImageInput): Promise<GenerateQuestionsFromImageOutput> {
  return generateQuestionsFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionsFromImagePrompt',
  input: { schema: GenerateQuestionsFromImageInputSchema },
  output: { schema: GenerateQuestionsFromImageOutputSchema },
  prompt: `You are an expert educator who creates practice questions from study material. The user has uploaded one or more images of their notes or textbook pages.

**Your Tasks:**
1.  **Analyze the Content:** Perform OCR on the provided image(s) to extract all text and understand the content.
    {{#each imageDataUris}}
    {{media url=this}}
    {{/each}}
2.  **Detect Language:** Automatically detect the primary language of the text (e.g., English, Hindi, Assamese).
3.  **Generate Questions:** Based on the extracted content, generate questions of the following types: {{#each questionTypes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

    {{#if isComprehensive}}
    This is a COMPREHENSIVE request. Generate a sufficient number of questions to thoroughly test all key concepts found in the material.
    {{else}}
    Generate exactly {{numberOfQuestions}} questions in total, distributed among the requested types.
    {{/if}}

**Output Rules:**
- ALL parts of your response (questions, options, answers, explanations, language name) MUST be in the **auto-detected language**.
- For each question, you MUST provide: "type", "question", "answer", "explanation", and the detected "language".
- For 'multiple_choice' or 'assertion_reason' questions, you MUST provide an "options" array with 4 distinct options.
- For 'true_false', the "options" array MUST be ["True", "False"].
- For other types, "options" can be omitted.

Generate the questions now.
`,
});


const generateQuestionsFromImageFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFromImageFlow',
    inputSchema: GenerateQuestionsFromImageInputSchema,
    outputSchema: GenerateQuestionsFromImageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error(`Failed to generate questions from the provided image(s). The content might be unclear or unsupported.`);
    }
    return output;
  }
);
