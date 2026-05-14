// ============================================
// DSRT WAE — Header Component
// Shows: Logo, System Status, Last Update Time
// Built fully: Day 2
// ============================================

export default function Header({ lastUpdate, status }) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/80 
                       backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* PLACEHOLDER — Full build on Day 2 */}
        <p className="text-green-400 text-xs">
          HEADER MODULE — LOADING DAY 2
        </p>
      </div>
    </header>
  );
}