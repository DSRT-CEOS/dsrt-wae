// ============================================
// DSRT WAE — Main Dashboard Page
// 
// RIGHT NOW: Shows placeholder/initializing screen
// DAY 5: Will show real live data
// ============================================

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col">

      {/* ── INITIALIZING SCREEN ── */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* Globe Icon */}
        <div className="text-8xl mb-6 animate-spin" 
             style={{ animationDuration: "8s" }}>
          🌍
        </div>

        {/* System Name */}
        <h1 className="text-4xl font-bold tracking-widest mb-2 text-white">
          DSRT{" "}
          <span className="text-blue-400">WAE</span>
        </h1>

        {/* Full Name */}
        <p className="text-xs tracking-widest text-gray-500 uppercase mb-8">
          Deep Strategic Real-Time World AI Engine
        </p>

        {/* Initializing Text */}
        <div className="border border-green-800 bg-green-950/20 
                        rounded px-8 py-4 text-center max-w-md">
          <p className="text-green-400 text-sm font-mono mb-2">
            ● SYSTEM INITIALIZING...
          </p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Building intelligence pipeline.<br />
            Connecting to global data sources.<br />
            Stand by for world monitoring activation.
          </p>
        </div>

        {/* Version */}
        <p className="text-gray-700 text-xs mt-8">
          V1.0 — BUILD PHASE
        </p>

        {/* What's coming */}
        <div className="mt-12 grid grid-cols-2 gap-3 text-xs text-gray-600 
                        max-w-sm w-full">
          {[
            { icon: "📡", text: "GDELT Source" },
            { icon: "📰", text: "RSS Feeds" },
            { icon: "🤖", text: "AI Analysis" },
            { icon: "🌡️", text: "Heat Scoring" },
            { icon: "🗄️", text: "Live Database" },
            { icon: "⚡", text: "30min Updates" },
          ].map((item) => (
            <div 
              key={item.text}
              className="flex items-center gap-2 
                         bg-gray-900/50 border border-gray-800 
                         rounded px-3 py-2"
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div className="border-t border-gray-800 px-6 py-3 
                      flex items-center justify-between text-xs text-gray-600">
        <span>DSRT WAE v1.0</span>
        <span className="flex items-center gap-2">
          <span className="live-dot"></span>
          SYSTEM BUILD IN PROGRESS
        </span>
        <span>Day 1 of 7</span>
      </div>

    </div>
  );
}