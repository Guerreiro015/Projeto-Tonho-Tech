import { supabase, isCloudConfigured } from './supabaseClient';

export const RegionalService = {
  async listar() {
    if (isCloudConfigured) {
      const { data, error } = await supabase.from('regionais').select('*').order('nome');
      if (!error) return data || [];
    }
    const cache = JSON.parse(localStorage.getItem('tt_people_colaboradores_cache') || '[]');
    const nomes = [...new Set(cache.map(c => c.regional || c.folha).filter(Boolean))].sort();
    return nomes.map((nome, index) => ({ id: String(index), nome, ativo: true }));
  },

  async contar() {
    const regionais = await this.listar();
    return regionais.length;
  }
};
