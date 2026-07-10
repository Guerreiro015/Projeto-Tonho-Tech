import { supabase, isCloudConfigured } from './supabaseClient';

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
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
    await supabase.auth.signOut();
    throw new Error('Usuário ou senha inválidos.');
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

    const profile = await loadProfile(data.user.id);
    await supabase.rpc('touch_last_access');
    return profile;
  },

  async restoreSession() {
    if (!isCloudConfigured) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    try {
      return await loadProfile(session.user.id);
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return callback(null);
      try {
        callback(await loadProfile(session.user.id));
      } catch {
        callback(null);
      }
    });
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async trocarSenha(novaSenha) {
    if (!novaSenha || novaSenha.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;

    const { error: markError } = await supabase.rpc('mark_password_changed');
    if (markError) throw markError;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não foi possível atualizar a sessão.');
    return loadProfile(user.id);
  }
};
