import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  const { taskTitle, taskDescription, files } = await req.json();

  const promptContext = `
    Task Title: ${taskTitle}
    Task Description: ${taskDescription}

    Current Application Source Files:
    ${JSON.stringify(
      files.map((f: any) => ({ path: f.path, content: f.content }))
    )}

    1.Analyze the task requirements.
    2.Analyze the related source files to have codebase specific knowledge.
    3.Suggest precise modifications.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: promptContext,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  content: { type: Type.STRING },
                  status: {
                    type: Type.STRING,
                    enum: ["added", "modified", "deleted"],
                  },
                },
                required: ["path", "content", "status"],
              },
            },
          },
          required: ["explanation", "files"],
        },
      },
    });

    const parsedOutput = JSON.parse(response.text || "{}");
    return NextResponse.json(parsedOutput);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
