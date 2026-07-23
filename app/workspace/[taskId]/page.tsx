"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import LoadingView from "@/components/LoadingView";
import OrbsBackground from "@/components/OrbsBackground";
import CodeWorkspace from "@/components/CodeWorkspace";

interface IRepoInfoState {
  branch: string;
  repo: string;
}

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);

  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [repoInfo, setRepoInfo] = useState<IRepoInfoState>({
    branch: "",
    repo: "",
  });
  const [flowState, setFlowState] = useState<"setup" | "active">("setup");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTaskContext = async () => {
      setIsLoading(true);

      const res = await fetch(`/api/tasks?id=${taskId}`);

      if (res.ok) {
        const data = await res.json();

        setTask(data);
        setRepoInfo((prev) => ({
          ...prev,
          repo: data.repository,
        }));

        if (data.filesSnapshot && data.filesSnapshot.length > 0) {
          setFlowState("active");
        }
      }

      setIsLoading(false);
    };

    loadTaskContext();
  }, [taskId]);

  const initiateAiInitializationFlow = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!repoInfo.repo.trim()) return alert("Repository info is missing.");
    if (!repoInfo.branch.trim()) return alert("Branch name is required.");

    setIsLoading(true);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status: "In Progress",
          branch: repoInfo.branch,
        }),
      });

      const codeResRaw = await fetch("/api/github/fetch-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: repoInfo.repo,
          branch: repoInfo.branch,
        }),
      });
      const codeRes = await codeResRaw.json();

      const aiAnalysisResRaw = await fetch("/api/ai/analyze-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          files: codeRes.files,
        }),
      });
      const aiAnalysisRes = await aiAnalysisResRaw.json();

      const consolidatedFiles = [...codeRes.files];
      if (aiAnalysisRes.files) {
        aiAnalysisRes.files.forEach((aiFile: any) => {
          const matchIdx = consolidatedFiles.findIndex(
            (f) => f.path === aiFile.path
          );
          if (matchIdx > -1) {
            consolidatedFiles[matchIdx] = {
              ...consolidatedFiles[matchIdx],
              content: aiFile.content,
              status: aiFile.status,
            };
          } else {
            consolidatedFiles.push(aiFile);
          }
        });
      }

      setTask((prev: any) => ({
        ...prev,
        filesSnapshot: consolidatedFiles,
        aiExplanation: aiAnalysisRes.explanation,
      }));
      setFlowState("active");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeWorkspaceTrackingState = async (finalFiles: any[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status: "Done",
          filesSnapshot: finalFiles,
        }),
      });

      if (response.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingView />;
  }

  if (flowState === "setup") {
    return (
      <div className="relative isolate min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="max-w-md w-full p-5 sm:p-6 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl">
          <h2
            className="text-lg sm:text-xl font-bold text-slate-100 truncate mb-2"
            title="Initialize AI Task Workspace"
          >
            Initialize AI Task Workspace
          </h2>

          <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-4 text-slate-400 text-xs">
            <span className="shrink-0">Repository:</span>
            <code
              className="max-w-full text-amber-400 font-mono truncate"
              title={repoInfo.repo || "-"}
            >
              {repoInfo.repo || "-"}
            </code>
          </p>

          <form onSubmit={initiateAiInitializationFlow} className="space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Base Branch{" "}
                <span className="text-slate-500 text-[9px]">
                  (must be valid)
                </span>
              </label>
              <input
                type="text"
                value={repoInfo.branch}
                onChange={(e) => {
                  setRepoInfo((prev) => ({
                    ...prev,
                    branch: e.target.value,
                  }));
                }}
                placeholder="e.g., main, dev, feature/auth-v2"
                className="w-full px-3 py-2 bg-slate-950 text-sm text-slate-100 font-mono border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-white to-white hover:from-indigo-400 hover:to-cyan-400 text-slate-950 hover:text-white text-sm sm:text-lg font-bold tracking-wide rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-400/30"
              title="Pull Codes & Start AI Analysis"
            >
              Pull Codes & Start AI Analysis
            </button>
          </form>
        </div>

        <OrbsBackground />
      </div>
    );
  }

  if (flowState === "active") {
    return (
      <CodeWorkspace
        initialFiles={task.filesSnapshot}
        taskData={{ title: task.title, description: task.description }}
        onFinish={finalizeWorkspaceTrackingState}
      />
    );
  }
}
