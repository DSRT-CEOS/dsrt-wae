// ============================================
// API ROUTE: /api/events
// Returns events for dashboard
// Query params:
//   ?type=latest   (default, recent events)
//   ?type=hot      (heat >= 7)
//   ?type=stats    (statistics)
//   ?type=cycle    (latest cycle info)
//   ?category=...  (filter by category)
//   ?limit=50
// ============================================

import { NextResponse } from "next/server";
import { 
  getLatestEvents, 
  getHotEvents, 
  getStats, 
  getLatestCycle,
  getCategoryBreakdown
} from "../../../database/queries.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "latest";
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit")) || 50;

  try {
    let data;

    switch (type) {
      case "hot":
        data = await getHotEvents(7, limit);
        break;
      
      case "stats":
        data = await getStats();
        break;
      
      case "cycle":
        data = await getLatestCycle();
        break;
      
      case "categories":
        data = await getCategoryBreakdown();
        break;
      
      case "latest":
      default:
        data = await getLatestEvents(limit, category);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      count: Array.isArray(data) ? data.length : 1,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
