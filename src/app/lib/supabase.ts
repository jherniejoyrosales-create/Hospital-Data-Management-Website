import { createClient } from '@supabase/supabase-js';

// Demo Supabase credentials for immediate testing (replace with your own)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo_key_replace_with_real';

export const getStorageMode = () => {
  // Check localStorage override first (for runtime toggle)
  try {
    if (typeof localStorage !== 'undefined') {
      const override = localStorage.getItem('appStorageMode');
      if (['local', 'supabase', 'indexeddb', 'api'].includes(override)) {
        return override;
      }
    }
  } catch (e) {
    // localStorage not available
  }

  // Fall back to environment variable
  const envMode = (import.meta.env.VITE_APP_STORAGE || 'indexeddb').toLowerCase();
  return ['local', 'supabase', 'indexeddb', 'api'].includes(envMode) ? envMode : 'indexeddb';
};

export const isLocalStorageMode = () => getStorageMode() === 'local';
export const isIndexedDBMode = () => getStorageMode() === 'indexeddb';

export const isSupabaseConfigured = () => {
  const mode = getStorageMode();
  return mode === 'supabase' && !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
