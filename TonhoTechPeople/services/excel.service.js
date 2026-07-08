import { IndexedDBService } from './indexeddb.service.js';

export const ExcelService = {
  colaboradores: [],
  mapa: {},

  async importar(file){
    try{
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer,{type:'array', cellDates:true});
      const aba = workbook.SheetNames.includes('QUADRO') ? 'QUADRO' : workbook.SheetNames[0];
      const sheet = workbook.Sheets[aba];
      const linhas = XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:true});
      const idx = this.encontrarCabecalho(linhas);
      if(idx < 0) throw new Error('Cabeçalho não encontrado.');
      this.criarMapa(linhas[idx]);
      this.colaboradores = this.converter(linhas.slice(idx+1));
      document.getElementById('statusBase').textContent='Carregada';
      document.getElementById('totalFuncionarios').textContent=this.colaboradores.length;
      return this.colaboradores;
    }catch(e){ console.error(e); alert('Erro ao importar a planilha. Veja o console (F12).'); return []; }
  },

  encontrarCabecalho(linhas){
    for(let i=0;i<Math.min(40,linhas.length);i++){
      const n = linhas[i].map(c=>this.normalizar(c));
      if((n.includes('id contratado') || n.includes('matricula')) && (n.includes('nome completo') || n.includes('nome'))) return i;
    }
    return -1;
  },

  criarMapa(cabecalho){
    this.mapa={};
    cabecalho.forEach((c,i)=>{ const k=this.normalizar(c); if(k) this.mapa[k]=i; });
  },

  converter(linhas){
    return linhas.map(l=>{
      const nome=this.valor(l,['Nome Completo','Nome']);
      if(!nome) return null;
      return {
        matricula:this.valor(l,['Id Contratado','Matrícula','Matricula']),
        nome,
        cargo:this.valor(l,['Cargo','Função','Funcao']),
        folha:this.valor(l,['Folha','Local','Filial']),
        admissao:this.formatarData(this.valor(l,['Data da Admissão','Data de Admissão','Admissão','Admissao'])),
        cpf:this.valor(l,['Cadastro de Pessoa Física','CPF']),
        situacao:this.valor(l,['Situação','Situacao','Status']),
        horario:this.valor(l,['Horário','Horario','Jornada']),
        empresa:'Empresa Tonhão Ltda'
      };
    }).filter(Boolean);
  },

  valor(linha, nomes){
    for(const nome of nomes){ const i=this.mapa[this.normalizar(nome)]; if(i!==undefined) return linha[i] ?? ''; }
    return '';
  },

  pesquisar(texto){
    const q=this.normalizar(texto);
    if(q.length<2) return [];
    return this.colaboradores.filter(c => this.normalizar(c.matricula).includes(q) || this.normalizar(c.nome).includes(q) || this.normalizar(c.cpf).includes(q)).slice(0,20);
  },

  normalizar(v){ return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); },
  formatarData(v){
    if(!v) return '';
    if(v instanceof Date && !isNaN(v)) return v.toLocaleDateString('pt-BR');
    if(typeof v==='number'){ const d=XLSX.SSF.parse_date_code(v); return d ? `${String(d.d).padStart(2,'0')}/${String(d.m).padStart(2,'0')}/${d.y}` : String(v); }
    return String(v);
  }
};


export async function carregarBaseLocal() {
  const colaboradores = await IndexedDBService.listarColaboradores();
  ExcelService.colaboradores = colaboradores || [];

  if (ExcelService.colaboradores.length) {
    document.getElementById('statusBase').textContent = 'Local';
    document.getElementById('totalFuncionarios').textContent = ExcelService.colaboradores.length;
  }

  return ExcelService.colaboradores;
}
