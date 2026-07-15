"use client";

import { project } from "@/projectInfo";
import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import TaskBoard from "@/components/TaskBoard";
import { ITask } from "@/types/workspace";

export default function Home() {
  const { data: session, status } = useSession();

  const [repoInput, setRepoInput] = useState("");
  const [activeRepo, setActiveRepo] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyRepositoryAccessGate = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!repoInput.includes("/") || repoInput.split("/").length !== 2) {
      return alert(
        "Please enter a valid format execution string (e.g., owner/repo-name)"
      );
    }

    setIsVerifying(true);

    try {
      const res = await fetch(`https://api.github.com/repos/${repoInput}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
      });

      if (!res.ok) {
        alert(
          "Access Denied: You don't have valid permission for this GitHub repository."
        );
        setIsVerifying(false);
        return;
      }

      const taskRes = await fetch(
        `/api/tasks?repository=${encodeURIComponent(repoInput)}`
      );

      if (taskRes.ok) {
        setTasks(await taskRes.json());
        setActiveRepo(repoInput);
      }
    } catch {
      alert("Verification processing failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center bg-slate-950 p-8 space-y-6 border border-slate-800 rounded-2xl shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-slate-400">{project.description}</p>
          </div>

          <button
            onClick={() => signIn("github")}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl transition shadow-lg tracking-wide flex items-center justify-center space-x-2"
          >
            <span>Sign In With GitHub</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 gap-4 sm:gap-4">
          <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto min-w-0 items-center gap-2 sm:gap-4">
            <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent text-md font-black select-none shrink-0">
              {project.title}
            </span>

            {activeRepo && (
              <span
                title={`Active Project Sandbox: ${activeRepo}`}
                className="max-w-full sm:max-w-50 md:max-w-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-amber-400 text-xs font-mono truncate shrink-0"
              >
                Active Project Sandbox: {activeRepo}
              </span>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3 shrink-0">
            <span
              title={`Hi, ${session.user?.name}`}
              className="max-w-30 sm:max-w-37.5 text-xs text-slate-400 font-medium truncate"
            >
              Hi, {session.user?.name}
            </span>
            <button
              onClick={() => signOut()}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 shrink-0 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeRepo ? (
          <div className="space-y-4 sm:space-y-6">
            <button
              onClick={() => {
                setActiveRepo(null);
                setRepoInput("");
              }}
              className="flex items-center space-x-1 w-fit max-w-full text-xs text-slate-400 hover:text-white font-medium truncate transition"
              title="Switch Repository Sandbox"
            >
              <span>← Switch Repository Sandbox</span>
            </button>

            <TaskBoard repository={activeRepo} initialTasks={tasks} />
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto mt-8 sm:mt-16 p-5 sm:p-6 space-y-4 bg-slate-950 border border-slate-800 rounded-xl shadow-xl">
            <div>
              <h2 className="text-md font-bold text-slate-200">
                Project Entry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Please provide a target project to pull existing task management
                contexts.
              </p>
            </div>

            <form onSubmit={verifyRepositoryAccessGate} className="space-y-3">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g., SerhatPolat/codentialist"
                className="w-full bg-slate-900 px-3 py-2 text-sm text-slate-100 font-mono border border-slate-800 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg text-sm text-white font-semibold truncate transition"
                title={
                  isVerifying
                    ? "Validating Repository..."
                    : "Verify Access & Open Board"
                }
              >
                {isVerifying
                  ? "Validating Repository..."
                  : "Verify Access & Open Board"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
