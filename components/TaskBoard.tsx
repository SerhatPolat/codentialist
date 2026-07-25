"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash } from "lucide-react";
import { ITask } from "@/types/workspace";

interface ITaskFields {
  title: string;
  desc: string;
}

interface TaskBoardProps {
  repository: string;
  initialTasks: ITask[];
}

export default function TaskBoard({
  repository,
  initialTasks,
}: TaskBoardProps) {
  const router = useRouter();

  const [tasks, setTasks] = useState<ITask[]>(initialTasks);
  const [taskFields, setTaskFields] = useState<ITaskFields>({
    title: "",
    desc: "",
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUpdatedTasks = async () => {
    const res = await fetch(
      `/api/tasks?repository=${encodeURIComponent(repository)}`
    );

    if (!res.ok) return;

    const data = await res.json();
    setTasks(data);
  };

  const handleCreateOrUpdateTask = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!taskFields.title.trim() || !taskFields.desc.trim())
      return alert("Title and description are required.");

    setIsLoading(true);

    try {
      const method = editingTaskId ? "PUT" : "POST";
      const payload = editingTaskId
        ? {
            id: editingTaskId,
            title: taskFields.title,
            description: taskFields.desc,
          }
        : { title: taskFields.title, description: taskFields.desc, repository };

      const res = await fetch("/api/tasks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      setTaskFields({
        title: "",
        desc: "",
      });
      setEditingTaskId(null);

      await fetchUpdatedTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSetup = (task: ITask) => {
    setEditingTaskId(task._id);
    setTaskFields({
      title: task.title,
      desc: task.description,
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });

      if (!res.ok) return;

      await fetchUpdatedTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const genericInputStyles =
    "w-full px-3 py-2 bg-slate-950 text-sm text-slate-100 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-400";

  const genericBtnStyles =
    "p-1.5 border rounded text-xs font-semibold shrink-0 transition disabled:brightness-75";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="h-fit lg:col-span-1 bg-slate-950 p-6 border border-slate-800 rounded-xl">
        <h3 className="text-lg text-slate-100 font-bold mb-4">
          {editingTaskId ? "Edit Workspace Task" : "Create Repository Task"}
        </h3>

        <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
              Task Scope Title
            </label>
            <input
              type="text"
              value={taskFields.title}
              onChange={(e) => {
                setTaskFields((prev) => ({
                  ...prev,
                  title: e.target.value,
                }));
              }}
              placeholder="e.g., Implement Microsoft Auth Callback"
              className={genericInputStyles}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
              Functional Specification Details
            </label>
            <textarea
              value={taskFields.desc}
              onChange={(e) => {
                setTaskFields((prev) => ({
                  ...prev,
                  desc: e.target.value,
                }));
              }}
              placeholder="Provide clean explicit feature instructions for the AI assistant..."
              className={`${genericInputStyles} h-32 resize-none`}
            />
          </div>

          <div className="flex space-x-2">
            {editingTaskId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTaskId(null);
                  setTaskFields({
                    title: "",
                    desc: "",
                  });
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 font-medium transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-400 disabled:bg-slate-800 rounded-lg text-sm text-white font-medium transition"
            >
              {editingTaskId ? "Save Modifications" : "Add Task"}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg text-slate-300 font-bold mb-4">Project Tasks</h3>

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition"
            >
              <div className="md:max-w-[calc(100%-240px)] space-y-1.5">
                <div className="flex items-center space-x-3">
                  <h4
                    title={task.title}
                    className="font-semibold text-slate-100 line-clamp-2"
                  >
                    {task.title}
                  </h4>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      task.status === "Done"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : task.status === "In Progress"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <p
                  title={task.description}
                  className="text-xs text-slate-400 line-clamp-2"
                >
                  {task.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 self-end md:self-center">
                {task.status !== "Done" && (
                  <button
                    onClick={() => handleEditSetup(task)}
                    title="Edit Task"
                    className={`${genericBtnStyles} bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-800`}
                  >
                    <Edit size={16} />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  disabled={isLoading}
                  title="Delete Task"
                  className={`${genericBtnStyles} bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border-slate-800`}
                >
                  <Trash size={16} />
                </button>
                <button
                  onClick={() => router.push(`/workspace/${task._id}`)}
                  className={`${genericBtnStyles} bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-400/20`}
                >
                  {task.status === "Done" ? "Check/Edit Codes" : "Code With AI"}{" "}
                  →
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 px-6 border border-dashed border-slate-800 rounded-xl text-center text-sm text-slate-500">
            No tasks found for this repository sandbox.
          </div>
        )}
      </div>
    </div>
  );
}
