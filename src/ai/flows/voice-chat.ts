
'use server';
/**
 * @fileOverview A voice chat AI agent that responds to user queries with both text and audio.
 *
 * - voiceChat - A function that handles the AI response and TTS generation.
 */
import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';
import wav from 'wav';

// Define input and output schemas
const VoiceChatInputSchema = z.string();
export type VoiceChatInput = z.infer<typeof VoiceChatInputSchema>;

const VoiceChatOutputSchema = z.object({
  textResponse: z.string().describe("The AI's text-based answer to the user's query."),
  audioResponse: z.string().describe("The AI's answer converted to speech, as a base64-encoded WAV data URI."),
});
export type VoiceChatOutput = z.infer<typeof VoiceChatOutputSchema>;

// Exported wrapper function
export async function voiceChat(input: VoiceChatInput): Promise<VoiceChatOutput> {
  return voiceChatFlow(input);
}

// Genkit Text-to-Speech Helper
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Genkit Flow
const voiceChatFlow = ai.defineFlow(
  {
    name: 'voiceChatFlow',
    inputSchema: VoiceChatInputSchema,
    outputSchema: VoiceChatOutputSchema,
  },
  async (query) => {
    // 1. Get the text response from the main LLM
    const {text} = await ai.generate({
      prompt: `You are a helpful AI assistant in an educational app named MGQs. Answer the following user query clearly and concisely. User query: "${query}"`,
    });
    
    const textResponse = text;
    if (!textResponse) {
        throw new Error('AI failed to generate a text response.');
    }

    // 2. Convert the text response to speech
    const ttsResponse = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textResponse,
    });

    if (!ttsResponse.media) {
      throw new Error('Text-to-Speech generation failed.');
    }

    // 3. Convert PCM audio to WAV format
    const audioBuffer = Buffer.from(
      ttsResponse.media.url.substring(ttsResponse.media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      textResponse: textResponse,
      audioResponse: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
