import { createClient } from "@supabase/supabase-js";

// Uses process.env in Next.js. You need to configure these in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-or-service-role-key";

// We create a global instance to reuse it during development, similar to what we did previously.
const supabaseClientSingleton = () => {
  return createClient(supabaseUrl, supabaseKey);
};

declare global {
  var supabaseGlobal: undefined | ReturnType<typeof supabaseClientSingleton>;
}

export const supabase = globalThis.supabaseGlobal ?? supabaseClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.supabaseGlobal = supabase;
