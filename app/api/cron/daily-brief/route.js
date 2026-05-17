// Daily Brief — runs once per day at 7 AM
import { NextResponse } from "next/server";
import { generateDailyBrief } from "../../../../modules/global/daily-brief.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("secret") !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const brief = await generateDailyBrief();
    
    if (!brief) {
      return NextResponse.json({
        status: "success",
        message: "Brief already exists or no events",
      });
    }
    
    return NextResponse.json({
      status: "success",
      brief_id: brief.id,
      date: brief.brief_date,
      heat_index: brief.global_heat_index,
      threat_level: brief.threat_level,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
