export default function GridBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
              linear-gradient(to right, #818cf8 1px, transparent 1px), 
              linear-gradient(to bottom, #22d3ee 1px, transparent 1px)
            `,
          backgroundSize: "4rem 4rem",
          maskImage:
            "radial-gradient(circle at center, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black, transparent 80%)",
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-50 blur-[1px]"
        style={{ animation: "scan 4s linear infinite" }}
      />

      <style>{`
          @keyframes scan {
            0% { transform: translateY(-10vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}</style>
    </div>
  );
}
