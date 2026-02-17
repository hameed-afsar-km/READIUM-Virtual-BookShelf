import { GoogleGenAI } from "@google/genai";
import { Book } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBookSuggestions = async (
  query: string,
  userLibrary: Book[]
): Promise<string> => {
  const libraryTitles = userLibrary.map(b => b.title).join(", ");
  
  const systemInstruction = `
    You are a knowledgeable and friendly librarian AI named Lumina. 
    The user has the following books in their library: [${libraryTitles}].
    
    Your goal is to provide book suggestions, reading tips, or answer literary questions based on the user's library and their specific query.
    Keep your answers concise, encouraging, and formatted in Markdown.
    If suggesting books, provide the Title and Author and a brief reason why.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "I couldn't think of any suggestions right now. Try asking again!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the library network (API Error). Please try again later.";
  }
};
