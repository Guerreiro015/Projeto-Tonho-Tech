import { supabase, isCloudConfigured } from './supabaseClient';
import * as XLSX from 'xlsx';

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildMap(header) {
  const map = {};
  header.forEach((cell, index) => {
    const key = normalize(cell);
    if (key) map[key] = index;
  });
  return map;
}

function value(row, map, names) {
  for (const name of names) {
    const idx = map[normalize(name)];
    if (idx !== undefined) return row[idx] ?? '';
  }
  return '';
}

function formatDate(v) {
  if (!v) return '';
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return String(v);
    return `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`;
  }
  return String(v);
}

export const PeopleService = {
  async importarExcel(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames.includes('QUADRO') ? 'QUADRO' : workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: true });

    let headerIndex = rows.findIndex(row => {
      const n = row.map(normalize);
      return (n.includes('nome completo') || n.includes('nome')) &&
             (n.includes('id contratado') || n.includes('matricula'));
    });

    if (headerIndex < 0) throw new Error('Não encontrei cabeçalho com Nome e Matrícula.');

    const map = buildMap(rows[headerIndex]);
    const colaboradores = rows.slice(headerIndex + 1).map(row => {
      const nome = value(row, map, ['Nome Completo', 'Nome', 'Colaborador']);
      if (!nome) return null;
      const folha = value(row, map, ['Folha']);
      return {
        matricula: String(value(row, map, ['Id Contratado', 'Matrícula', 'Matricula', 'Registro'])),
        nome: String(nome),
        cpf: String(value(row, map, ['Cadastro de Pessoa Física', 'CPF'])),
        cargo: String(value(row, map, ['Cargo', 'Função', 'Funcao'])),
        regional: String(folha || 'MATRIZ'),
        folha: String(folha || 'MATRIZ'),
        horario: String(value(row, map, ['Horário', 'Horario', 'Jornada'])),
        situacao: String(value(row, map, ['Situação', 'Situacao', 'Status'])),
        admissao: formatDate(value(row, map, ['Data da Admissão', 'Data de Admissão', 'Admissão', 'Admissao'])),
        atualizado_em: new Date().toISOString()
      };
    }).filter(Boolean);

    const regionais = [...new Set(colaboradores.map(c => c.regional).filter(Boolean))];

    let resultadoServidor = null;

    if (isCloudConfigured) {
      const { data, error } = await supabase.rpc('replace_colaboradores', {
        p_colaboradores: colaboradores
      });
      if (error) throw error;
      resultadoServidor = data;
    }

    localStorage.setItem('tt_people_colaboradores_cache', JSON.stringify(colaboradores));
    localStorage.setItem('tt_people_base_updated_at', new Date().toISOString());

    return {
      colaboradores,
      regionais,
      totalColaboradores: resultadoServidor?.colaboradores ?? colaboradores.length,
      totalRegionais: resultadoServidor?.regionais ?? regionais.length
    };
  },

  async pesquisar(texto, usuario) {
    const q = normalize(texto);
    if (!q) return [];

    if (isCloudConfigured) {
      let query = supabase
        .from('colaboradores')
        .select('*')
        .or(`matricula.ilike.%${q}%,nome.ilike.%${q}%,cpf.ilike.%${q}%`);

      if (usuario?.perfil === 'SUPORTE' && usuario?.regional_nome) {
        query = query.eq('regional', usuario.regional_nome);
      }

      const { data, error } = await query.limit(20);
      if (!error) return data || [];
    }

    const cache = JSON.parse(localStorage.getItem('tt_people_colaboradores_cache') || '[]');
    return cache.filter(c => {
      const matchText = normalize(c.matricula).includes(q) || normalize(c.nome).includes(q) || normalize(c.cpf).includes(q);
      const matchRegional = usuario?.perfil === 'SUPORTE' && usuario?.regional_nome
        ? normalize(c.regional || c.folha) === normalize(usuario.regional_nome)
        : true;
      return matchText && matchRegional;
    }).slice(0, 20);
  },

  async contar(usuario) {
    if (isCloudConfigured) {
      let query = supabase.from('colaboradores').select('*', { count: 'exact', head: true });
      if (usuario?.perfil === 'SUPORTE' && usuario?.regional_nome) {
        query = query.eq('regional', usuario.regional_nome);
      }
      const { count } = await query;
      return count || 0;
    }
    const cache = JSON.parse(localStorage.getItem('tt_people_colaboradores_cache') || '[]');
    if (usuario?.perfil === 'SUPORTE' && usuario?.regional_nome) {
      return cache.filter(c => normalize(c.regional || c.folha) === normalize(usuario.regional_nome)).length;
    }
    return cache.length;
  }
};


