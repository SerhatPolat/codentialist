import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  const { repository, branch } = await req.json();

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!repoRes.ok)
      return NextResponse.json(
        { error: "Repository access denied" },
        { status: 403 }
      );

    const branchRes = await fetch(
      `https://api.github.com/repos/${repository}/branches/${branch}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!branchRes.ok)
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    const branchData = await branchRes.json();
    const treeSha = branchData.commit.commit.tree.sha;

    const treeRes = await fetch(
      `https://api.github.com/repos/${repository}/git/trees/${treeSha}?recursive=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const treeData = await treeRes.json();

    const filesData = await Promise.all(
      treeData.tree
        .filter((node: any) => node.type === "blob")
        .map(async (node: any) => {
          const contentRes = await fetch(node.url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3.raw",
            },
          });
          const contentText = contentRes.ok ? await contentRes.text() : "";
          return {
            path: node.path,
            content: contentText,
            status: "original",
          };
        })
    );

    return NextResponse.json({ files: filesData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
