// ============================================
// API ROUTE: /api/cron
// Triggered by external cron every 30 min
// Runs the full engine cycle
// ============================================

import { NextResponse } from "next/server";
import { runCycle } from "../../../core/engine.js";

export const maxDuration = 60; // Vercel free: 60s max
export const dynamic = "force-dynamic";

export async function GET(request) {
  // ── SECURITY CHECK ──
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret) {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const headerSecret = request.headers.get("authorization");
    
    const validHeader = headerSecret === `Bearer ${cronSecret}`;
    const validQuery = querySecret === cronSecret;
    
    if (!validHeader && !validQuery) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }
  }

  try {
    const result = await runCycle();
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[CRON] Cycle failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
