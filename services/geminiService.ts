import { GoogleGenAI, Type } from "@google/genai";
import { CharacterData } from "../types";

// Helper to initialize AI client safely on demand
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generatePracticeContent = async (topic: string): Promise<CharacterData[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `Generate a list of 4-8 Chinese characters suitable for a child to practice writing based on the topic: "${topic}".
  For each character, provide the Pinyin and a very short, simple definition (in Chinese) suitable for a 6-year-old.
  Return a JSON array.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              char: { type: Type.STRING, description: "The single Chinese character" },
              pinyin: { type: Type.STRING, description: "The Pinyin with tone marks" },
              definition: { type: Type.STRING, description: "A very short definition for kids" }
            },
            required: ["char", "pinyin"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CharacterData[];
    }
    return [];
  } catch (error) {
    console.error("Gemini generation error:", error);
    return [];
  }
};

export const getPinyinForText = async (text: string): Promise<CharacterData[]> => {
  if (!text.trim()) return [];
  
  const model = "gemini-2.5-flash";
  const prompt = `Identify the Chinese characters in this text: "${text}".
  Return a JSON array where each item contains the character and its Pinyin. Ignore punctuation.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              char: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              definition: { type: Type.STRING }
            },
            required: ["char", "pinyin"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CharacterData[];
    }
    return [];
  } catch (error) {
    console.error("Gemini pinyin error:", error);
    return text.split('').map(c => ({ char: c, pinyin: '' }));
  }
};

export const gradeHandwriting = async (char: string, imageBase64: string): Promise<string> => {
  const model = "gemini-2.5-flash"; // Using flash for vision/text tasks is efficient
  
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            text: `I am a child practicing writing the Chinese character "${char}". Please look at my handwriting image. 
            1. Give me a star rating from 1 to 5.
            2. Tell me one thing I did well.
            3. Tell me one specific stroke I can improve (e.g., "The horizontal line should be straighter").
            Keep the tone encouraging, friendly, and suitable for a child. Be brief.`
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64.split(',')[1] // Remove data:image/png;base64, prefix
            }
          }
        ]
      }
    });

    return response.text || "Keep practicing! You are doing great!";
  } catch (error) {
    console.error("Gemini grading error:", error);
    return "Oops, I couldn't see your writing clearly. Try again!";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  // Using TTS to read the character
  const model = "gemini-2.5-flash-preview-tts";
  try {
     const ai = getAiClient();
     const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually clear
          },
        },
      },
    });

    // Return the raw base64 PCM data. The client must decode this.
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
}