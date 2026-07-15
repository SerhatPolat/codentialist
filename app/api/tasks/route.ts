import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const repository = searchParams.get("repository");

  try {
    if (id) {
      const task = await Task.findById(id);
      if (!task)
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    if (repository) {
      const tasks = await Task.find({ repository }).sort({ createdAt: -1 });
      return NextResponse.json(tasks);
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
  await connectToDatabase();
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id)
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
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
  await connectToDatabase();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );

    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask)
      return NextResponse.json(
        { error: "Task targets not found" },
        { status: 404 }
      );

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
