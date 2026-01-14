
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Fixed: Initializing GoogleGenAI with process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateTribute(senderName: string, relationship: string, memory: string): Promise<string> {
    const prompt = `
      Write a formal, elegant, and heartwarming retirement tribute for Alhaji Ibrahim Saidu.
      Alhaji Ibrahim Saidu is the 20th State Coordinator of NYSC Katsina State, retiring on April 30, 2026.
      He joined NYSC in 1998 and is known for integrity, professionalism, and mentorship.
      
      Details to include:
      - Sender Name: ${senderName}
      - Relationship: ${relationship}
      - Specific Memory/Sentiment: ${memory}
      
      The tone should be respectful, appreciative, and celebratory. Keep it between 100-150 words.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || "I wish Alhaji Ibrahim Saidu a very happy retirement. His legacy of service and integrity will always be remembered.";
    } catch (error) {
      console.error("Error generating tribute:", error);
      return "Hearty congratulations to Alhaji Ibrahim Saidu on a meritorious career. Your leadership and dedication have left an indelible mark on NYSC.";
    }
  }
}

export const geminiService = new GeminiService();
