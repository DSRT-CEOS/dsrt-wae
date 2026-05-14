// ============================================
// API ROUTE: /api/health
// System status check
// ============================================

import { NextResponse } from "next/server";
import { getStats, getLatestCycle } from "../../../database/queries.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getStats();
    const latestCycle = await getLatestCycle();

    const lastCycleAge = latestCycle
      ? (Date.now() - new Date(latestCycle.started_at).getTime()) / (1000 * 60)
      : Infinity;

    const systemStatus = 
      lastCycleAge < 60 ? "operational" : 
      lastCycleAge < 120 ? "degraded" : 
      "no_data";

    return NextResponse.json({
      system: "DSRT-WAE",
      version: "1.0.0",
      status: systemStatus,
      uptime: latestCycle 
        ? `Last cycle: ${Math.round(lastCycleAge)} minutes ago`
        : "No cycles yet",
      stats,
      latestCycle: latestCycle ? {
        id: latestCycle.id,
        status: latestCycle.status,
        eventsProcessed: latestCycle.events_processed,
        globalHeat: latestCycle.global_heat_score,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        system: "DSRT-WAE", 
        status: "error", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
