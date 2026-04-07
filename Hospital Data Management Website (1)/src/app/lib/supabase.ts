import { createClient } from '@supabase/supabase-js';

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE_MODE_KEY = 'appStorageMode';
const LOCAL_SUPABASE_URL_KEY = 'VITE_SUPABASE_URL';
const LOCAL_SUPABASE_ANON_KEY = 'VITE_SUPABASE_ANON_KEY';

export type StorageMode = 'local' | 'supabase';

const getStoredSupabaseValue = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
};

const getStoredStorageMode = (): StorageMode | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedMode = localStorage.getItem(STORAGE_MODE_KEY);
  return storedMode === 'local' || storedMode === 'supabase' ? storedMode : null;
};

export const getSupabaseConfig = () => {
  const runtimeUrl = getStoredSupabaseValue(LOCAL_SUPABASE_URL_KEY);
  const runtimeKey = getStoredSupabaseValue(LOCAL_SUPABASE_ANON_KEY);

  return {
    supabaseUrl: runtimeUrl || envSupabaseUrl,
    supabaseAnonKey: runtimeKey || envSupabaseAnonKey,
  };
};

export const getStorageMode = (): StorageMode => {
  const config = getSupabaseConfig();

  // If Supabase is configured, always default to supabase mode
  // Only use local mode if explicitly set AND Supabase is not configured
  if (config.supabaseUrl && config.supabaseAnonKey) {
    return 'supabase';
  }

  // Otherwise, use stored mode or default to local
  const storedMode = getStoredStorageMode();
  return storedMode || 'local';
};

export const setStorageMode = (mode: StorageMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  }

  initializeSupabaseClient();
  return mode;
};

export const isLocalStorageMode = () => getStorageMode() === 'local';
export const isSupabaseMode = () => getStorageMode() === 'supabase';
export const isSupabaseConfigured = () => {
  const config = getSupabaseConfig();
  return !!(config.supabaseUrl && config.supabaseAnonKey);
};

let supabase = null as ReturnType<typeof createClient> | null;

const initializeSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    supabase = null;
    return;
  }

  supabase = createClient(envSupabaseUrl, envSupabaseAnonKey);
};

initializeSupabaseClient();

export const configureSupabase = (supabaseUrl: string, supabaseAnonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_SUPABASE_URL_KEY, supabaseUrl);
    localStorage.setItem(LOCAL_SUPABASE_ANON_KEY, supabaseAnonKey);
  }
  initializeSupabaseClient();
  return supabase;
};

export const resetSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_SUPABASE_URL_KEY);
    localStorage.removeItem(LOCAL_SUPABASE_ANON_KEY);
  }
  initializeSupabaseClient();
  return supabase;
};

export { supabase };
