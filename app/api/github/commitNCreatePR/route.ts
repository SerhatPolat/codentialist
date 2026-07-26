import { project } from "@/projectInfo";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session.accessToken)
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

  try {
    const changedFiles = files.filter((f: any) => f.status !== "original");

    if (changedFiles.length === 0) {
      return NextResponse.json(
        { error: "No modified files detected to commit." },
        { status: 400 }
      );
    }

    const refRes = await fetch(
      `https://api.github.com/repos/${repository}/git/refs/heads/${baseBranch}`,
      { headers }
    );
    if (!refRes.ok)
      throw new Error(`Base branch '${baseBranch || "-"}' not found.`);
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    const commitRes = await fetch(
      `https://api.github.com/repos/${repository}/git/commits/${baseSha}`,
      { headers }
    );
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

    const createTreeRes = await fetch(
      `https://api.github.com/repos/${repository}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
      }
    );
    if (!createTreeRes.ok) throw new Error("Failed to create Git tree.");
    const newTreeData = await createTreeRes.json();

    const projectPrefix = project.title
      ? `[${project.title.toUpperCase()}] `
      : "";
    const commitMessage = `${projectPrefix}${
      description ? `${title}\n\n${description}` : title
    }`;
    const createCommitRes = await fetch(
      `https://api.github.com/repos/${repository}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeData.sha,
          parents: [baseSha],
        }),
      }
    );
    if (!createCommitRes.ok) throw new Error("Failed to create Git commit.");
    const newCommitData = await createCommitRes.json();

    const newBranchName = `task-${taskId}`;
    const createRefRes = await fetch(
      `https://api.github.com/repos/${repository}/git/refs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName}`,
          sha: newCommitData.sha,
        }),
      }
    );
    if (!createRefRes.ok) throw new Error("Failed to create new branch.");

    const prDescription = `${description}\n\n[DISCLAIMER: This pull request created by ${
      project.title || "an AI app"
    }. There can be problematic changes because of the AI usage. So do not forget to review carefully.]`;
    const createPrRes = await fetch(
      `https://api.github.com/repos/${repository}/pulls`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title,
          body: prDescription,
          head: newBranchName,
          base: baseBranch,
        }),
      }
    );
    if (!createPrRes.ok) throw new Error("Failed to create pull request.");
    const prData = await createPrRes.json();

    return NextResponse.json({
      success: true,
      prUrl: prData.html_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
