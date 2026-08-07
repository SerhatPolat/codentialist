import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";

async function verifyRepoAccess(repository: string, token: string) {
  const res = await fetch(`https://api.github.com/repos/${repository}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  return res.ok;
}

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const repository = searchParams.get("repository");

  try {
    if (id) {
      const task = await Task.findById(id);
      if (!task)
        return NextResponse.json({ error: "Task not found" }, { status: 404 });

      const hasAccess = await verifyRepoAccess(task.repository, token);
      if (!hasAccess)
        return NextResponse.json(
          { error: "Forbidden: Access denied" },
          { status: 403 }
        );

      return NextResponse.json(task);
    }

    if (repository) {
      const hasAccess = await verifyRepoAccess(repository, token);
      if (!hasAccess)
        return NextResponse.json(
          { error: "Forbidden: Access denied" },
          { status: 403 }
        );

      const tasks = await Task.find({ repository }).sort({ createdAt: -1 });
      return NextResponse.json(tasks);
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  await connectToDatabase();

  try {
    const body = await req.json();
    const { title, description, repository } = body;

    if (!title || !description || !repository) {
      return NextResponse.json(
        { error: "Missing required task data" },
        { status: 400 }
      );
    }

    const hasAccess = await verifyRepoAccess(repository, token);
    if (!hasAccess)
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 }
      );

    const newTask = await Task.create({
      title,
      description,
      repository,
      status: "Pending",
      filesSnapshot: [],
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  await connectToDatabase();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id)
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );

    const existingTask = await Task.findById(id);
    if (!existingTask)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const hasAccess = await verifyRepoAccess(existingTask.repository, token);
    if (!hasAccess)
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 }
      );

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    });
    if (!updatedTask)
      return NextResponse.json(
        { error: "Task targets not found" },
        { status: 404 }
      );

    return NextResponse.json(updatedTask);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.accessToken)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = session.accessToken;

  await connectToDatabase();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );

    const task = await Task.findById(id);
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const hasAccess = await verifyRepoAccess(task.repository, token);
    if (!hasAccess)
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 }
      );

    await Task.findByIdAndDelete(id);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
