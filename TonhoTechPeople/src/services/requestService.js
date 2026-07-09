import { supabase, isCloudConfigured } from './supabaseClient';

function protocolo() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`;
}

export const RequestService = {
  async criar({ colaborador, tipo, dados, usuario }) {
    const req = {
      protocolo: protocolo(),
      colaborador_id: colaborador.id || null,
      colaborador_nome: colaborador.nome,
      colaborador_matricula: colaborador.matricula,
      tipo,
      status: 'GERADA',
      usuario: usuario?.usuario,
      perfil: usuario?.perfil,
      regional_usuario: usuario?.regional_nome || 'MATRIZ',
      regional_colaborador: colaborador.regional || colaborador.folha || 'MATRIZ',
      dados
    };

    if (isCloudConfigured) {
      const { data, error } = await supabase.from('solicitacoes').insert(req).select().single();
      if (error) throw error;
      return data;
    }

    const local = JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
    local.unshift({ ...req, id: crypto.randomUUID(), criado_em: new Date().toISOString() });
    localStorage.setItem('tt_people_solicitacoes', JSON.stringify(local));
    return local[0];
  },

  async listarTodas(limite = 500) {
    if (isCloudConfigured) {
      let query = supabase
        .from('solicitacoes')
        .select('*')
        .order('criado_em', { ascending: false });
      if (usuario?.perfil === 'SUPORTE') query = query.eq('usuario', usuario.usuario);
      const { data, error } = await query.limit(limite);
      if (!error) return data || [];
    }
    const local = JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
    return (usuario?.perfil === 'SUPORTE' ? local.filter(item => item.usuario === usuario.usuario) : local).slice(0, limite);
  },

  async minhas(usuario) {
    if (isCloudConfigured) {
      let query = supabase.from('solicitacoes').select('*').order('criado_em', { ascending: false }).limit(50);
      if (usuario?.perfil === 'SUPORTE') query = query.eq('usuario', usuario.usuario);
      const { data, error } = await query;
      if (!error) return data || [];
    }
    return JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
  },

  async contar(usuario) {
    if (isCloudConfigured) {
      let query = supabase.from('solicitacoes').select('*', { count: 'exact', head: true });
      if (usuario?.perfil === 'SUPORTE') query = query.eq('usuario', usuario.usuario);
      const { count, error } = await query;
      if (!error) return count || 0;
    }
    const local = JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
    return usuario?.perfil === 'SUPORTE' ? local.filter(item => item.usuario === usuario.usuario).length : local.length;
  },

  async hoje(usuario) {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    if (isCloudConfigured) {
      let query = supabase
        .from('solicitacoes')
        .select('*', { count: 'exact', head: true })
        .gte('criado_em', inicio.toISOString());
      if (usuario?.perfil === 'SUPORTE') query = query.eq('usuario', usuario.usuario);
      const { count, error } = await query;
      if (!error) return count || 0;
    }
    const local = JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
    return local.filter(item => new Date(item.criado_em || Date.now()) >= inicio && (usuario?.perfil === 'SUPORTE' ? item.usuario === usuario.usuario : true)).length;
  },

  async ultimas(limite = 6, usuario) {
    if (isCloudConfigured) {
      let query = supabase
        .from('solicitacoes')
        .select('*')
        .order('criado_em', { ascending: false });
      if (usuario?.perfil === 'SUPORTE') query = query.eq('usuario', usuario.usuario);
      const { data, error } = await query.limit(limite);
      if (!error) return data || [];
    }
    const local = JSON.parse(localStorage.getItem('tt_people_solicitacoes') || '[]');
    return (usuario?.perfil === 'SUPORTE' ? local.filter(item => item.usuario === usuario.usuario) : local).slice(0, limite);
  }
};
