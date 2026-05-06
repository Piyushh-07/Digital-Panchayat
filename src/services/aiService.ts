import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AnalysisResult {
  isSpam: boolean;
  reason: string;
  suggestedCategory: string;
  suggestedPriority: 'Low' | 'Medium' | 'High';
}

export async function analyzeComplaint(text: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this complaint for a local government portal: "${text}"`,
      config: {
        systemInstruction: "You are an expert government administrator. Categorize the issue and detect spam or harmful content. Categories: Water, Electricity, Roads, Sanitation, Health, Education, Other.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSpam: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            suggestedPriority: { 
              type: Type.STRING,
              enum: ['Low', 'Medium', 'High']
            }
          },
          required: ['isSpam', 'reason', 'suggestedCategory', 'suggestedPriority']
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error('No response from AI');
  } catch (err) {
    console.error('AI Analysis Error:', err);
    return { 
      isSpam: false, 
      reason: 'Analysis failed', 
      suggestedCategory: 'Other', 
      suggestedPriority: 'Medium' 
    };
  }
}

// For backward compatibility if needed, but we should use analyzeComplaint
export async function detectSpam(text: string) {
  const result = await analyzeComplaint(text);
  return { isSpam: result.isSpam, reason: result.reason };
}
