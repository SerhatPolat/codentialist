"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import CodeWorkspace from "../../../components/CodeWorkspace";

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

  const initiateAiInitializationFlow = async () => {
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-200">
        <div className="max-w-xs w-full space-y-3 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto border-4 border-t-indigo-500 border-slate-700 rounded-full animate-spin shrink-0" />
          <p className="text-sm font-medium px-4">
            Synchronizing application context...
          </p>
        </div>
      </div>
    );
  }

  if (flowState === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="max-w-md w-full p-5 sm:p-6 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl">
          <h2
            className="text-lg sm:text-xl font-bold text-slate-100 truncate mb-2"
            title="Initialize AI Task Workspace"
          >
            Initialize AI Task Workspace
          </h2>

          <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-6 text-slate-400 text-xs">
            <span className="shrink-0">Repository:</span>
            <code
              className="max-w-full text-amber-400 font-mono truncate"
              title={repoInfo.repo || "-"}
            >
              {repoInfo.repo || "-"}
            </code>
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Base Branch
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
                className="w-full px-3 py-2 bg-slate-900 text-sm text-slate-100 font-mono border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={initiateAiInitializationFlow}
            className="w-full p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-sm text-white truncate transition shadow-lg shadow-indigo-600/20"
            title="Pull Codebase & Run AI Blueprint Analysis"
          >
            Pull Codebase & Run AI Blueprint Analysis
          </button>
        </div>
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
