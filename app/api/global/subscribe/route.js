import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, source } = body;
    
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email required" },
        { status: 400 }
      );
    }
    
    const cleanEmail = email.toLowerCase().trim();
    
    // Check if already subscribed
    const { data: existing } = await supabase
      .from("dsrt_subscribers")
      .select("id, confirmed")
      .eq("email", cleanEmail)
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already subscribed",
        data: { already_subscribed: true },
      });
    }
    
    // Add new subscriber
    const { data, error } = await supabase
      .from("dsrt_subscribers")
      .insert({
        email: cleanEmail,
        signup_source: source || "homepage",
        confirmed: true,  // Skip email confirmation for V0.1
        confirmed_at: new Date().toISOString(),
        daily_brief: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to The DSRT Brief",
      data: { subscriber_id: data.id },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
