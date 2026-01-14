
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      // Safely access process.env to prevent ReferenceError in browser environments where 'process' is not defined
      const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        console.warn("Gemini API Key is not configured in process.env.API_KEY");
      }
    } catch (error) {
      console.error("Failed to initialize Gemini Service:", error);
    }
  }

  async generateTribute(senderName: string, relationship: string, memory: string): Promise<string> {
    if (!this.ai) {
      return "Hearty congratulations to Alhaji Ibrahim Saidu on a meritorious career. Your leadership and dedication have left an indelible mark on NYSC.";
    }

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
