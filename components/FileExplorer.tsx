"use client";

import { useState, useEffect, useMemo } from "react";
import { IFileSnapshot } from "@/types/workspace";

interface FileExplorerProps {
  files: IFileSnapshot[];
  selectedPath: string;
  onSelect: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: IFileSnapshot;
}

const buildFileTree = (files: IFileSnapshot[]): TreeNode[] => {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: [],
        };
        if (isLast) {
          existingNode.file = file;
        }
        currentLevel.push(existingNode);
      }

      currentLevel = existingNode.children;
    });
  });

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.isFolder) sortTree(node.children);
    });
  };

  sortTree(root);
  return root;
};

export default function FileExplorer({
  files,
  selectedPath,
  onSelect,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    if (!selectedPath) return;
    const parts = selectedPath.split("/");
    if (parts.length <= 1) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedFolders((prev) => {
      const next = { ...prev };
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        next[currentPath] = true;
      }
      return next;
    });
  }, [selectedPath]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const isCurrentlyOpen = prev[path] !== false;
      return {
        ...prev,
        [path]: !isCurrentlyOpen,
      };
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = node.path === selectedPath;

    const isFolderOpen = expandedFolders[node.path] !== false;

    if (node.isFolder) {
      return (
        <div key={node.path} className="w-full">
          <button
            onClick={() => toggleFolder(node.path)}
            className="group w-full flex items-center px-2 py-1 hover:bg-slate-800/50 text-slate-300 hover:text-slate-100 text-xs font-medium transition"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <svg
              className={`w-3.5 h-3.5 mr-1 text-slate-500 transition-transform duration-150 ${
                isFolderOpen ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>

            <svg
              className="w-4 h-4 mr-1.5 text-indigo-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isFolderOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9l-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              )}
            </svg>

            <span title={node.name} className="truncate select-none">
              {node.name}
            </span>
          </button>

          {isFolderOpen && (
            <div className="relative w-full">
              <div
                className="absolute left-0 top-0 bottom-0 border-l border-slate-800 pointer-events-none"
                style={{ left: `${depth * 12 + 15}px` }}
              />
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    let statusClass = "text-slate-400 hover:text-slate-200";
    let badgeLabel = "";
    let badgeClass = "";

    const isDeleted = node.file?.status === "deleted";

    if (node.file?.status === "modified") {
      statusClass = "text-amber-400/90 hover:text-amber-300";
      badgeLabel = "M";
      badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    } else if (node.file?.status === "added") {
      statusClass = "text-emerald-400/90 hover:text-emerald-300";
      badgeLabel = "A";
      badgeClass =
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    } else if (isDeleted) {
      statusClass = "text-rose-500/70 hover:text-rose-500/90 line-through";
      badgeLabel = "D";
      badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }

    return (
      <button
        key={node.path}
        disabled={isDeleted}
        onClick={() => onSelect(node.path)}
        className={`w-full flex items-center px-2 py-1 text-xs text-left border-l-2 transition ${
          isSelected
            ? "bg-indigo-600/10 border-indigo-400 text-indigo-300 font-medium"
            : `border-transparent ${statusClass} ${
                isDeleted ? "opacity-60" : "hover:bg-slate-800/40"
              }`
        }`}
        style={{ paddingLeft: `${depth * 12 + 22}px` }}
      >
        <svg
          className={`w-3.5 h-3.5 mr-2 shrink-0 ${
            isDeleted ? "text-rose-900" : "text-slate-500"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <span title={node.name} className="flex-1 truncate select-none">
          {node.name}
        </span>

        {badgeLabel && (
          <span
            className={`w-4 h-4 flex items-center justify-center shrink-0 ml-1.5 text-[9px] font-mono font-bold rounded ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col py-2 font-sans select-none overflow-x-hidden">
      {fileTree.length > 0 ? (
        fileTree.map((node) => renderNode(node, 0))
      ) : (
        <div className="px-4 py-3 text-xs text-slate-500 italic">
          No entries detected
        </div>
      )}
    </div>
  );
}
