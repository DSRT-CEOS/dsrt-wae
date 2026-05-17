import { NextResponse } from "next/server";
import supabase from "../../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { ticker } = params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "3M";
  
  const daysMap = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
  const days = daysMap[period] || 90;
  
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("wae_company_history")
      .select("date, open, high, low, close, volume")
      .eq("ticker", ticker.toUpperCase())
      .gte("date", sinceStr)
      .order("date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ticker: ticker.toUpperCase(),
      period,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
