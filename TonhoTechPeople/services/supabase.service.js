/*
====================================================
TONHO TECH
Software & Business Solutions
Produto: TONHO TECH People
Arquivo: services/supabase.service.js
Versão: 3.0
====================================================
*/

const SUPABASE_URL = 'https://avuuryawpgvunwxjfypo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dXVyeWF3cGd2dW53eGpmeXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODM0MjUsImV4cCI6MjA5OTA1OTQyNX0.ciC1TECh9h0PW8RchJKRpPoabXMHYqgnRFO1OvrDwSk';

function getClient() {
  if (!window.supabase?.createClient) {
    console.warn('Biblioteca Supabase não carregada. O sistema seguirá em modo local.');
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function normalizarRegional(valor) {
  return String(valor || '').trim() || 'Não informada';
}

function dividirEmLotes(lista, tamanho = 500) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    lotes.push(lista.slice(i, i + tamanho));
  }
  return lotes;
}

function perfilParaBanco(perfil) {
  if (perfil === 'Admin') return 'ADMIN';
  if (perfil === 'RH/DP') return 'RHDP';
  if (perfil === 'Suporte Regional') return 'SUPORTE';
  return String(perfil || '').toUpperCase();
}

function perfilParaTela(perfil) {
  if (perfil === 'ADMIN') return 'Admin';
  if (perfil === 'RHDP') return 'RH/DP';
  if (perfil === 'SUPORTE') return 'Suporte Regional';
  return perfil || 'RH/DP';
}

export const SupabaseService = {
  client: getClient(),
  online: false,
  ultimaMensagem: 'Não testado',

  disponivel() {
    return !!this.client;
  },

  async testarConexao() {
    if (!this.client) {
      this.online = false;
      this.ultimaMensagem = 'Cliente Supabase indisponível';
      return { ok: false, mensagem: this.ultimaMensagem };
    }

    try {
      const { error } = await this.client
        .from('regionais')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      this.online = true;
      this.ultimaMensagem = 'Supabase conectado';
      return { ok: true, mensagem: this.ultimaMensagem };
    } catch (erro) {
      this.online = false;
      this.ultimaMensagem = erro.message || 'Falha ao conectar no Supabase';
      console.error('Erro Supabase:', erro);
      return { ok: false, mensagem: this.ultimaMensagem };
    }
  },

  async sincronizarRegionais(colaboradores = []) {
    if (!this.client) return { ok: false, total: 0 };

    const nomes = [...new Set(
      colaboradores
        .map(c => normalizarRegional(c.folha || c.regional))
        .filter(Boolean)
    )];

    if (!nomes.length) return { ok: true, total: 0 };

    const registros = nomes.map(nome => ({ nome, ativo: true }));
    const { error } = await this.client
      .from('regionais')
      .upsert(registros, { onConflict: 'nome' });

    if (error) throw error;
    return { ok: true, total: registros.length };
  },

  prepararColaborador(c) {
    return {
      matricula: String(c.matricula || '').trim(),
      nome: String(c.nome || '').trim(),
      cpf: String(c.cpf || '').trim(),
      cargo: String(c.cargo || '').trim(),
      regional: normalizarRegional(c.folha || c.regional),
      folha: normalizarRegional(c.folha || c.regional),
      horario: String(c.horario || '').trim(),
      situacao: String(c.situacao || '').trim(),
      admissao: String(c.admissao || '').trim(),
      atualizado_em: new Date().toISOString()
    };
  },

  async sincronizarColaboradores(colaboradores = []) {
    if (!this.client) {
      return { ok: false, total: 0, mensagem: 'Supabase indisponível' };
    }

    const validos = colaboradores
      .map(c => this.prepararColaborador(c))
      .filter(c => c.matricula && c.nome);

    if (!validos.length) {
      return { ok: false, total: 0, mensagem: 'Nenhum colaborador válido para sincronizar' };
    }

    await this.sincronizarRegionais(colaboradores);

    let total = 0;
    for (const lote of dividirEmLotes(validos, 500)) {
      const { error } = await this.client
        .from('colaboradores')
        .upsert(lote, { onConflict: 'matricula' });

      if (error) throw error;
      total += lote.length;
    }

    return {
      ok: true,
      total,
      mensagem: `${total} colaboradores sincronizados com a nuvem`
    };
  },

  async salvarSolicitacao(item = {}, dados = {}) {
    if (!this.client) return { ok: false, mensagem: 'Supabase indisponível' };

    try {
      let colaboradorId = null;

      if (item.matricula) {
        const { data: colaborador } = await this.client
          .from('colaboradores')
          .select('id')
          .eq('matricula', String(item.matricula))
          .maybeSingle();

        colaboradorId = colaborador?.id || null;
      }

      const registro = {
        protocolo: item.protocolo,
        colaborador_id: colaboradorId,
        colaborador_nome: item.colaborador || '',
        colaborador_matricula: String(item.matricula || ''),
        tipo: item.modulo || item.tipo || 'Solicitação',
        status: item.status || 'GERADA',
        usuario: item.usuario || '',
        perfil: item.perfil || '',
        regional_usuario: item.regionalUsuario || '',
        regional_colaborador: item.regionalColaborador || '',
        dados: {
          ...dados,
          moduloId: item.moduloId || '',
          cpf: item.cpf || '',
          data: item.data || '',
          hora: item.hora || ''
        }
      };

      const { error } = await this.client
        .from('solicitacoes')
        .insert(registro);

      if (error) throw error;
      return { ok: true, mensagem: 'Solicitação salva na nuvem' };
    } catch (erro) {
      console.error('Erro ao salvar solicitação na nuvem:', erro);
      return { ok: false, mensagem: erro.message || 'Erro ao salvar solicitação' };
    }
  },


  async sincronizarUsuariosLocais(usuarios = []) {
    if (!this.client) return { ok: false, total: 0, mensagem: 'Supabase indisponível' };

    try {
      const registros = usuarios
        .filter(u => u?.id && u?.nome)
        .map(u => ({
          nome: String(u.nome || '').trim(),
          usuario: String(u.id || '').trim(),
          perfil: perfilParaBanco(u.perfil),
          regional_nome: u.regional || '',
          pin: String(u.pin || '1234'),
          ativo: u.ativo !== false,
          atualizado_em: new Date().toISOString()
        }));

      if (!registros.length) return { ok: true, total: 0, mensagem: 'Nenhum usuário para sincronizar' };

      const { error } = await this.client
        .from('usuarios')
        .upsert(registros, { onConflict: 'usuario' });

      if (error) throw error;
      return { ok: true, total: registros.length, mensagem: `${registros.length} usuários sincronizados` };
    } catch (erro) {
      console.warn('Não foi possível sincronizar usuários na nuvem:', erro);
      return { ok: false, total: 0, mensagem: erro.message || 'Falha ao sincronizar usuários' };
    }
  },

  async buscarUsuarioLogin(usuarioId, pin) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('usuarios')
        .select('nome, usuario, perfil, regional_nome, ativo, pin')
        .eq('usuario', String(usuarioId || '').trim())
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      if (String(data.pin || '') !== String(pin || '')) return false;

      return {
        id: data.usuario,
        nome: data.nome,
        perfil: perfilParaTela(data.perfil),
        regional: data.regional_nome || '',
        entrada: new Date().toISOString(),
        origem: 'Supabase'
      };
    } catch (erro) {
      console.warn('Login cloud indisponível. Usando fallback local:', erro);
      return null;
    }
  },

  async listarRegionais() {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('regionais')
        .select('nome, ativo')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (erro) {
      console.warn('Erro ao listar regionais:', erro);
      return [];
    }
  },

  async listarSolicitacoes(limite = 100) {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('solicitacoes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('Erro ao listar solicitações:', error);
      return [];
    }

    return data || [];
  }
};
