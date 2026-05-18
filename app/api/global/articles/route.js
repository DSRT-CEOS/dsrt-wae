// ============================================
// /api/global/articles
// Public-facing article API for DSRT Global
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 20;
  const offset = parseInt(searchParams.get("offset")) || 0;
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const type = searchParams.get("type"); // analysis, breaking, daily_brief
  const slug = searchParams.get("slug");
  
  try {
    // SINGLE ARTICLE BY SLUG
    if (slug) {
      const { data: article, error } = await supabase
        .from("dsrt_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      
      if (error || !article) {
        return NextResponse.json(
          { success: false, error: "Article not found" },
          { status: 404 }
        );
      }
      
      // Increment view count (fire and forget)
      supabase
        .from("dsrt_articles")
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq("id", article.id)
        .then();
      
      // Get related articles (same category)
      const { data: related } = await supabase
        .from("dsrt_articles")
        .select("slug, title, summary_short, category, region, reading_time_minutes, published_at")
        .eq("status", "published")
        .eq("category", article.category)
        .neq("id", article.id)
        .order("published_at", { ascending: false })
        .limit(4);
      
      return NextResponse.json({
        success: true,
        data: { article, related: related || [] },
      });
    }
    
    // LIST ARTICLES
    let query = supabase
      .from("dsrt_articles")
      .select("slug, title, subtitle, summary_short, category, region, countries, tags, agent_persona, reading_time_minutes, view_count, published_at, article_type", { count: "exact" })
      .eq("status", "published");
    
    if (category) query = query.eq("category", category);
    if (region) query = query.eq("region", region);
    if (type) query = query.eq("article_type", type);
    
    query = query
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: articles, count, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: {
        articles: articles || [],
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
