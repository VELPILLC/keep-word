import { createClient } from "@supabase/supabase-js";

// Fallback to a syntactically valid placeholder so createClient doesn't throw
// during SSR prerendering when env vars haven't been set yet.
// Real values must be supplied via Vercel (or .env.local) before the app works.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(url, key);
