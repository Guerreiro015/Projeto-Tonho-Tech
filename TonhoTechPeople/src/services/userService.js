import { supabase, isCloudConfigured } from './supabaseClient';

const localKey = 'tt_people_users_cache';

const defaultUsers = [
  { nome: 'Administrador', usuario: 'admin', pin: '1234', perfil: 'ADMIN', regional_nome: null, ativo: true },
  { nome: 'RH/DP', usuario: 'rhdp', pin: '1234', perfil: 'RHDP', regional_nome: null, ativo: true },
  { nome: 'Suporte Regional', usuario: 'suporte', pin: '1234', perfil: 'SUPORTE', regional_nome: 'MATRIZ', ativo: true }
];

function readLocal() {
  const saved = JSON.parse(localStorage.getItem(localKey) || 'null');
  if (Array.isArray(saved) && saved.length) return saved;
  localStorage.setItem(localKey, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function writeLocal(users) {
  localStorage.setItem(localKey, JSON.stringify(users));
}

export const UserService = {
  async listar() {
    if (isCloudConfigured) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id,nome,usuario,perfil,pin,regional_nome,ativo,ultimo_acesso,criado_em')
        .order('nome');
      if (!error) return data || [];
    }
    return readLocal();
  },

  async salvar(payload) {
    const user = {
      nome: payload.nome?.trim(),
      usuario: payload.usuario?.trim().toLowerCase(),
      perfil: payload.perfil,
      pin: payload.pin || '1234',
      regional_nome: payload.perfil === 'SUPORTE' ? (payload.regional_nome || 'MATRIZ') : null,
      ativo: payload.ativo ?? true
    };

    if (!user.nome || !user.usuario || !user.perfil) {
      throw new Error('Preencha nome, usuário e perfil.');
    }

    if (isCloudConfigured) {
      const { data, error } = await supabase
        .from('usuarios')
        .upsert(user, { onConflict: 'usuario' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const users = readLocal();
    const index = users.findIndex(u => u.usuario === user.usuario);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    writeLocal(users);
    return user;
  },

  async alterarStatus(usuario, ativo) {
    if (isCloudConfigured) {
      const { error } = await supabase.from('usuarios').update({ ativo }).eq('usuario', usuario);
      if (error) throw error;
      return true;
    }
    const users = readLocal().map(u => u.usuario === usuario ? { ...u, ativo } : u);
    writeLocal(users);
    return true;
  }
};
