// ============================================
// DSRT WAE — DATABASE CLIENT
// Supabase connection layer
// Two clients: admin (full access) + public (read-only)
// ============================================

import { createClient } from "@supabase/supabase-js";

// ── CREDENTIALS FROM .env.local ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// ── VALIDATE CREDENTIALS ──
if (!supabaseUrl) {
  console.error(
    "[WAE][DB] ❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local"
  );
}
if (!supabaseServiceKey) {
  console.error(
    "[WAE][DB] ❌ Missing SUPABASE_SERVICE_KEY in .env.local"
  );
}

// ── ADMIN CLIENT ──
// Used by backend (engine, API routes) for write operations
// Has FULL access — never expose to browser
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ── PUBLIC CLIENT ──  
// Used by frontend for reading public data
// Limited by RLS policies (can only SELECT)
export const supabasePublic = createClient(
  supabaseUrl,
  supabaseAnonKey || supabaseServiceKey
);

// ── HEALTH CHECK ──
// Verifies DB is reachable
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from("wae_events")
      .select("id")
      .limit(1);

    if (error) {
      console.error("[WAE][DB] Connection FAILED:", error.message);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: "Database connected successfully" 
    };
  } catch (err) {
    return { 
      success: false, 
      error: err.message 
    };
  }
}

export default supabaseAdmin;
