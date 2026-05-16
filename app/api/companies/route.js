// ============================================
// API: /api/companies
// Search and list companies
// Query params:
//   ?search=reliance        - search by name/ticker/alias
//   ?sector=Technology      - filter by sector
//   ?country=India          - filter by country
//   ?limit=20              - results limit
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const sector = searchParams.get("sector");
  const country = searchParams.get("country");
  const limit = parseInt(searchParams.get("limit")) || 20;

  try {
    let query = supabase
      .from("wae_companies")
      .select("ticker, name, sector, industry, country, market_cap_usd, ceo, employees, headquarters_city, aliases")
      .eq("is_active", true);

    if (search) {
      // Search in name, ticker, OR aliases
      const searchUpper = search.toUpperCase();
      const searchLower = search.toLowerCase();
      
      query = query.or(
        `name.ilike.%${search}%,ticker.ilike.%${searchUpper}%,aliases.cs.{${search}}`
      );
    }

    if (sector) {
      query = query.eq("sector", sector);
    }

    if (country) {
      query = query.eq("country", country);
    }

    query = query
      .order("market_cap_usd", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
