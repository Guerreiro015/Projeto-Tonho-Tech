import { supabase, isCloudConfigured } from './supabaseClient';

const localUsers = [
  { nome: 'Administrador', usuario: 'admin', pin: '1234', perfil: 'ADMIN', regional_nome: null },
  { nome: 'RH/DP', usuario: 'rhdp', pin: '1234', perfil: 'RHDP', regional_nome: null },
  { nome: 'Suporte Regional', usuario: 'suporte', pin: '1234', perfil: 'SUPORTE', regional_nome: 'MATRIZ' }
];

export const AuthService = {
  async listarUsuarios() {
    if (!isCloudConfigured) return localUsers;

    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,usuario,perfil,pin,regional_nome,ativo')
      .eq('ativo', true)
      .order('nome');

    if (error || !data?.length) return localUsers;
    return data;
  },

  async login(usuario, pin) {
    const users = await this.listarUsuarios();
    const found = users.find(u => u.usuario === usuario && String(u.pin) === String(pin));
    if (!found) throw new Error('Usuário ou PIN inválido.');

    if (isCloudConfigured && found.id) {
      await supabase.from('usuarios').update({ ultimo_acesso: new Date().toISOString() }).eq('id', found.id);
    }

    return found;
  }
};
