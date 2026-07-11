import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(
  supabaseUrl?.trim() &&
  supabaseAnonKey?.trim()
);

// A sessão fica somente na aba/janela atual.
// Ao fechar a aba ou o navegador, o sessionStorage é descartado e um novo
// login será exigido na próxima abertura. Atualizar a página mantém a sessão.
const browserSessionStorage = typeof window !== 'undefined'
  ? window.sessionStorage
  : undefined;

// Remove uma eventual sessão antiga que tenha ficado gravada no localStorage
// pelas versões anteriores do sistema.
if (typeof window !== 'undefined' && supabaseUrl) {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
  } catch {
    // URL inválida será tratada pela própria configuração do cliente.
  }
}

export const supabase = isCloudConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: browserSessionStorage
      }
    })
  : null;
