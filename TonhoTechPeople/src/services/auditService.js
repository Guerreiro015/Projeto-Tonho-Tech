import { supabase, isCloudConfigured } from './supabaseClient';

export const AuditService = {
  async registrar(acao, entidade = null, entidadeId = null, detalhes = {}) {
    if (!isCloudConfigured) return;
    const { error } = await supabase.rpc('log_audit_event', {
      p_acao: acao,
      p_entidade: entidade,
      p_entidade_id: entidadeId ? String(entidadeId) : null,
      p_detalhes: detalhes || {}
    });
    // Auditoria nunca deve impedir a operação principal.
    if (error) console.warn('Não foi possível registrar auditoria:', error.message);
  },

  async ultimos(limite = 12) {
    if (!isCloudConfigured) return [];
    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limite);
    if (error) return [];
    return data || [];
  }
};
