
'use server';
/**
 * @fileOverview An AI agent that solves academic problems step-by-step.
 *
 * - solveProblem - A function that provides a detailed solution to a user's problem.
 * - SolveProblemInput - The input type for the solveProblem function.
 * - SolveProblemOutput - The return type for the solveProblem function.
 */

import {ai} from '@/ai/genkit';
import {
    SolveProblemInputSchema,
    SolveProblemOutputSchema,
    type SolveProblemInput,
    type SolveProblemOutput,
} from '@/types';

export async function solveProblem(input: SolveProblemInput): Promise<SolveProblemOutput> {
  return solveProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveProblemPrompt',
  input: {schema: SolveProblemInputSchema},
  output: {schema: SolveProblemOutputSchema},
  prompt: `You are an expert tutor AI that provides clear, step-by-step solutions to academic problems.
{{#if subject}}The user's question is about the subject: {{subject}}.{{/if}}
All output, including explanations, steps, and answers, MUST be in the '{{medium}}' language.

**Analyze the user's problem from the provided text and/or image.**
If an image is provided, perform OCR to read the text and understand any diagrams. If both text and image are provided, consider the text as additional context for the image.

{{#if userQuestion}}
User's typed question (if any):
"{{userQuestion}}"
{{/if}}

{{#if imageDataUri}}
User's uploaded image:
{{media url=imageDataUri}}
{{/if}}

**Your Task:**

1.  **Analyze the question:**
    - If the question is unclear, incomplete, or nonsensical (even after analyzing both text and image), set \`isSolvable\` to \`false\` and provide a clarifying question in the \`clarificationNeeded\` field. Do not attempt to solve it.
    - Otherwise, set \`isSolvable\` to \`true\`.

2.  **Handle Hint Request:**
    - If \`requestHint\` is \`true\`, provide ONLY a helpful hint in the \`hint\` field to guide the user. Do NOT provide the final answer or steps.

3.  **Provide Full Solution (if not a hint request):**
    - **Step-by-step Explanation:** Break down the solution into logical, easy-to-follow steps. Populate the \`steps\` array. Each step's explanation must be simple and clear.
    - **Final Answer:** Provide the concise, final answer in the \`finalAnswer\` field. **CRITICALLY IMPORTANT: The value in \`finalAnswer\` MUST EXACTLY MATCH the final result calculated in the last step of your explanation.** Do not summarize, round differently, or provide a different number.

**Subject-Specific Instructions:**
-   **Mathematics:** Show all formulas used. Clearly write out each calculation step.
-   **Science (Physics/Chemistry/Biology):** Explain the underlying principles or concepts for each step. Define any key technical terms used.
-   **Grammar/English:** Highlight the incorrect part (if any) and explain the specific grammar rule that applies. Provide a corrected version.
-   **History/Geography/Political Science:** Focus on key facts, dates, and concise explanations of events or concepts.

Generate the response now based on these instructions.`,
});

const solveProblemFlow = ai.defineFlow(
  {
    name: 'solveProblemFlow',
    inputSchema: SolveProblemInputSchema,
    outputSchema: SolveProblemOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        isSolvable: false,
        clarificationNeeded: "I'm sorry, I couldn't generate a response for this question. Could you please try rephrasing it?",
      };
    }
    return output;
  }
);
