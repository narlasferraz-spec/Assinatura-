
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLegalDraft = async (topic: string, type: 'clause' | 'full'): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing for Gemini");
    return "Serviço de IA indisponível. Por favor, digite o texto manualmente.";
  }

  try {
    const model = ai.models;
    const prompt = type === 'clause' 
      ? `Escreva uma cláusula jurídica profissional e clara para um contrato sobre: "${topic}". Mantenha o tom formal e direto. Máximo de 1 parágrafo.`
      : `Escreva um rascunho de contrato simples e direto sobre: "${topic}". Inclua as partes, objeto e condições principais. Use marcadores onde apropriado.`;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar texto jurídico. Tente novamente mais tarde.";
  }
};
