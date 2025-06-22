
'use server';
/**
 * @fileOverview An AI agent that summarizes user-provided text.
 *
 * - summarizeText - A function that handles the text summarization process.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().describe('The block of text provided by the user to be summarized.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
    summary: z.string().describe("A clear, simplified explanation of the provided text."),
    bulletPoints: z.array(z.string()).describe("A list of key points from the text, in bullet point format."),
    definitions: z.array(z.object({
        term: z.string(),
        definition: z.string(),
    })).optional().describe("Definitions of difficult words or formulas found in the text."),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an AI assistant that helps students understand complex topics by simplifying text.
A user has provided the following text. Please summarize it for them.

User's Text:
"""
{{textToSummarize}}
"""

Please provide the following in your response:
1.  **summary**: A clear, simplified explanation of the provided text.
2.  **bulletPoints**: A list of the most important key points from the text.
3.  **definitions**: (Optional) If you find any difficult or technical terms in the text, provide a simple definition for each. If there are no complex terms, you can omit this field.
`,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to summarize the provided text.');
    }
    return output;
  }
);
