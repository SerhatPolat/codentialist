import GridBackground from "./GridBackground";

export default function LoadingView() {
  return (
    <div className="relative isolate min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-200">
      <div className="max-w-xs w-full space-y-3 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto border-4 border-t-indigo-400 border-slate-700 rounded-full animate-spin shrink-0" />
        <p className="text-sm font-medium">Loading...</p>
      </div>

      <GridBackground />
    </div>
  );
}
