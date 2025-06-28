'use server';
/**
 * @fileOverview An AI agent that generates questions for various competitive exam streams.
 *
 * - generateStreamQuestions - A function that handles the question generation process for a specific stream.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateStreamQuestionsInputSchema,
    GenerateStreamQuestionsOutputSchema,
    type GenerateStreamQuestionsInput,
    type GenerateStreamQuestionsOutput
} from '@/types';

export async function generateStreamQuestions(input: GenerateStreamQuestionsInput): Promise<GenerateStreamQuestionsOutput> {
  const flowInputWithFlags = {
    ...input,
    isJee: input.streamId === 'jee',
    isNeet: input.streamId === 'neet',
    isUpsc: input.streamId === 'upsc',
    isMbbs: input.streamId === 'mbbs',
    isClat: input.streamId === 'clat',
    isSsc: input.streamId === 'ssc',
    isBanking: input.streamId === 'banking',
    isNda: input.streamId === 'nda',
    isCaFoundation: input.streamId === 'ca-foundation',
    isCuet: input.streamId === 'cuet',
    isBtech: input.streamId === 'btech',
    isItiPolytechnic: input.streamId === 'iti-polytechnic',
  };
  return generateStreamQuestionsFlow(flowInputWithFlags);
}

const prompt = ai.definePrompt({
  name: 'generateStreamQuestionsPrompt',
  input: { schema: GenerateStreamQuestionsInputSchema },
  output: { schema: GenerateStreamQuestionsOutputSchema },
  prompt: `You are an expert paper setter for the {{streamName}} competitive exam.

Your task is to generate high-quality, exam-pattern questions for the subject "{{subject}}", covering the topic "{{chapter}}" from the academic level "{{level}}".

{{#if isComprehensive}}
This is a COMPREHENSIVE test. Generate a sufficient number of questions to thoroughly test all key aspects, definitions, applications, and nuances of the topic. The user's requested number of questions is a guideline; prioritize coverage over exact count.
{{else}}
Generate exactly {{numberOfQuestions}} questions.
{{/if}}


**General Instructions for all streams:**
- For each question, you MUST provide: "type", "text", "answer", "explanation", and "difficulty" ('easy', 'medium', or 'hard').
- The "text" should be the question.
- The "answer" must be the single correct answer.
- The "explanation" must be clear and concise. For numerical problems, this should act as a step-by-step solution.
- For all MCQ types, provide an "options" array of 4 distinct strings. The answer must match one option.
- DO NOT generate image-based or diagram-based questions. Your output must be purely text-based.

**Stream-Specific Instructions for: {{streamName}}**

{{#if isJee}}
- Generate a mix of 'mcq', 'numerical', and 'integer' type questions.
- For 'numerical' and 'integer' types, the answer must be a number (can be decimal for numerical). Omit the 'options' field for these types.
- Questions should test deep conceptual understanding and problem-solving skills, suitable for JEE Main/Advanced.
{{/if}}

{{#if isNeet}}
- Generate a mix of 'mcq' and 'assertion_reason' questions.
- Ensure questions are strictly based on the NCERT syllabus and reflect the NEET pattern.
{{/if}}

{{#if isMbbs}}
- Generate 'theory_mcq' and 'case_based_mcq' questions.
- For 'case_based_mcq', the "text" should contain a short clinical scenario followed by the question.
- Questions should be fact-based, conceptual, and test clinical reasoning.
{{/if}}

{{#if isBtech}}
- Generate a mix of 'mcq' (for theory) and 'numerical' (for problem-solving) questions.
- For "Programming in C", questions can be about code output, syntax errors, or logic.
- Questions should be based on the standard first-year AICTE syllabus.
{{/if}}

{{#if isUpsc}}
- Generate 'mcq' and 'assertion_reason' questions.
- Questions should test analytical skills and broad knowledge. Include questions that require elimination of options.
- The "text" can include short statements or scenarios to be analyzed.
{{/if}}

{{#if isSsc}}
- Generate 'mcq' questions covering Reasoning, Quantitative Aptitude, English, and General Awareness topics.
- For Reasoning, describe the puzzle or pattern in text. Do not use figures.
- Questions should be concise and based on the Tier-I exam pattern.
{{/if}}

{{#if isBanking}}
- Generate 'mcq' questions.
- For Reasoning, describe puzzles and seating arrangements in text.
- For Quantitative Aptitude, focus on data interpretation and arithmetic problems.
{{/if}}

{{#if isCuet}}
- Generate 'mcq' and 'assertion_reason' questions.
- The "text" for some questions can be a short passage, and the question should be based on that passage.
- Base questions on the NCERT syllabus for the respective domain subjects.
{{/if}}

{{#if isClat}}
- Generate 'passage_based_mcq' questions. The "text" MUST contain a short passage (legal, logical, or current affairs based) followed by the question.
- Focus on logical, legal, and critical reasoning.
{{/if}}

{{#if isNda}}
- Generate a mix of 'mcq' and 'numerical' questions.
- Mathematics questions should be formula-based and conceptual.
- General Ability questions should test broad knowledge across science, history, geography, and current events.
{{/if}}

{{#if isCaFoundation}}
- Generate 'mcq' and 'numerical' questions.
- Accounting and Math questions will often be numerical.
- Law and Economics questions will be theory and application-based MCQs.
{{/if}}

{{#if isItiPolytechnic}}
- Generate 'mcq' and 'numerical' questions based on the trade theory.
- For Engineering Drawing, questions must be about the theory, standards, or interpretation, not about creating a drawing.
- Focus on practical, workshop-related theory and calculations.
{{/if}}

Generate the questions now.`,
});

const generateStreamQuestionsFlow = ai.defineFlow(
  {
    name: 'generateStreamQuestionsFlow',
    inputSchema: GenerateStreamQuestionsInputSchema,
    outputSchema: GenerateStreamQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error(`Failed to generate questions for the provided topic. Please try again.`);
    }
    return output;
  }
);
