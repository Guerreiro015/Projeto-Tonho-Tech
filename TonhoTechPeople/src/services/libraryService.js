import { supabase, isCloudConfigured } from './supabaseClient';
import { AuditService } from './auditService';

export const LibraryService = {
  async listarCategorias() {
    if (!isCloudConfigured) return [];
    const { data, error } = await supabase
      .from('biblioteca_categorias')
      .select('*')
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });
    if (error) throw new Error(error.message || 'Não foi possível carregar as categorias.');
    return data || [];
  },

  async listarArtigos({ incluirRascunhos = false } = {}) {
    if (!isCloudConfigured) return [];
    let query = supabase
      .from('biblioteca_artigos')
      .select('*, categoria:biblioteca_categorias(id,nome,icone,cor)')
      .order('atualizado_em', { ascending: false });
    if (!incluirRascunhos) query = query.eq('status', 'PUBLICADO');
    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Não foi possível carregar a Biblioteca RH.');
    return data || [];
  },

  async salvarArtigo(artigo) {
    if (!isCloudConfigured) throw new Error('Supabase não configurado.');
    const payload = {
      titulo: artigo.titulo.trim(),
      resumo: artigo.resumo?.trim() || null,
      conteudo: artigo.conteudo?.trim() || '',
      categoria_id: artigo.categoria_id || null,
      status: artigo.status || 'RASCUNHO',
      atualizado_em: new Date().toISOString(),
      publicado_em: artigo.status === 'PUBLICADO' ? (artigo.publicado_em || new Date().toISOString()) : null
    };
    let result;
    if (artigo.id) {
      result = await supabase.from('biblioteca_artigos').update(payload).eq('id', artigo.id).select().single();
    } else {
      const { data: authData } = await supabase.auth.getUser();
      result = await supabase.from('biblioteca_artigos').insert({ ...payload, autor_auth_id: authData?.user?.id || null }).select().single();
    }
    if (result.error) throw new Error(result.error.message || 'Não foi possível salvar o artigo.');
    await AuditService.registrar(artigo.id ? 'BIBLIOTECA_ARTIGO_EDITADO' : 'BIBLIOTECA_ARTIGO_CRIADO', 'biblioteca_artigos', result.data.id, {
      titulo: result.data.titulo,
      status: result.data.status
    });
    return result.data;
  },

  async arquivarArtigo(artigo) {
    const { error } = await supabase
      .from('biblioteca_artigos')
      .update({ status: 'ARQUIVADO', atualizado_em: new Date().toISOString() })
      .eq('id', artigo.id);
    if (error) throw new Error(error.message || 'Não foi possível arquivar o artigo.');
    await AuditService.registrar('BIBLIOTECA_ARTIGO_ARQUIVADO', 'biblioteca_artigos', artigo.id, { titulo: artigo.titulo });
  }
};
