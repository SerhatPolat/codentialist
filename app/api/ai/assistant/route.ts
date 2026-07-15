import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  const { instruction, files } = await req.json();

  const promptContext = `
    You are an AI code assistant integrated into an IDE workspace.
    The user wants to make a specific target change to the existing files.

    User Instruction: "${instruction}"

    Current Files Snapshot in Workspace:
    ${JSON.stringify(
      files.map((f: any) => ({
        path: f.path,
        content: f.content,
        status: f.status,
      }))
    )}

    Review the files and output the updated content or add/remove files based on the instruction.
    For unchanged files, you do not need to return them in the array, only return files that are added, modified, or deleted.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptContext }] }],
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
                    enum: ["added", "modified", "deleted", "original"],
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
