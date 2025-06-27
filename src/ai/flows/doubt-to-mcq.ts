'use server';
/**
 * @fileOverview An AI agent that converts a user's topic into a set of mixed-type practice questions.
 *
 * - topicToQuestions - A function that handles the question generation process.
 */

import {ai} from '@/ai/genkit';
import {
    TopicToQuestionsInputSchema,
    TopicToQuestionsOutputSchema,
    type TopicToQuestionsInput,
    type TopicToQuestionsOutput,
} from '@/types';


export async function topicToQuestions(input: TopicToQuestionsInput): Promise<TopicToQuestionsOutput> {
  return topicToQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'topicToQuestionsPrompt',
  input: {schema: TopicToQuestionsInputSchema},
  output: {schema: TopicToQuestionsOutputSchema},
  prompt: `You are an expert educator who creates diverse practice questions to help students solidify their understanding of a topic.
  
A student has provided a topic and requested a specific number of questions. Your task is to generate exactly {{numberOfQuestions}} high-quality questions about the topic: "{{topic}}".

Create a mix of the following question types:
- 'multiple_choice': A standard MCQ.
- 'true_false': A true or false statement.
- 'fill_in_the_blanks': A sentence with a word or phrase missing, indicated by [BLANK].
- 'short_answer': A question requiring a brief, direct answer.

For each question, you MUST provide:
- "type": One of the four types listed above.
- "question": The question text. For 'fill_in_the_blanks', use [BLANK] for the missing part.
- "options": 
    - For 'multiple_choice', provide an array of exactly 4 distinct string options.
    - For 'true_false', provide the array ["True", "False"].
    - For other types, this field can be omitted.
- "answer": The single correct answer. For 'multiple_choice', it must match an option. For 'true_false', it must be "True" or "False". For 'fill_in_the_blanks', it is the word that fills the blank.
- "explanation": A brief, clear explanation for why the provided answer is correct.

Generate the questions now.`,
});

const topicToQuestionsFlow = ai.defineFlow(
  {
    name: 'topicToQuestionsFlow',
    inputSchema: TopicToQuestionsInputSchema,
    outputSchema: TopicToQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error('Failed to generate questions for the provided topic. Please try rephrasing.');
    }
    return output;
  }
);
