// ============================================
// DSRT WAE — Event Card Component  
// Shows: Individual world event with
//        heat score, category, region, source
// Built fully: Day 6
// ============================================

export default function EventCard({ event }) {
  return (
    <div className="border-l-4 border-gray-600 p-4 mb-3 
                    bg-gray-900 rounded-r-lg">
      {/* PLACEHOLDER — Full build on Day 6 */}
      <p className="text-gray-400 text-sm">
        {event?.title || "Event card loading..."}
      </p>
    </div>
  );
}