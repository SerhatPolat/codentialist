import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  const { searchParams } = req.nextUrl;
  const repo = searchParams.get("repo");

  if (!repo)
    return NextResponse.json(
      { error: "Repository parameter is required" },
      { status: 400 }
    );

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/branches`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const branchesData = await res.json();
    const branches = branchesData.map(
      (branch: { name: string }) => branch.name
    );

    return NextResponse.json({ branches }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
