
'use server';
/**
 * @fileOverview An AI agent that generates board exam style questions.
 *
 * - generateBoardQuestions - A function that handles the question generation process for a specific board.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateBoardQuestionInputSchema,
    GenerateBoardQuestionOutputSchema,
    type GenerateBoardQuestionInput,
    type GenerateBoardQuestionOutput
} from '@/types';

export async function generateBoardQuestions(input: GenerateBoardQuestionInput): Promise<GenerateBoardQuestionOutput> {
  return generateBoardQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBoardQuestionsPrompt',
  input: { schema: GenerateBoardQuestionInputSchema },
  output: { schema: GenerateBoardQuestionOutputSchema },
  prompt: `You are an expert question paper setter for Class {{className}} of the {{boardName}} board.
Your task is to generate high-quality exam-style questions for the subject "{{subject}}", covering the chapter(s): {{chapters}}.
The language for all content (questions, answers, options, explanations) MUST be {{medium}}.

{{#if isComprehensive}}
This is a COMPREHENSIVE test. Generate a sufficient number of high-probability questions to thoroughly test all key aspects, definitions, and applications of the topic(s) as per the {{boardName}} blueprint.
{{else}}
Generate exactly {{numberOfQuestions}} questions of the types: {{questionTypes}}.
{{/if}}

**General Instructions:**
- For each question, you MUST provide: "question", "answer", "type", "marks", "explanation", and "isLikelyToAppear".
- The "question" should be formatted exactly as it would appear on an exam paper.
- The "answer" must be the correct and complete answer. For long-answer questions, provide a model answer.
- The "type" MUST be one of: {{questionTypes}}.
- The "marks" must be an integer reflecting the question's weight (e.g., 1, 2, 3, 5).
- The "explanation" should clarify why the answer is correct or provide a marking scheme.
- The "isLikelyToAppear" MUST be a boolean (true/false), based on your expert assessment of the question's importance and frequency in past papers.

**Board-Specific Instructions for: {{boardName}}**

- If the board is CBSE or ICSE, ensure you include 'assertion_reason' and 'case_based' questions if requested.
- For case/source-based questions, provide a short passage or data set in the 'question' field, followed by 1-3 sub-questions. The 'answer' should address all sub-questions.
- For VSA (Very Short Answer), the answer should be a single word or one sentence.
- For SA (Short Answer), the answer should be 30-50 words.
- For LA (Long Answer), the answer should be 80-120 words and well-structured.
- For MCQ, you MUST provide an "options" array of 4 distinct strings. The answer must match one option.

Adhere strictly to the syllabus and examination pattern of the {{boardName}}. Generate the questions now.`,
});


const generateBoardQuestionsFlow = ai.defineFlow(
  {
    name: 'generateBoardQuestionsFlow',
    inputSchema: GenerateBoardQuestionInputSchema,
    outputSchema: GenerateBoardQuestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || output.questions.length === 0) {
      throw new Error(`Failed to generate questions for the provided criteria. Please try again.`);
    }
    return output;
  }
);
