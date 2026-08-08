import { project } from "@/projectInfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  const { taskId, repository, baseBranch, title, description, files } =
    await req.json();

  if (!taskId || !repository || !baseBranch || !title || !files) {
    return NextResponse.json(
      { error: "Missing required field(s)" },
      { status: 400 }
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  const baseUrl = `https://api.github.com/repos/${repository}`;

  try {
    const changedFiles = files.filter((f: any) => f.status !== "original");

    if (changedFiles.length === 0) {
      return NextResponse.json(
        { error: "No modified files detected to commit." },
        { status: 400 }
      );
    }

    const refRes = await fetch(`${baseUrl}/git/refs/heads/${baseBranch}`, {
      headers,
    });
    if (!refRes.ok)
      throw new Error(`Base branch '${baseBranch || "-"}' not found.`);
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    const commitRes = await fetch(`${baseUrl}/git/commits/${baseSha}`, {
      headers,
    });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    const treeItems = changedFiles.map((f: any) => {
      if (f.status === "deleted") {
        return { path: f.path, mode: "100644", type: "blob", sha: null };
      } else {
        return {
          path: f.path,
          mode: "100644",
          type: "blob",
          content: f.content,
        };
      }
    });

    const createTreeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!createTreeRes.ok) throw new Error("Failed to create Git tree.");
    const newTreeData = await createTreeRes.json();

    const projectPrefix = project.title
      ? `[${project.title.toUpperCase()}] `
      : "";
    const commitMessage = `${projectPrefix}${
      description ? `${title}\n\n${description}` : title
    }`;
    const createCommitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeData.sha,
        parents: [baseSha],
      }),
    });
    if (!createCommitRes.ok) throw new Error("Failed to create Git commit.");
    const newCommitData = await createCommitRes.json();

    const newBranchName = `task-${taskId}`;
    const createRefRes = await fetch(`${baseUrl}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha: newCommitData.sha,
      }),
    });
    if (!createRefRes.ok) throw new Error("Failed to create new branch.");

    const prDescription = `${description}\n\n[DISCLAIMER: This pull request created by ${
      project.title || "an AI app"
    }. There can be problematic changes because of the AI usage. So do not forget to review carefully.]`;
    const createPrRes = await fetch(`${baseUrl}/pulls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: title,
        body: prDescription,
        head: newBranchName,
        base: baseBranch,
      }),
    });
    if (!createPrRes.ok) throw new Error("Failed to create pull request.");
    const prData = await createPrRes.json();

    try {
      const promptContext = `
        You are a senior software developer reviewing a PULL REQUEST.
        
        Task Title: ${title}
        Task Description: ${description}

        Changed Files:
        ${JSON.stringify(changedFiles)}

        Analyze the code changes:
        * Check potential bugs.
        * Check security vulnerabilities.
        * Check for missing clean coding best practices.
        * Be sure about 'is task requirements are properly handled or not'.

        Provide a concise, professional GitHub code review comment. Do not include markdown block wrappers around the entire response.
      `;

      const aiResponseRaw = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: promptContext }] }],
      });

      const aiResponse = aiResponseRaw.text;

      if (aiResponse) {
        await fetch(`${baseUrl}/issues/${prData.number}/comments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            body: `### ${project.title || "AI"} Code Review\n\n${aiResponse}`,
          }),
        });
      }
    } catch (aiCodeReviewError) {
      console.error("AI Code Review failed: ", aiCodeReviewError);
    }

    return NextResponse.json({
      success: true,
      prUrl: prData.html_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
