'use server';
/**
 * @fileOverview An AI agent to suggest unique usernames for an educational app.
 *
 * This flow is now a pure suggestion generator. It takes a list of existing
 * usernames to ensure its suggestions are unique.
 *
 * - suggestUsername - A function that suggests alternative usernames.
 * - SuggestUsernameInput - The input type for the suggestUsername function.
 * - SuggestUsernameOutput - The return type for the suggestUsername function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SuggestUsernameInputSchema = z.object({
  username: z.string().describe('The username chosen by the user.'),
  fullName: z.string().optional().describe("The user's full name, for generating better suggestions."),
  email: z.string().optional().describe("The user's email, for generating better suggestions."),
  existingUsernames: z.array(z.string()).describe('A list of usernames that are already taken and should not be suggested.'),
});
export type SuggestUsernameInput = z.infer<typeof SuggestUsernameInputSchema>;

export const SuggestUsernameOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of alternative username suggestions.'),
});
export type SuggestUsernameOutput = z.infer<typeof SuggestUsernameOutputSchema>;

export async function suggestUsername(input: SuggestUsernameInput): Promise<SuggestUsernameOutput> {
  return suggestUsernameFlow(input);
}

const usernameSuggestionPrompt = ai.definePrompt({
  name: 'usernameSuggestionPrompt',
  input: { schema: SuggestUsernameInputSchema },
  output: { schema: SuggestUsernameOutputSchema },
  prompt: `You are an account assistant for a friendly educational app.
A user wants the username "{{username}}", but it is already taken.
The user's full name is "{{fullName}}" and their email is "{{email}}".
The following usernames are also taken and should not be suggested: {{#each existingUsernames}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Please generate 4 unique, creative, and appropriate alternative usernames.
Usernames must be between 3-20 characters long.
Usernames can only contain lowercase letters (a-z), numbers (0-9), and underscores (_).

Provide the suggestions in the "suggestions" field of the JSON output.`,
});


const suggestUsernameFlow = ai.defineFlow(
  {
    name: 'suggestUsernameFlow',
    inputSchema: SuggestUsernameInputSchema,
    outputSchema: SuggestUsernameOutputSchema,
  },
  async (input) => {
    const { output } = await usernameSuggestionPrompt(input);

    if (!output || !output.suggestions || output.suggestions.length === 0) {
      // Fallback suggestions if AI fails
      const fallbackSuggestions = [
        `${input.username}${Math.floor(Math.random() * 90) + 10}`,
        `real_${input.username}`,
        `${input.username}_edu`,
        `i_am_${input.username}`,
      ];
      return {
        suggestions: fallbackSuggestions,
      };
    }

    return {
      suggestions: output.suggestions,
    };
  }
);
