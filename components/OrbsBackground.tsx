export default function OrbsBackground() {
  const genericOrbStyles =
    "absolute rounded-full mix-blend-screen filter animate-pulse";

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
      <div
        className={`${genericOrbStyles} top-[-10%] left-[-10%] w-160 h-160 bg-indigo-400/30 blur-[100px]`}
        style={{ animationDuration: "8s" }}
      />

      <div
        className={`${genericOrbStyles} top-[20%] left-[20%] w-120 h-120 bg-indigo-400/10 blur-[80px] delay-500`}
        style={{ animationDuration: "12s" }}
      />

      <div
        className={`${genericOrbStyles} bottom-[-10%] right-[-10%] w-160 h-160 bg-cyan-400/20 blur-[100px] delay-1000`}
        style={{ animationDuration: "10s" }}
      />
    </div>
  );
}
