
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pjydwqblhhmdsybpzbzx.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeWR3cWJsaGhtZHN5YnB6Ynp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMzM1MzksImV4cCI6MjA4NDYwOTUzOX0.bMsslQ4hAO78wDitVe07jcfHmbAUGU00bVYLU-wMFhI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
