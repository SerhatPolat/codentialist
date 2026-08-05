"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash, GitPullRequest, X, Wand2, Check } from "lucide-react";
import { ITask } from "@/types/workspace";

interface ITaskNGitFields {
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
  const [taskFields, setTaskFields] = useState<ITaskNGitFields>({
    title: "",
    desc: "",
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeGitTask, setActiveGitTask] = useState<ITask | null>(null);
  const [gitFields, setGitFields] = useState<ITaskNGitFields>({
    title: "",
    desc: "",
  });
  const [isGitLoading, setIsGitLoading] = useState(false);

  const [isAITaskCreatorModalOpen, setIsAITaskCreatorModalOpen] =
    useState(false);
  const [aiTaskCreatorFlowState, setAITaskCreatorFlowState] = useState<
    "branch_selection" | "loading" | "ideas"
  >("branch_selection");
  const [taskIdeas, setTaskIdeas] = useState<
    { title: string; description: string }[]
  >([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);

  const fetchTasks = async () => {
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

      setTaskFields({ title: "", desc: "" });
      setEditingTaskId(null);

      await fetchTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSetup = (task: ITask) => {
    setEditingTaskId(task._id);
    setTaskFields({ title: task.title, desc: task.description });
  };

  const handleDeleteTask = async (id: string, bypassConfirmation?: boolean) => {
    if (!bypassConfirmation) {
      if (!confirm("Are you sure you want to delete this task?")) return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) return;

      await fetchTasks();
    } finally {
      setIsLoading(false);
    }
  };

  const openGitModal = (task: ITask) => {
    setGitFields({ title: "", desc: "" });
    setActiveGitTask(task);
  };

  const handleCommitNCreatePR = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!activeGitTask || isGitLoading) return;

    if (!gitFields.title.trim()) return alert("Title is required.");

    setIsGitLoading(true);

    try {
      const res = await fetch("/api/github/commitNCreatePR", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: activeGitTask._id,
          repository: activeGitTask.repository,
          baseBranch: activeGitTask.branch,
          title: gitFields.title,
          description: gitFields.desc,
          files: activeGitTask.filesSnapshot,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        window.open(data.prUrl, "_blank", "noopener,noreferrer");

        handleDeleteTask(activeGitTask._id, true);

        setActiveGitTask(null);
        setGitFields({ title: "", desc: "" });
      }
    } catch (err: any) {
      console.error(err);
      alert(
        err.message || "Failed to complete commit & create pull request action."
      );
    } finally {
      setIsGitLoading(false);
    }
  };

  const openAITaskCreatorModal = async () => {
    setAITaskCreatorFlowState("branch_selection");
    setSelectedBranch("");
    setTaskIdeas([]);
    setIsFetchingBranches(true);
    setIsAITaskCreatorModalOpen(true);

    try {
      const res = await fetch(
        `/api/github/branches?repo=${encodeURIComponent(repository)}`
      );

      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data.branches) ? data.branches : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const generateTaskIdeas = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!selectedBranch) return alert("Branch info is required.");

    setAITaskCreatorFlowState("loading");

    try {
      const codeResRaw = await fetch("/api/github/fetch-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository, branch: selectedBranch }),
      });
      const codeRes = await codeResRaw.json();

      const aiResRaw = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: codeRes.files }),
      });
      const aiRes = await aiResRaw.json();

      setTaskIdeas(Array.isArray(aiRes) ? aiRes : []);
      setAITaskCreatorFlowState("ideas");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate ideas.");
      setIsAITaskCreatorModalOpen(false);
    }
  };

  const confirmTaskIdea = async (
    idea: { title: string; description: string },
    index: number
  ) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          repository,
        }),
      });

      if (res.ok) {
        if (taskIdeas.length === 1) {
          fetchTasks();
          setIsAITaskCreatorModalOpen(false);
        }

        setTaskIdeas((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add task.");
    } finally {
      setIsLoading(false);
    }
  };

  const genericInputStyles =
    "w-full px-3 py-2 bg-slate-950 text-sm text-slate-100 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-400";

  const genericBtnStyles =
    "p-1.5 border rounded text-xs font-semibold shrink-0 transition disabled:brightness-75";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-fit lg:col-span-1 bg-slate-950 p-6 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg text-slate-100 font-bold">
              {editingTaskId ? "Edit Workspace Task" : "Create Repository Task"}
            </h3>

            {!editingTaskId && (
              <button
                onClick={openAITaskCreatorModal}
                className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-400/20 rounded transition"
                title="Create Tasks With AI"
              >
                <Wand2 size={16} className="shrink-0" />
              </button>
            )}
          </div>

          <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                Task Scope Title
              </label>
              <input
                type="text"
                value={taskFields.title}
                onChange={(e) =>
                  setTaskFields({ ...taskFields, title: e.target.value })
                }
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
                onChange={(e) =>
                  setTaskFields({ ...taskFields, desc: e.target.value })
                }
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
                    setTaskFields({ title: "", desc: "" });
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
          <h3 className="text-lg text-slate-300 font-bold mb-4">
            Project Tasks
          </h3>

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
                    {task.status === "Done"
                      ? "Check/Edit Codes"
                      : "Code With AI"}{" "}
                    →
                  </button>

                  {task.status === "Done" && (
                    <button
                      onClick={() => openGitModal(task)}
                      title="Commit & Create Pull Request"
                      className={`${genericBtnStyles} bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-400/20`}
                    >
                      <GitPullRequest size={16} />
                    </button>
                  )}
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

      {/* AI Task Creator Modal */}
      {isAITaskCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex flex-col max-h-[90vh] w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h3 className="flex items-center gap-2 w-[80%] text-lg font-bold text-slate-100">
                <Wand2 size={20} className="text-indigo-400 shrink-0" />
                <span title="Create Tasks With AI" className="truncate">
                  Create Tasks With AI
                </span>
              </h3>

              <button
                onClick={() => {
                  if (aiTaskCreatorFlowState === "ideas") fetchTasks();

                  setIsAITaskCreatorModalOpen(false);
                }}
                disabled={aiTaskCreatorFlowState === "loading"}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto min-h-0 flex-1">
              {aiTaskCreatorFlowState === "branch_selection" && (
                <form onSubmit={generateTaskIdeas} className="space-y-4">
                  <p className="text-sm text-slate-400 mb-4">
                    Select a base branch to fetch the codes. AI will analyze the
                    codes to suggest innovative feature/improvement ideas.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                      Select Branch
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        disabled={isFetchingBranches || branches.length === 0}
                        title={selectedBranch}
                        className="w-full truncate pl-3 py-2 pr-9 bg-slate-950 text-sm text-slate-100 border border-slate-800 hover:border-indigo-400 rounded-lg focus:outline-none transition appearance-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>
                          Select a branch
                        </option>

                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>

                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="m6 9 6 6 6-6"
                        />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isFetchingBranches || !selectedBranch}
                    className="flex items-center gap-2 px-4 py-2 ml-auto bg-indigo-600 hover:bg-indigo-400 disabled:bg-slate-800 rounded-lg text-xs sm:text-sm text-white font-medium transition"
                  >
                    {!isFetchingBranches && (
                      <Wand2 size={16} className="shrink-0" />
                    )}
                    {isFetchingBranches
                      ? "Fetching branches..."
                      : "Analyze Code & Generate Ideas"}
                  </button>
                </form>
              )}

              {aiTaskCreatorFlowState === "loading" && (
                <div className="flex flex-col items-center justify-center space-y-4 py-16">
                  <div className="w-10 h-10 border-4 border-t-indigo-400 border-slate-700 rounded-full animate-spin shrink-0"></div>
                  <p className="text-slate-400 text-sm text-center">
                    Analyzing codes & generating robust task ideas...
                  </p>
                </div>
              )}

              {aiTaskCreatorFlowState === "ideas" && (
                <div className="space-y-4">
                  {taskIdeas.length > 0 ? (
                    taskIdeas.map((idea, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-start justify-between gap-4 p-4 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl transition"
                      >
                        <div className="w-full flex items-center justify-between gap-2">
                          <h4 className="font-bold text-indigo-300 text-xs sm:text-sm break-all sm:break-normal">
                            {idea.title || "-"}
                          </h4>

                          <button
                            onClick={() => confirmTaskIdea(idea, index)}
                            disabled={isLoading}
                            className="flex items-center gap-1 p-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            <Check size={14} className="shrink-0" />
                            Confirm
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 break-all sm:break-normal leading-relaxed">
                          {idea.description || "-"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                      No task ideas.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Commit & Create PR Modal */}
      {activeGitTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h3 className="flex items-center gap-2 w-[80%] text-lg font-bold text-slate-100">
                <GitPullRequest
                  size={20}
                  className="text-emerald-400 shrink-0"
                />
                <span title="Commit & Create Pull Request" className="truncate">
                  Commit & Create Pull Request
                </span>
              </h3>

              <button
                onClick={() => {
                  setActiveGitTask(null);
                  setGitFields({ title: "", desc: "" });
                }}
                disabled={isGitLoading}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCommitNCreatePR} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                  Commit/PR Title
                </label>
                <input
                  type="text"
                  value={gitFields.title}
                  onChange={(e) =>
                    setGitFields({ ...gitFields, title: e.target.value })
                  }
                  placeholder="e.g., feat: added auth logics"
                  className={genericInputStyles}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                  Commit/PR Description
                </label>
                <textarea
                  value={gitFields.desc}
                  onChange={(e) =>
                    setGitFields({ ...gitFields, desc: e.target.value })
                  }
                  placeholder="Detailed explanation of the changes..."
                  className={`${genericInputStyles} h-32 resize-none`}
                />
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveGitTask(null);
                    setGitFields({ title: "", desc: "" });
                  }}
                  disabled={isGitLoading}
                  className="px-3 py-2 bg-transparent hover:bg-slate-800 disabled:opacity-50 rounded-lg text-xs sm:text-sm text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGitLoading}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-lg text-xs sm:text-sm text-white font-medium transition"
                >
                  {isGitLoading ? "Pushing Changes..." : "Commit & Create PR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
