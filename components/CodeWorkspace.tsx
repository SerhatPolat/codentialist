"use client";

import { project } from "@/projectInfo";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Editor, { Monaco } from "@monaco-editor/react";
import FileExplorer from "./FileExplorer";
import { IFileSnapshot } from "@/types/workspace";

const getLanguageFromPath = (path: string): string => {
  if (!path) return "plaintext";

  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "scss":
    case "sass":
      return "scss";
    case "less":
      return "less";
    case "md":
    case "markdown":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "py":
      return "python";
    case "sh":
    case "bash":
      return "shell";
    case "dockerfile":
      return "dockerfile";
    case "sql":
      return "sql";
    case "xml":
      return "xml";
    default:
      if (path.toLowerCase().includes(".env")) return "ini";
      return "plaintext";
  }
};

interface IAssistantState {
  prompt: string;
  aiExplanation: string;
}

interface CodeWorkspaceProps {
  initialFiles: IFileSnapshot[];
  taskData: { title: string; description: string };
  onFinish: (updatedFiles: IFileSnapshot[]) => void;
}

export default function CodeWorkspace({
  initialFiles,
  taskData,
  onFinish,
}: CodeWorkspaceProps) {
  const router = useRouter();

  const [files, setFiles] = useState<IFileSnapshot[]>(initialFiles);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [assistantState, setAssistantState] = useState<IAssistantState>({
    prompt: "",
    aiExplanation: "",
  });
  const [isLoadingAssistantResponse, setIsLoadingAssistantResponse] =
    useState(false);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];

  useEffect(() => {
    if (files.length > 0 && !selectedFilePath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFilePath(files[0].path);
    }
  }, [files, selectedFilePath]);

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.path === activeFile.path
          ? {
              ...f,
              content: value,
              status: f.status === "original" ? "modified" : f.status,
            }
          : f
      )
    );
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const supportedLanguages = [
      "typescript",
      "javascript",
      "json",
      "html",
      "css",
      "scss",
      "yaml",
      "python",
      "plaintext",
    ];

    let debounceTimeout: NodeJS.Timeout | null = null;

    const provider = {
      provideInlineCompletions: async (
        model: any,
        position: any,
        token: any
      ) => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        return new Promise((resolve) => {
          debounceTimeout = setTimeout(async () => {
            if (token.isCancellationRequested) {
              return resolve({ items: [] });
            }

            abortControllerRef.current = new AbortController();

            const textUntilPosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const totalLines = model.getLineCount();

            const textAfterPosition = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: totalLines,
              endColumn: model.getLineMaxColumn(totalLines),
            });

            try {
              const response = await fetch("/api/ai/auto-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  prefix: textUntilPosition,
                  suffix: textAfterPosition,
                }),
                signal: abortControllerRef.current.signal,
              });

              const data = await response.json();

              if (!data.suggestion || token.isCancellationRequested) {
                return resolve({ items: [] });
              }

              return resolve({
                items: [
                  {
                    insertText: data.suggestion,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  },
                ],
              });
            } catch {
              return resolve({ items: [] });
            }
          }, 1000);
        });
      },
      freeInlineCompletions: () => {},
    };

    supportedLanguages.forEach((lang) => {
      monaco.languages.registerInlineCompletionsProvider(lang, provider);
    });
  };

  const triggerAssistantAdjustment = async () => {
    if (!assistantState.prompt.trim()) return;

    setIsLoadingAssistantResponse(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: assistantState.prompt,
          files: files,
        }),
      });

      const dynamicPayload = await res.json();
      if (dynamicPayload.files) {
        setFiles((prev) => {
          const updated = [...prev];
          dynamicPayload.files.forEach((f: any) => {
            const existingIdx = updated.findIndex(
              (file) => file.path === f.path
            );
            if (existingIdx > -1) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                content: f.content,
                status: f.status,
              };
            } else {
              updated.push(f);
            }
          });
          return updated;
        });

        setAssistantState((prev) => ({
          ...prev,
          aiExplanation: dynamicPayload.explanation,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssistantState((prev) => ({
        ...prev,
        prompt: "",
      }));
      setIsLoadingAssistantResponse(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-slate-950 text-slate-100 lg:overflow-hidden">
      <div className="w-full lg:w-64 h-[35vh] lg:h-full flex flex-col bg-slate-950 lg:border-r border-b border-slate-800 shrink-0 lg:shrink">
        <div className="p-3 sm:p-4 border-b border-slate-800 shrink-0">
          <button
            onClick={() => router.push("/")}
            className="font-semibold text-xs sm:text-sm text-slate-400 tracking-wider uppercase"
          >
            {project.title}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <FileExplorer
            files={files}
            selectedPath={selectedFilePath}
            onSelect={setSelectedFilePath}
          />
        </div>

        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <button
            onClick={() => onFinish(files)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="w-full h-[65vh] lg:h-full min-w-0 min-h-0 flex flex-col lg:flex-1 flex-none">
        <div className="flex justify-between items-center gap-3 p-2 sm:p-3 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex flex-1 items-center space-x-2 sm:space-x-3 min-w-0">
            <span
              title={selectedFilePath || "No File Selected"}
              className="w-full min-w-0 block truncate text-xs sm:text-sm text-amber-400 font-mono"
            >
              {selectedFilePath || "No File Selected"}
            </span>

            {activeFile && (
              <span
                className="max-w-20 sm:max-w-none px-1.5 py-0.5 truncate text-[10px] text-slate-400 font-mono bg-slate-950 border border-slate-800 rounded shrink-0"
                title={getLanguageFromPath(activeFile.path)}
              >
                {getLanguageFromPath(activeFile.path)}
              </span>
            )}
          </div>

          {activeFile?.status !== "original" && (
            <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              {activeFile?.status}
            </span>
          )}
        </div>

        <div className="flex-1 relative w-full min-h-0">
          {activeFile && (
            <div className="absolute inset-0 w-full h-full">
              <Editor
                height="100%"
                width="100%"
                theme="vs-dark"
                path={activeFile.path}
                language={getLanguageFromPath(activeFile.path)}
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  inlineSuggest: { enabled: true, mode: "prefix" },
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full lg:w-80 h-[45vh] lg:h-full bg-slate-950 lg:border-l border-t lg:border-t-0 border-slate-800 shrink-0 lg:shrink">
        <div className="p-3 sm:p-4 border-b border-slate-800 shrink-0">
          <h3
            className="font-semibold text-xs sm:text-sm tracking-wider uppercase text-slate-400 truncate"
            title="Interactive Assistant"
          >
            Interactive Assistant
          </h3>
        </div>

        <div className="flex-1 min-h-0 p-3 sm:p-4 space-y-4 overflow-y-auto">
          <div className="bg-slate-950 p-3 border border-slate-800 rounded">
            <h4 className="mb-1 font-medium text-[10px] sm:text-xs text-slate-400">
              Task Context
            </h4>
            <p className="text-xs sm:text-sm font-semibold wrap-break-word">
              {taskData.title}
            </p>
            <p className="mt-1 text-xs text-slate-400 wrap-break-word">
              {taskData.description}
            </p>
          </div>

          {assistantState.aiExplanation && (
            <div className="bg-indigo-950/30 p-3 border border-indigo-900/50 rounded text-xs text-indigo-200 wrap-break-word">
              <strong className="block mb-1 text-indigo-400">
                AI Explanation:
              </strong>
              {assistantState.aiExplanation}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 space-y-2 bg-slate-950 border-t border-slate-800 shrink-0">
          <textarea
            value={assistantState.prompt}
            onChange={(e) =>
              setAssistantState({
                ...assistantState,
                prompt: e.target.value,
              })
            }
            placeholder="Instruct workspace modifications..."
            className="w-full h-16 sm:h-20 p-2 resize-none bg-slate-950 text-slate-200 text-xs border border-slate-800 rounded focus:outline-none focus:border-indigo-400"
          />

          <button
            onClick={triggerAssistantAdjustment}
            disabled={isLoadingAssistantResponse}
            className="w-full p-2 bg-indigo-600 hover:bg-indigo-400 disabled:bg-slate-800 rounded text-xs text-white font-medium truncate transition"
            title={
              isLoadingAssistantResponse ? "Refining Code..." : "Modify With AI"
            }
          >
            {isLoadingAssistantResponse ? "Refining Code..." : "Modify With AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
