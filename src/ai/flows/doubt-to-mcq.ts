'use server';
/**
 * @fileOverview An AI agent that converts a user's topic into a set of multiple-choice questions.
 *
 * - topicToMcq - A function that handles the MCQ generation process.
 */

import {ai} from '@/ai/genkit';
import {
    TopicToMcqInputSchema,
    TopicToMcqOutputSchema,
    type TopicToMcqInput,
    type TopicToMcqOutput,
} from '@/types';


export async function topicToMcq(input: TopicToMcqInput): Promise<TopicToMcqOutput> {
  return topicToMcqFlow(input);
}

const prompt = ai.definePrompt({
  name: 'topicToMcqPrompt',
  input: {schema: TopicToMcqInputSchema},
  output: {schema: TopicToMcqOutputSchema},
  prompt: `You are an expert educator who excels at creating practice questions to help students solidify their understanding.
  
A student has provided a concept or a topic they are studying. Your task is to generate 3-5 high-quality Multiple Choice Questions (MCQs) directly related to their input. These questions should be designed to test their understanding.

For each question, you MUST adhere to the following structure:
- "question": The question text.
- "options": An array of exactly 4 distinct string options.
- "answer": The single correct answer, which must exactly match one of the four options.
- "explanation": A brief, clear explanation for why the provided answer is correct.

User's topic: "{{topic}}"

Generate the MCQs now.`,
});

const topicToMcqFlow = ai.defineFlow(
  {
    name: 'topicToMcqFlow',
    inputSchema: TopicToMcqInputSchema,
    outputSchema: TopicToMcqOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error('Failed to generate MCQs for the provided topic. Please try rephrasing.');
    }
    return output;
  }
);
