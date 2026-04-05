import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://tsddhnkkwyqisqlevbcq.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZGRobmtrd3lxaXNxbGV2YmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjg2MDAsImV4cCI6MjA4OTYwNDYwMH0.3U77lBR9prB0OEQGBaBRmb2kfMth-2rxjjh4bqfAKMw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "thrive-auth-token",
  },
  db: {
    schema: "public",
  },
});
