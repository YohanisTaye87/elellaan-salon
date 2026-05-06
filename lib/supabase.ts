import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getBrowserClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Copy .env.example to .env.local and fill them in."
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function getServerClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Server Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
