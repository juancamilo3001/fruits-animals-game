import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Normalizes the Supabase URL to guarantee it points to the bare project root origin
 * (e.g. "https://xxxx.supabase.co").
 * Strips accidental "/rest/v1", "/rest/v1/", trailing slashes, or whitespace that
 * cause Supabase's API gateway to return "Invalid path specified in request URL".
 */
export const normalizeSupabaseUrl = (url: string): string => {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  // Strip /rest/v1 or /rest/v1/ if user pasted the REST URL instead of Project URL
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned;
  }
};

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = rawSupabaseAnonKey;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project') &&
    (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
  );
};

// Create client with fallback dummy parameters to avoid immediate fatal crashes if unset
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  }
);
