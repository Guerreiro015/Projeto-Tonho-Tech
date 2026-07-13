import { supabase, isCloudConfigured } from './supabaseClient';
import { AuditService } from './auditService';

const SESSION_TIMEOUT_MS = 8000;

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function withTimeout(promise, milliseconds = SESSION_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tempo limite da sessão excedido.')), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function clearLocalSession() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Mesmo se a API não responder, remove a sessão inválida armazenada no navegador.
    try {
      const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0];
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
    } catch {
      // Não há mais nada a limpar.
    }
  }
}

async function resolveLoginEmail(username) {
  const { data, error } = await supabase.rpc('resolve_login_email', {
    p_username: normalizeUsername(username)
  });

  if (error || !data) throw new Error('Usuário ou senha inválidos.');
  return data;
}

async function loadProfile(authUserId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,auth_id,nome,usuario,perfil,regional_id,regional_nome,ativo,primeiro_acesso,ultimo_acesso,criado_em')
    .eq('auth_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.ativo === false) {
    throw new Error('Sessão sem perfil ativo.');
  }
  return data;
}

export const AuthService = {
  async login(username, password) {
    if (!isCloudConfigured) throw new Error('Supabase não configurado.');
    const usuario = normalizeUsername(username);
    if (!usuario || !password) throw new Error('Informe usuário e senha.');

    const email = await resolveLoginEmail(usuario);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) throw new Error('Usuário ou senha inválidos.');

    try {
      const profile = await loadProfile(data.user.id);
      await supabase.rpc('touch_last_access');
      await AuditService.registrar('LOGIN', 'usuarios', profile.id, {
        perfil: profile.perfil,
        regional: profile.regional_nome
      });
      return profile;
    } catch (error) {
      await clearLocalSession();
      throw error;
    }
  },

  async restoreSession() {
    if (!isCloudConfigured) return null;

    try {
      // getUser valida o token no servidor; getSession sozinho pode devolver token antigo do navegador.
      const { data, error } = await withTimeout(supabase.auth.getUser());
      if (error || !data?.user) {
        await clearLocalSession();
        return null;
      }

      return await withTimeout(loadProfile(data.user.id));
    } catch {
      await clearLocalSession();
      return null;
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }

      // Não faça consultas Supabase dentro do callback síncrono de Auth.
      // O adiamento evita lock/deadlock da sessão no navegador.
      setTimeout(async () => {
        try {
          callback(await withTimeout(loadProfile(session.user.id)));
        } catch {
          await clearLocalSession();
          callback(null);
        }
      }, 0);
    });
  },

  async logout() {
    await clearLocalSession();
  },

  async trocarSenha(novaSenha) {
    if (!novaSenha || novaSenha.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;

    const { error: markError } = await supabase.rpc('mark_password_changed');
    if (markError) throw markError;

    await AuditService.registrar('TROCA_SENHA', 'usuarios');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não foi possível atualizar a sessão.');
    return loadProfile(user.id);
  }
};


