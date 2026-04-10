import { kv } from "@vercel/kv";
import { createClient } from "@supabase/supabase-js";

const APP_STATE_KV_KEY = "mt-marketing-app-state";

/** Project-URL: sommige setups zetten alleen NEXT_PUBLIC_SUPABASE_URL (zelfde URL, niet geheim). */
const SUPABASE_URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_URL"];

const SERVICE_KEY_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"];

export function resolveSupabaseUrl() {
  for (const k of SUPABASE_URL_KEYS) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim()) return v.trim().replace(/\/$/, "");
  }
  return "";
}

export function resolveSupabaseUrlSource() {
  for (const k of SUPABASE_URL_KEYS) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim()) return k;
  }
  return null;
}

export function resolveServiceRoleKey() {
  for (const k of SERVICE_KEY_KEYS) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function resolveServiceRoleKeySource() {
  for (const k of SERVICE_KEY_KEYS) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim()) return k;
  }
  return null;
}

export function supabaseConfigured() {
  return Boolean(resolveSupabaseUrl() && resolveServiceRoleKey());
}

export function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Supabase heeft voorrang; anders Vercel KV. */
export function backendConfigured() {
  return supabaseConfigured() || kvConfigured();
}

let supabaseSingleton = null;

function getSupabase() {
  if (!supabaseConfigured()) return null;
  if (!supabaseSingleton) {
    supabaseSingleton = createClient(resolveSupabaseUrl(), resolveServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseSingleton;
}

export async function readAppState() {
  if (supabaseConfigured()) {
    const sb = getSupabase();
    const { data, error } = await sb.from("app_state").select("payload").eq("id", "default").maybeSingle();
    if (error) throw error;
    if (!data || data.payload == null) return null;
    const p = data.payload;
    if (typeof p === "object" && p !== null && Array.isArray(p.clients)) {
      return {
        clients: p.clients,
        activeId: typeof p.activeId === "string" ? p.activeId : null,
      };
    }
    return null;
  }
  if (kvConfigured()) {
    return await kv.get(APP_STATE_KV_KEY);
  }
  return null;
}

export async function writeAppState({ clients, activeId }) {
  if (supabaseConfigured()) {
    const sb = getSupabase();
    const payload = { clients, activeId };
    const { error } = await sb.from("app_state").upsert(
      {
        id: "default",
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    return;
  }
  if (kvConfigured()) {
    await kv.set(APP_STATE_KV_KEY, { clients, activeId });
    return;
  }
  throw new Error("Geen storage-backend (Supabase of KV)");
}
