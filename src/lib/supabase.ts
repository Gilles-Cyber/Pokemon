import { createClient } from '@supabase/supabase-js';

// Keep env vars first; fallback constants are for deployments where env vars were not configured.
const FALLBACK_SUPABASE_URL = 'https://ekmdsnqvwxgfczpdstxq.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbWRzbnF2d3hnZmN6cGRzdHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDE5MzQsImV4cCI6MjA4NzgxNzkzNH0.eVK_XHiYL3fYIQ3hJl_W-PtURO8T8PJ3tUG80Lp7hdo';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
