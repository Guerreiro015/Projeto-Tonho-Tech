import { supabase } from './supabaseClient';

function normalizePayload(payload) {
  const user = {
    id: payload.id || undefined,
    auth_id: payload.auth_id || undefined,
    nome: payload.nome?.trim(),
    usuario: payload.usuario?.trim().toLowerCase(),
    perfil: payload.perfil,
    senha: payload.senha || '',
    regional_nome: payload.perfil === 'SUPORTE' ? (payload.regional_nome || '') : null,
    ativo: payload.ativo ?? true,
    primeiro_acesso: payload.primeiro_acesso ?? true
  };

  if (!user.nome || !user.usuario || !user.perfil) throw new Error('Preencha nome, usuário e perfil.');
  if (!user.id && user.senha.length < 8) throw new Error('A senha inicial deve ter pelo menos 8 caracteres.');
  if (user.senha && user.senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
  if (user.perfil === 'SUPORTE' && !user.regional_nome) throw new Error('Selecione a regional do usuário Suporte.');
  return user;
}

async function invoke(action, payload) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload }
  });
  if (error) throw new Error(error.message || 'Falha ao executar operação administrativa.');
  if (data?.error) throw new Error(data.error);
  return data;
}

export const UserService = {
  async listar() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,auth_id,nome,usuario,perfil,regional_id,regional_nome,ativo,primeiro_acesso,ultimo_acesso,criado_em')
      .order('nome');
    if (error) throw error;
    return data || [];
  },

  async salvar(payload) {
    const user = normalizePayload(payload);
    return invoke(user.id ? 'update' : 'create', { user });
  },

  async alterarStatus(user, ativo) {
    return invoke('status', { userId: user.id, authId: user.auth_id, ativo });
  },

  async redefinirSenha(user, senha) {
    if (!senha || senha.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
    return invoke('password', { userId: user.id, authId: user.auth_id, senha });
  }
};
