import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  const { prefix, suffix } = await req.json();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Code before cursor:\n"""\n${prefix}\n"""\nCode after cursor:\n"""\n${suffix}\n"""\n\nProvide only the precise immediate inline code addition to complete the row (without markdown block wrappers).`,
            },
          ],
        },
      ],
    });

    const suggestion =
      response.text?.replace(/```[a-z]*\n?/g, "").replace(/```$/g, "") || "";
    return NextResponse.json({ suggestion });
  } catch (error: any) {
    return NextResponse.json({ suggestion: "" });
  }
}
