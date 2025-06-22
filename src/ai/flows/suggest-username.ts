'use server';
/**
 * @fileOverview An AI agent to validate and suggest unique usernames for an educational app.
 *
 * - suggestUsername - A function that checks username availability and suggests alternatives if needed.
 * - SuggestUsernameInput - The input type for the suggestUsername function.
 * - SuggestUsernameOutput - The return type for the suggestUsername function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Simulate a database of existing usernames for prototyping purposes
const FAKE_EXISTING_USERNAMES = new Set(['admin', 'root', 'test', 'user', 'mehdi_123', 'student']);

const SuggestUsernameInputSchema = z.object({
  username: z.string().describe('The username chosen by the user.'),
  fullName: z.string().optional().describe("The user's full name, for generating better suggestions."),
  email: z.string().optional().describe("The user's email, for generating better suggestions."),
});
export type SuggestUsernameInput = z.infer<typeof SuggestUsernameInputSchema>;

const SuggestUsernameOutputSchema = z.object({
  status: z.enum(['available', 'taken', 'invalid']).describe('The status of the requested username.'),
  message: z.string().describe('A friendly message to be displayed to the user.'),
  suggestions: z.array(z.string()).optional().describe('A list of alternative usernames if the requested one is taken.'),
});
export type SuggestUsernameOutput = z.infer<typeof SuggestUsernameOutputSchema>;

export async function suggestUsername(input: SuggestUsernameInput): Promise<SuggestUsernameOutput> {
  return suggestUsernameFlow(input);
}

const usernameSuggestionPrompt = ai.definePrompt({
  name: 'usernameSuggestionPrompt',
  input: { schema: z.object({
    username: z.string(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    existingUsernames: z.array(z.string()),
  })},
  output: { schema: z.object({
    suggestions: z.array(z.string()).length(4).describe('An array of exactly 4 username suggestions.'),
  })},
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
  async ({ username, fullName, email }) => {
    // 1. Validate username format
    if (username.length < 3 || username.length > 20) {
      return {
        status: 'invalid',
        message: 'Username must be between 3 and 20 characters.',
      };
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      return {
        status: 'invalid',
        message: 'Username can only contain lowercase letters, numbers, and underscores.',
      };
    }

    // 2. Check for uniqueness (simulated)
    if (FAKE_EXISTING_USERNAMES.has(username)) {
      // 3. Generate alternatives if taken
      const promptInput = {
        username,
        fullName,
        email,
        existingUsernames: Array.from(FAKE_EXISTING_USERNAMES),
      };

      const { output } = await usernameSuggestionPrompt(promptInput);

      if (!output || !output.suggestions || output.suggestions.length === 0) {
        // Fallback suggestions if AI fails
        const fallbackSuggestions = [
          `${username}${Math.floor(Math.random() * 90) + 10}`,
          `real_${username}`,
          `${username}_edu`,
          `i_am_${username}`,
        ];
        return {
          status: 'taken',
          message: `Sorry, "${username}" is already taken.`,
          suggestions: fallbackSuggestions,
        };
      }

      return {
        status: 'taken',
        message: `Sorry, "${username}" is already taken.`,
        suggestions: output.suggestions,
      };
    }

    // 4. If all checks pass, the username is available
    return {
      status: 'available',
      message: `"${username}" is available!`,
    };
  }
);
