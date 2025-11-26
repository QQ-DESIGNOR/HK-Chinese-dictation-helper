
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DictationItem, DictationMode } from "../types";

// NOTE: API Key is assumed to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes raw text or images to generate a dictation list based on the selected mode.
 */
export const analyzeMaterial = async (
  text: string, 
  files: { mimeType: string; data: string }[], 
  mode: DictationMode
): Promise<DictationItem[]> => {
  try {
    const parts: any[] = [];

    // Add media files
    files.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    // Construct Prompt based on Mode
    let systemInstruction = `
    You are an expert Chinese Language Teacher. Your task is to extract dictation content from the provided text or images.

    **CRITICAL OCR INSTRUCTIONS:**
    1. **High Precision:** Perform accurate OCR for Traditional Chinese.
    2. **Contextual Correction:** Correct visually similar errors (e.g., '傢' vs '像') based on context.
    3. **Output Format:** Traditional Chinese (Hong Kong standard).
    `;

    let itemSchema: any = {};

    switch (mode) {
      case 'paragraph':
        systemInstruction += `
        \n**Mode: Paragraph (Article Cloze)**
        - Extract text and split it into logical sentences.
        - **Structure**: Detect paragraph breaks. Set "newParagraph": true if a sentence starts a new paragraph in the source text.
        - **Cloze Generation**: Create a 'clozeContent' version (Hard Difficulty).
           - **Target Ratio**: Blank out approximately **2/3 (60-70%)** of the content.
           - **Strategy**: 
             - **KEEP**: Only simple particles (e.g., 的, 了, 在, 是, 有, 著), simple pronouns (我, 你, 他), basic connecting words, and punctuation.
             - **BLANK OUT**: All nouns, verbs, adjectives, idioms, specific names, and complex vocabulary.
             - Use '______' to represent blanked out words.
             - Ensure the flow of the sentence remains visible via punctuation and particles, but the main meaning requires filling in.
        `;
        itemSchema = {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The complete sentence" },
            clozeContent: { type: Type.STRING, description: "Sentence with approx 2/3 words replaced by ______" },
            meaning: { type: Type.STRING, description: "Simple meaning/translation" },
            newParagraph: { type: Type.BOOLEAN, description: "True if this sentence starts a new paragraph" }
          },
          required: ["content", "clozeContent", "newParagraph"]
        };
        break;
      
      case 'idiom':
        systemInstruction += `
        \n**Mode: Idioms (Chengyu)**
        - Identify 4-character Chinese idioms.
        - Provide the idiom and its Chinese meaning.
        `;
        itemSchema = {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The Idiom" },
            subContent: { type: Type.STRING, description: "Pinyin" },
            meaning: { type: Type.STRING, description: "Meaning/Explanation in Traditional Chinese" }
          },
          required: ["content", "meaning"]
        };
        break;

      case 'vocab':
      default:
        systemInstruction += `
        \n**Mode: Vocabulary (Contextual Fill-in-the-Blank)**
        - Identify key vocabulary words.
        - **Sentence Generation**: For EACH word, create (or extract) a simple example sentence using that word.
        - **Cloze Generation**: Create a 'clozeContent' version of that sentence where the target word is replaced by '______'.
        - Ensure 100% character accuracy.
        `;
        itemSchema = {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The target Word" },
            subContent: { type: Type.STRING, description: "Pinyin" },
            meaning: { type: Type.STRING, description: "Simple Chinese meaning/definition" },
            example: { type: Type.STRING, description: "Full example sentence containing the word" },
            clozeContent: { type: Type.STRING, description: "Example sentence with the word replaced by ______" }
          },
          required: ["content", "meaning", "example", "clozeContent"]
        };
        break;
    }

    if (text) {
      parts.push({ text: `Text Content to Process: "${text}"` });
    }
    
    parts.push({ text: systemInstruction });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: itemSchema,
        },
      },
    });

    const jsonText = response.text || "[]";
    const rawItems = JSON.parse(jsonText);
    
    // Map to DictationItem interface
    return rawItems.map((item: any, index: number) => ({
      id: index.toString(),
      content: item.content,
      subContent: item.subContent || item.pinyin || "",
      meaning: item.meaning || "",
      example: item.example || "",
      clozeContent: item.clozeContent || "",
      isNewParagraph: item.newParagraph || false
    }));

  } catch (error) {
    console.error("Error analyzing material:", error);
    return [];
  }
};

/**
 * Generates audio for the Assistant (Gemini TTS).
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

/**
 * Chat Assistant Logic
 */
export const chatWithAssistant = async (
  history: { role: 'user' | 'model', text: string }[],
  currentMessage: string,
  context?: string
): Promise<string> => {
  try {
    const prompt = `
    You are a friendly, encouraging robot assistant helping a child study Chinese dictation.
    Context: ${context || "No specific list."}
    
    Current Chat History:
    ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
    
    User: ${currentMessage}
    
    Response (Keep it short, encouraging. Use Traditional Chinese):
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "加油！";
  } catch (error) {
    console.error("Error in chat:", error);
    return "出了點小問題，我們繼續努力！";
  }
};
