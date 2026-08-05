import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  const { files } = await req.json();

  if (!files || !Array.isArray(files)) {
    return NextResponse.json(
      { error: "Invalid files format provided." },
      { status: 400 }
    );
  }

  const promptContext = `
      Current Application Source Files:
      ${JSON.stringify(
        files.map((f: any) => ({ path: f.path, content: f.content }))
      )}

      You are a senior software architect that also has business development perspective. Your job is analyzing the source files and suggesting valuable task ideas.
      
      Your suggestions MUST focus on:
      1. Innovation to move the project to another level.
      2. Technical improvements to make the project more valuable and robust.

      Rules:
      - Provide MAXIMUM 5 task ideas.
      - If you do not have a robust, highly valuable idea, DO NOT force one. It is perfectly fine to return an empty array if the codebase is already in an optimal state.
      - Provide a concise title and a detailed description explaining WHAT should be implemented and HOW it should be implemented.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptContext }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    const parsedOutput = JSON.parse(response.text || "[]");
    return NextResponse.json(parsedOutput);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
