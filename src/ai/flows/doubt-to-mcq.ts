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
  prompt: `You are an expert educator creating practice questions for a student.

The student's topic is: "{{topic}}".

{{#if isComprehensive}}
Your task is to generate a COMPREHENSIVE set of questions to ensure a Class {{gradeLevel}} student fully understands this topic. Cover all key aspects, definitions, and applications. Generate as many questions as needed to be thorough.
{{else}}
Your task is to generate exactly {{numberOfQuestions}} high-quality questions about the topic.
{{/if}}

Create a mix of the following question types:
- 'multiple_choice': A standard MCQ.
- 'true_false': A true or false statement.
- 'fill_in_the_blanks': A sentence with a word or phrase missing, indicated by [BLANK].
- 'short_answer': A question requiring a brief, direct answer.
- 'assertion_reason': An assertion and reason style question.

For each question, you MUST provide:
- "type": One of the five types listed above.
- "question": The question text. 
    - For 'fill_in_the_blanks', use [BLANK] for the missing part.
    - For 'assertion_reason', it MUST contain both an assertion and a reason, formatted with a newline separator: "Assertion (A): [Your assertion statement]\\nReason (R): [Your reason statement]".
- "options": 
    - For 'multiple_choice', provide an array of exactly 4 distinct string options.
    - For 'true_false', provide the array ["True", "False"].
    - For 'assertion_reason', provide the four standard A/R options.
    - For other types, this field can be omitted.
- "answer": The single correct answer. For 'multiple_choice', it must match an option. For 'true_false', it must be "True" or "False". For 'fill_in_the_blanks', it is the word that fills the blank. For 'assertion_reason', it must be one of the four standard options.
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
