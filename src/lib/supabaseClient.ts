import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables (client-side variables marked with VITE_ for Vite,
// but let's support both VITE_ prefixed and fallback standard variables just in case)
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if credentials are set up and valid
export const isSupabaseConfigured = (): boolean => {
  return typeof supabaseUrl === 'string' && 
         supabaseUrl.trim().length > 0 && 
         supabaseUrl !== 'MY_SUPABASE_URL' &&
         supabaseUrl.startsWith('https://') &&
         typeof supabaseAnonKey === 'string' && 
         supabaseAnonKey.trim().length > 0 &&
         supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY';
};

// Safely obtain a valid URL/Key structure to avoid instant crash (since createClient validates shape)
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

// Create and export the Supabase client
export const supabase = createClient(safeUrl, safeKey);
