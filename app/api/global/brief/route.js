import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD, defaults to today
  
  try {
    let query = supabase
      .from("dsrt_daily_briefs")
      .select("*")
      .order("brief_date", { ascending: false });
    
    if (date) {
      query = query.eq("brief_date", date);
    } else {
      query = query.limit(1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const brief = date ? data?.[0] : data?.[0];
    
    if (!brief) {
      return NextResponse.json(
        { success: false, error: "No brief available" },
        { status: 404 }
      );
    }
    
    // Get past 7 days for archive
    const { data: archive } = await supabase
      .from("dsrt_daily_briefs")
      .select("brief_date, global_heat_index, threat_level")
      .order("brief_date", { ascending: false })
      .limit(7);
    
    return NextResponse.json({
      success: true,
      data: { brief, archive: archive || [] },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
