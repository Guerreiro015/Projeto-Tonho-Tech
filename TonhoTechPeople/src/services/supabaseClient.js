import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://avuuryawpgvunwxjfypo.supabase.co';
const fallbackKey = 'COLE_SUA_ANON_PUBLIC_KEY_AQUI';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackKey;

export const isCloudConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== 'COLE_SUA_ANON_PUBLIC_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
