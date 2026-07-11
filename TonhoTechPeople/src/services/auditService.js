import { supabase, isCloudConfigured } from './supabaseClient';

function endOfDay(date) {
  return date ? `${date}T23:59:59.999Z` : null;
}

function csvCell(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export const AuditService = {
  async registrar(acao, entidade = null, entidadeId = null, detalhes = {}) {
    if (!isCloudConfigured) return;
    const { error } = await supabase.rpc('log_audit_event', {
      p_acao: acao,
      p_entidade: entidade,
      p_entidade_id: entidadeId ? String(entidadeId) : null,
      p_detalhes: detalhes || {}
    });
    if (error) console.warn('Não foi possível registrar auditoria:', error.message);
  },

  async listar(filters = {}, limite = 1000) {
    if (!isCloudConfigured) return [];
    let query = supabase.from('auditoria').select('*').order('criado_em', { ascending: false }).limit(limite);
    if (filters.from) query = query.gte('criado_em', `${filters.from}T00:00:00.000Z`);
    if (filters.to) query = query.lte('criado_em', endOfDay(filters.to));
    if (filters.action) query = query.eq('acao', filters.action);
    if (filters.profile) query = query.eq('ator_perfil', filters.profile);
    if (filters.user) query = query.or(`ator_nome.ilike.%${filters.user}%,ator_usuario.ilike.%${filters.user}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Erro ao consultar auditoria.');
    const regional = String(filters.regional || '').trim().toLowerCase();
    return regional ? (data || []).filter(item => JSON.stringify(item.detalhes || {}).toLowerCase().includes(regional)) : (data || []);
  },

  async ultimos(limite = 12) {
    return this.listar({}, limite);
  },

  async exportarCsv(events, filename = 'auditoria.csv') {
    const headers = ['Data e hora', 'Nome', 'Usuário', 'Perfil', 'Ação', 'Entidade', 'ID da entidade', 'Detalhes'];
    const lines = [headers.map(csvCell).join(';'), ...(events || []).map(item => [
      item.criado_em, item.ator_nome, item.ator_usuario, item.ator_perfil,
      item.acao, item.entidade, item.entidade_id, item.detalhes
    ].map(csvCell).join(';'))];
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }
};
