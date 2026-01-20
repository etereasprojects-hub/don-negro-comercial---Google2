import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pqrwoofkokcjnpbfkkgb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
