
'use server';
/**
 * @fileOverview An AI agent that generates and compresses a unique user avatar.
 *
 * - generateAvatar - A function that handles the avatar generation and compression process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Jimp from 'jimp';

const GenerateAvatarInputSchema = z.object({
  fullName: z.string().describe('The full name of the user for whom to generate an avatar.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe("The generated and compressed avatar image as a JPEG data URI. Expected format: 'data:image/jpeg;base64,<encoded_data>'."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a square, abstract, minimalist, and colorful avatar representing a student named "${input.fullName}". The style should be modern, clean, and suitable for a profile picture. Avoid using any text.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed to return an image.');
    }
    
    // The generated image is a large PNG data URI.
    // We need to compress it to fit into Firestore's 1MB field limit.
    const base64Data = media.url.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const image = await Jimp.read(imageBuffer);
    
    // Resize, compress as JPEG, and get the new data URI
    const compressedImage = await image
      .resize(256, 256) // Resize to a sensible avatar dimension
      .quality(85) // Compress to 85% JPEG quality
      .getBase64Async(Jimp.MIME_JPEG); // Get as a JPEG data URI

    return { avatarDataUri: compressedImage };
  }
);
