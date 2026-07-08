import { UI } from './ui.js';
import { Router } from './router.js';
import { MODULOS } from './modules.js';
import { ExcelService, carregarBaseLocal } from '../services/excel.service.js';
import { ColaboradorService } from '../services/colaborador.service.js';
import { IndexedDBService } from '../services/indexeddb.service.js';
import { SupabaseService } from '../services/supabase.service.js';

const PERFIS = {
  ADMIN: 'Admin',
  RH: 'RH/DP',
  SUPORTE: 'Suporte Regional'
};

const PERMISSOES = {
  Admin: ['importar-base', 'gerar-documento', 'configuracoes', 'limpar-base', 'limpar-historico', 'usuarios', 'relatorios', 'backup', 'auditoria'],
  'RH/DP': ['importar-base', 'gerar-documento', 'relatorios'],
  'Suporte Regional': ['importar-base', 'gerar-documento', 'nova-solicitacao', 'minhas-solicitacoes']
};

const LOGIN_SEMPRE_AO_ABRIR = true;

const USUARIOS_PADRAO = [
  { id: 'admin', nome: 'Administrador', perfil: 'Admin', pin: '1234', ativo: true },
  { id: 'rh', nome: 'RH / DP', perfil: 'RH/DP', pin: '1234', ativo: true },
  { id: 'suporte', nome: 'Suporte Regional', perfil: 'Suporte Regional', regional: 'Todas', pin: '1234', ativo: true }
];

window.PortalRH = {
  empresa: 'Empresa Tonhão Ltda',
  produto: 'TONHO TECH People',
  versao: '3.0',
  usuario: null,
  colaborador: null,
  solicitacoes: 0,
  historico: [],
  atualizarHistoricoColaborador: null,
  temPermissao
};

function cardModulo(m) {
  const total = obterHistorico().filter(h => h.moduloId === m.id || h.modulo === m.titulo).length;
  const ultima = obterHistorico().find(h => h.moduloId === m.id || h.modulo === m.titulo);
  return `
    <article class="module-card cor-${m.cor}" data-module="${m.id}">
      <button class="card-star ${m.favorito ? 'active' : ''}" title="Favorito" type="button">
        <i class="fa-solid fa-star"></i>
      </button>
      <div class="icon"><i class="fa-solid ${m.icone}"></i></div>
      <span class="module-category">${UI.safe(m.categoria)}</span>
      <h4>${UI.safe(m.titulo)}</h4>
      <p>${UI.safe(m.descricao)}</p>
      <div class="module-meta">
        <span>${total} solicitações</span>
        <span>${ultima ? 'Última: ' + UI.safe(ultima.data) : 'Ainda não usado'}</span>
      </div>
    </article>
  `;
}

function renderizarModulosPorCategoria() {
  const categorias = [...new Set(MODULOS.map(m => m.categoria || 'Outros'))];
  return categorias.map(categoria => `
    <div class="module-category-section">
      <div class="category-header">
        <h4>${UI.safe(categoria)}</h4>
        <span>${MODULOS.filter(m => (m.categoria || 'Outros') === categoria).length} módulos</span>
      </div>
      <div class="module-grid">
        ${MODULOS.filter(m => (m.categoria || 'Outros') === categoria).map(cardModulo).join('')}
      </div>
    </div>
  `).join('');
}

function obterHistorico() {
  return JSON.parse(localStorage.getItem('portal-historico') || '[]');
}

function atualizarStatusCloud(texto = null) {
  const valor = texto || (SupabaseService.online ? 'Online' : 'Local');
  const el = document.getElementById('sideStatusCloud');
  if (el) el.textContent = valor;
  const home = document.getElementById('statusCloudHome');
  if (home) home.textContent = valor;
}

async function testarCloudInicial() {
  const resultado = await SupabaseService.testarConexao();
  atualizarStatusCloud(resultado.ok ? 'Online' : 'Local');

  if (resultado.ok) {
    const syncUsuarios = await SupabaseService.sincronizarUsuariosLocais(obterUsuarios());
    if (syncUsuarios.ok) console.log('TONHO TECH Cloud:', syncUsuarios.mensagem);
  } else {
    console.warn('TONHO TECH Cloud:', resultado.mensagem);
  }
}

function normalizarTexto(valor) {
  return String(valor || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obterRegionalUsuario(usuario = PortalRH.usuario) {
  return usuario?.regional || 'Todas';
}

function usuarioVeTodasRegionais(usuario = PortalRH.usuario) {
  const r = normalizarTexto(obterRegionalUsuario(usuario));
  return !r || ['todas', 'todos', 'geral', 'matriz'].includes(r);
}

function colaboradorPermitidoParaUsuario(c, usuario = PortalRH.usuario) {
  if (!usuario || usuario.perfil !== PERFIS.SUPORTE) return true;
  if (usuarioVeTodasRegionais(usuario)) return true;
  return normalizarTexto(c?.folha || c?.regional) === normalizarTexto(usuario.regional);
}


function obterAuditoria() {
  return JSON.parse(localStorage.getItem('portal-auditoria') || '[]');
}

function registrarAuditoria(acao, detalhes = '') {
  const logs = obterAuditoria();
  const usuario = PortalRH.usuario || { nome: 'Sistema', perfil: 'Sistema' };
  logs.unshift({
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    dataISO: new Date().toISOString(),
    usuario: usuario.nome,
    perfil: usuario.perfil,
    acao,
    detalhes
  });
  localStorage.setItem('portal-auditoria', JSON.stringify(logs.slice(0, 1000)));
  atualizarAuditoriaTela();
}

function atualizarAuditoriaTela() {
  const tabela = document.getElementById('tabelaAuditoria');
  if (!tabela) return;

  const filtroAcao = document.getElementById('filtroAcaoAuditoria')?.value || '';
  const filtroUsuario = document.getElementById('filtroUsuarioAuditoria')?.value || '';
  const logs = obterAuditoria();

  const usuarios = [...new Set(logs.map(l => l.usuario || 'Sistema'))].sort();
  const acoes = [...new Set(logs.map(l => l.acao || 'Ação'))].sort();

  const selUsuario = document.getElementById('filtroUsuarioAuditoria');
  const selAcao = document.getElementById('filtroAcaoAuditoria');

  if (selUsuario && !selUsuario.dataset.loaded) {
    selUsuario.innerHTML = '<option value="">Todos os usuários</option>' + usuarios.map(u => `<option>${UI.safe(u)}</option>`).join('');
    selUsuario.dataset.loaded = '1';
  }
  if (selAcao && !selAcao.dataset.loaded) {
    selAcao.innerHTML = '<option value="">Todas as ações</option>' + acoes.map(a => `<option>${UI.safe(a)}</option>`).join('');
    selAcao.dataset.loaded = '1';
  }

  const filtrados = logs.filter(l => {
    const okUsuario = !filtroUsuario || l.usuario === filtroUsuario;
    const okAcao = !filtroAcao || l.acao === filtroAcao;
    return okUsuario && okAcao;
  });

  const total = document.getElementById('totalAuditoria');
  if (total) total.textContent = filtrados.length;

  tabela.innerHTML = filtrados.slice(0, 150).map(l => `
    <tr>
      <td>${UI.safe(l.data)} ${UI.safe(l.hora)}</td>
      <td>${UI.safe(l.usuario)}</td>
      <td>${UI.safe(l.perfil)}</td>
      <td>${UI.safe(l.acao)}</td>
      <td>${UI.safe(l.detalhes || '---')}</td>
    </tr>
  `).join('') || '<tr><td colspan="5">Nenhum registro de auditoria encontrado.</td></tr>';
}

function exportarAuditoriaCSV() {
  if (!temPermissao('auditoria')) return UI.toast('Acesso negado', 'Somente Admin pode exportar auditoria.');
  const logs = obterAuditoria();
  if (!logs.length) return UI.toast('Atenção', 'Não há registros de auditoria para exportar.');
  const linhas = [['Data', 'Hora', 'Usuário', 'Perfil', 'Ação', 'Detalhes']];
  logs.forEach(l => linhas.push([l.data, l.hora, l.usuario, l.perfil, l.acao, l.detalhes]));
  const csv = linhas.map(linha => linha.map(valor => `"${String(valor || '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_portal_rh_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  UI.toast('Auditoria exportada', 'Arquivo CSV gerado com sucesso.');
}

function limparAuditoria() {
  if (!temPermissao('auditoria')) return UI.toast('Acesso negado', 'Somente Admin pode limpar auditoria.');
  localStorage.removeItem('portal-auditoria');
  registrarAuditoria('Auditoria limpa', 'Registros anteriores foram removidos deste navegador.');
  UI.toast('Auditoria limpa', 'Os registros de auditoria foram reiniciados.');
}

function atualizarHistoricoTela() {
  const box = document.getElementById('historicoGrid');
  if (!box) return;

  const historico = obterHistorico();
  PortalRH.historico = historico;
  PortalRH.solicitacoes = historico.filter(h => h.dataISO === new Date().toISOString().slice(0, 10)).length;

  const totalSolic = document.getElementById('totalSolicitacoes');
  if (totalSolic) totalSolic.textContent = PortalRH.solicitacoes;

  if (!historico.length) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-clock-rotate-left"></i><span>Nenhuma solicitação gerada ainda.</span></div>';
    return;
  }

  box.innerHTML = historico.slice(0, 8).map(h => `
    <div class="history-item">
      <div>
        <strong>${UI.safe(h.modulo)}</strong>
        <small>${UI.safe(h.protocolo)} • ${UI.safe(h.colaborador)} • Mat. ${UI.safe(h.matricula)}</small>
      </div>
      <span>${UI.safe(h.data)} ${UI.safe(h.hora)}</span>
    </div>
  `).join('');
}

function atualizarHistoricoColaborador() {
  const box = document.getElementById('historicoColaboradorGrid');
  if (!box) return;

  const c = PortalRH.colaborador;
  if (!c) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-user-clock"></i><span>Selecione um colaborador para visualizar o histórico individual.</span></div>';
    return;
  }

  const historico = obterHistorico().filter(h => String(h.matricula) === String(c.matricula));

  if (!historico.length) {
    box.innerHTML = `<div class="empty-history"><i class="fa-solid fa-folder-open"></i><span>Nenhuma solicitação encontrada para ${UI.safe(c.nome)}.</span></div>`;
    return;
  }

  box.innerHTML = historico.slice(0, 10).map(h => `
    <div class="history-item collaborator-history-item">
      <div>
        <strong>${UI.safe(h.modulo)}</strong>
        <small>${UI.safe(h.protocolo)} • ${UI.safe(h.data)} às ${UI.safe(h.hora)}</small>
      </div>
      <span>${UI.safe(h.usuario || 'DP/RH')}</span>
    </div>
  `).join('');
}

PortalRH.atualizarHistoricoColaborador = () => { atualizarHistoricoColaborador(); atualizarTimelineTela(); atualizarDossieTela(); atualizarInteligencia(); };
PortalRH.atualizarTimelineTela = atualizarTimelineTela;
PortalRH.atualizarDossieTela = atualizarDossieTela;
PortalRH.atualizarInteligencia = atualizarInteligencia;

const BIBLIOTECA_RH = [
  { tipo: 'Procedimento', titulo: 'Vale Transporte', texto: 'Orientações para inclusão, alteração e desistência de vale transporte.' },
  { tipo: 'Procedimento', titulo: '2ª Via de Crachá', texto: 'Quando emitir, motivos aceitos e assinatura do colaborador.' },
  { tipo: 'Benefício', titulo: 'Convênio Médico', texto: 'Inclusão, exclusão de titular e dependentes, prazos e observações.' },
  { tipo: 'Benefício', titulo: 'Convênio Farmácia', texto: 'Solicitação, alteração e cancelamento do convênio farmácia.' },
  { tipo: 'Financeiro', titulo: 'Reembolso', texto: 'Autorização, dados bancários e motivo do reembolso.' },
  { tipo: 'RH', titulo: 'Movimentação de Local', texto: 'Registro de alteração de local de trabalho e data de início.' },
  { tipo: 'RH', titulo: 'Movimentação de Horário', texto: 'Registro de novo horário, motivo e data de início.' },
  { tipo: 'Documentos', titulo: 'Declaração de Residência', texto: 'Modelo para declaração e atualização de endereço do colaborador.' }
];

function renderizarCentroProcessos() {
  atualizarDashboardVivo();
  const box = document.getElementById('processCenterGrid');
  if (!box) return;
  const categorias = [...new Set(MODULOS.map(m => m.categoria || 'Outros'))];
  box.innerHTML = categorias.map(categoria => {
    const itens = MODULOS.filter(m => (m.categoria || 'Outros') === categoria);
    return `
      <div class="process-category">
        <div class="process-category-title"><h4>${UI.safe(categoria)}</h4><span>${itens.length} processos</span></div>
        <div class="process-list">
          ${itens.map(m => `
            <button class="process-item" data-module="${UI.safe(m.id)}">
              <i class="fa-solid ${UI.safe(m.icone)}"></i>
              <div><strong>${UI.safe(m.titulo)}</strong><span>${UI.safe(m.descricao)}</span></div>
              <em>${obterHistorico().filter(h => h.moduloId === m.id || h.modulo === m.titulo).length}</em>
            </button>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}

function renderizarAtividades() {
  const historico = obterHistorico();
  const html = historico.slice(0, 30).map(h => `
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid fa-file-signature"></i></div>
      <div>
        <strong>${UI.safe(h.modulo)}</strong>
        <span>${UI.safe(h.protocolo)} • ${UI.safe(h.colaborador)} • ${UI.safe(h.usuario || 'DP/RH')}</span>
      </div>
      <time>${UI.safe(h.data)} ${UI.safe(h.hora)}</time>
    </div>
  `).join('') || '<div class="empty-history"><i class="fa-solid fa-bolt"></i><span>Nenhuma atividade registrada ainda.</span></div>';
  const feed = document.getElementById('atividadeGrid');
  if (feed) feed.innerHTML = html;
}


function renderizarBiblioteca(filtro = '') {
  const box = document.getElementById('bibliotecaGrid');
  if (!box) return;
  const q = ExcelService.normalizar(filtro);
  const itens = BIBLIOTECA_RH.filter(i => !q || ExcelService.normalizar(i.titulo).includes(q) || ExcelService.normalizar(i.texto).includes(q) || ExcelService.normalizar(i.tipo).includes(q));
  box.innerHTML = itens.map(i => `
    <article class="library-card">
      <span>${UI.safe(i.tipo)}</span>
      <h4>${UI.safe(i.titulo)}</h4>
      <p>${UI.safe(i.texto)}</p>
    </article>
  `).join('') || '<div class="empty-history"><i class="fa-solid fa-book-open"></i><span>Nenhum item encontrado na Biblioteca RH.</span></div>';
}

function renderizarNovidades() {
  const box = document.getElementById('novidadesGrid');
  if (!box) return;
  const novidades = [
    ['Home Executiva', 'Dashboard foi renomeado para Home e ficou ainda mais limpo.'],
    ['Notificações consolidadas', 'A Central de Notificações saiu do topo; os alertas ficam somente no painel Alertas RH.'],
    ['Painel Meu Dia', 'Resumo prático com solicitações de hoje, alertas, base local e usuário conectado.'],
    ['Processos com indicadores', 'O antigo Dashboard Vivo agora vive dentro da tela Processos.'],
    ['Ações Rápidas', 'Atalhos para nova solicitação, pesquisa global, relatórios e backup.']
  ];
  box.innerHTML = novidades.map(([titulo, texto]) => `
    <article class="update-card">
      <i class="fa-solid fa-circle-check"></i>
      <div><strong>${UI.safe(titulo)}</strong><span>${UI.safe(texto)}</span></div>
    </article>
  `).join('');
}


function atualizarDashboardVivo() {
  const box = document.getElementById('processMetricsGrid');
  if (!box) return;
  const historico = obterHistorico();
  const porModulo = {};
  historico.forEach(h => porModulo[h.modulo] = (porModulo[h.modulo] || 0) + 1);
  const top = Object.entries(porModulo).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max = Math.max(1, ...top.map(([,t])=>t));

  if (!top.length) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-chart-simple"></i><span>Gere algumas solicitações para alimentar os indicadores por processo.</span></div>';
    return;
  }

  box.innerHTML = top.map(([nome,total]) => `
    <div class="live-item">
      <div class="live-line"><strong>${UI.safe(nome)}</strong><span>${total}</span></div>
      <div class="live-bar"><i style="width:${Math.max(8, Math.round((total/max)*100))}%"></i></div>
    </div>
  `).join('');
}


function renderizarAlertasDashboard(notificacoes) {
  const box = document.getElementById('dashboardAlertasGrid');
  if (!box) return;
  const principais = notificacoes.slice(0, 5);
  box.innerHTML = principais.map(n => `
    <article class="alert-card ${UI.safe(n.tipo)}">
      <i class="fa-solid ${n.tipo === 'ok' ? 'fa-circle-check' : n.tipo === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
      <div><strong>${UI.safe(n.titulo)}</strong><span>${UI.safe(n.texto)}</span></div>
    </article>
  `).join('') || '<div class="empty-history"><i class="fa-solid fa-circle-check"></i><span>Nenhum alerta importante no momento.</span></div>';
}

function atualizarMeuDia(notificacoes, hojeTotal) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('meuDiaSolicitacoes', hojeTotal);
  set('meuDiaAlertas', notificacoes.length);
  set('meuDiaBase', ExcelService.colaboradores.length ? 'OK' : 'Pendente');
  set('meuDiaUsuario', PortalRH.usuario?.nome || '---');
}

function atualizarInteligencia() {
  const historico = obterHistorico();
  const hoje = new Date().toISOString().slice(0,10);
  const mes = hoje.slice(0,7);
  const hojeTotal = historico.filter(h => h.dataISO === hoje).length;
  const mesTotal = historico.filter(h => String(h.dataISO || '').slice(0,7) === mes).length;
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = PortalRH.usuario?.nome || 'Antônio';
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('intelHoje', hojeTotal);
  set('intelMes', mesTotal);
  set('saudacaoEnterprise', `${saudacao}, ${nome}.`);
  set('resumoEnterprise', `${hojeTotal} solicitações hoje, ${mesTotal} no mês e ${ExcelService.colaboradores.length || 0} colaboradores na base.`);
  set('sideStatusBase', ExcelService.colaboradores.length ? 'OK' : 'Pendente');
  set('sideStatusPendencias', hojeTotal);
  atualizarDashboardVivo();
  const notificacoes = montarNotificacoes();
  renderizarAlertasDashboard(notificacoes);
  atualizarMeuDia(notificacoes, hojeTotal);
}

function montarNotificacoes() {
  const historico = obterHistorico();
  const baseInfo = JSON.parse(localStorage.getItem('portal-base-info') || 'null');
  const hoje = new Date().toISOString().slice(0,10);
  const mes = hoje.slice(0,7);
  const notificacoes = [];
  const hojeTotal = historico.filter(h => h.dataISO === hoje).length;
  const mesTotal = historico.filter(h => String(h.dataISO || '').slice(0,7) === mes).length;

  if (!ExcelService.colaboradores.length) {
    notificacoes.push({ tipo:'warning', titulo:'Base não carregada', texto:'Importe a planilha de colaboradores para usar todos os recursos.' });
  } else {
    notificacoes.push({ tipo:'ok', titulo:'Base disponível', texto:`${ExcelService.colaboradores.length} colaboradores carregados no navegador.` });
  }
  if (hojeTotal > 0) notificacoes.push({ tipo:'info', titulo:'Movimento de hoje', texto:`${hojeTotal} solicitações geradas hoje.` });
  if (mesTotal > 0) notificacoes.push({ tipo:'info', titulo:'Produção do mês', texto:`${mesTotal} solicitações registradas neste mês.` });
  if (PortalRH.colaborador) notificacoes.push({ tipo:'ok', titulo:'Colaborador ativo', texto:`${PortalRH.colaborador.nome} está selecionado.` });
  if (!baseInfo) notificacoes.push({ tipo:'warning', titulo:'Sem metadados da base', texto:'Quando importar a planilha, o TONHO TECH registra data e nome do arquivo.' });
  notificacoes.push({ tipo:'info', titulo:'TONHO TECH People v1.1', texto:'Home executiva, Alertas RH e Processos com indicadores estão ativos.' });
  return notificacoes;
}

function atualizarNotificacoes() {
  const notificacoes = montarNotificacoes();
  const badge = document.getElementById('badgeNotificacoes');
  const intel = document.getElementById('intelNotificacoes');
  const lista = document.getElementById('listaNotificacoes');
  if (badge) badge.textContent = notificacoes.length;
  if (intel) intel.textContent = notificacoes.length;
  if (lista) {
    lista.innerHTML = notificacoes.map(n => `
      <div class="notification-item ${n.tipo}">
        <i class="fa-solid ${n.tipo === 'ok' ? 'fa-circle-check' : n.tipo === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
        <div><strong>${UI.safe(n.titulo)}</strong><span>${UI.safe(n.texto)}</span></div>
      </div>
    `).join('');
  }
}

function atualizarTimelineTela() {
  const box = document.getElementById('timelineColaborador');
  if (!box) return;
  const c = PortalRH.colaborador;
  if (!c) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-user-clock"></i><span>Selecione um colaborador no Dashboard para visualizar a timeline.</span></div>';
    return;
  }
  const eventos = obterHistorico().filter(h => String(h.matricula) === String(c.matricula));
  if (!eventos.length) {
    box.innerHTML = `<div class="empty-history"><i class="fa-solid fa-timeline"></i><span>${UI.safe(c.nome)} ainda não possui eventos registrados.</span></div>`;
    return;
  }
  const grupos = {};
  eventos.forEach(e => {
    const ano = String(e.dataISO || '').slice(0,4) || 'Sem ano';
    grupos[ano] = grupos[ano] || [];
    grupos[ano].push(e);
  });
  box.innerHTML = Object.entries(grupos).sort((a,b)=>b[0].localeCompare(a[0])).map(([ano, itens]) => `
    <div class="timeline-year">
      <h4>${UI.safe(ano)}</h4>
      ${itens.map(e => `
        <div class="timeline-event">
          <span class="timeline-dot"></span>
          <div><strong>${UI.safe(e.modulo)}</strong><small>${UI.safe(e.protocolo)} • ${UI.safe(e.data)} às ${UI.safe(e.hora)} • ${UI.safe(e.usuario || 'DP/RH')}</small></div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function obterObservacoesDossie(matricula) {
  const dados = JSON.parse(localStorage.getItem('thr-dossie-observacoes') || '{}');
  return dados[String(matricula || '')] || '';
}

function salvarObservacoesDossie(matricula, texto) {
  const dados = JSON.parse(localStorage.getItem('thr-dossie-observacoes') || '{}');
  dados[String(matricula || '')] = texto || '';
  localStorage.setItem('thr-dossie-observacoes', JSON.stringify(dados));
}

function atualizarDossieTela() {
  const box = document.getElementById('dossieConteudo');
  if (!box) return;
  const c = PortalRH.colaborador;
  if (!c) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-address-card"></i><span>Selecione um colaborador na Home para abrir o dossiê.</span></div>';
    return;
  }

  const historico = obterHistorico().filter(h => String(h.matricula) === String(c.matricula));
  const modCategoria = h => MODULOS.find(m => m.id === h.moduloId || m.titulo === h.modulo)?.categoria || '';
  const beneficios = historico.filter(h => ['Benefícios','Financeiro'].includes(modCategoria(h)));
  const documentos = historico.filter(h => modCategoria(h) === 'Documentos');
  const rh = historico.filter(h => ['RH','Recursos Humanos'].includes(modCategoria(h)));
  const observacoes = obterObservacoesDossie(c.matricula);
  const ultimaAcao = historico[0];

  const porAno = {};
  historico.forEach(h => {
    const ano = String(h.dataISO || '').slice(0,4) || 'Sem ano';
    porAno[ano] = porAno[ano] || [];
    porAno[ano].push(h);
  });

  const linha = (label, valor) => `<div><small>${UI.safe(label)}</small><strong>${UI.safe(valor || '---')}</strong></div>`;
  const tabelaSolicitacoes = (lista) => lista.length ? `
    <div class="thr-table-wrap">
      <table class="thr-table">
        <thead><tr><th>Protocolo</th><th>Processo</th><th>Data</th><th>Usuário</th><th>Regional</th></tr></thead>
        <tbody>${lista.map(h => `<tr><td>${UI.safe(h.protocolo)}</td><td>${UI.safe(h.modulo)}</td><td>${UI.safe(h.data)} ${UI.safe(h.hora)}</td><td>${UI.safe(h.usuario || '---')}</td><td>${UI.safe(h.regionalUsuario || h.regionalColaborador || c.folha || '---')}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : '<div class="empty-history"><i class="fa-solid fa-folder-open"></i><span>Nenhum registro encontrado nesta aba.</span></div>';

  const timeline = Object.entries(porAno).sort((a,b)=>b[0].localeCompare(a[0])).map(([ano, itens]) => `
    <div class="dossie-year"><h4>${UI.safe(ano)}</h4>${itens.slice(0,12).map(h => `
      <div class="dossie-event"><span></span><div><strong>${UI.safe(h.modulo)}</strong><small>${UI.safe(h.protocolo)} • ${UI.safe(h.data)} às ${UI.safe(h.hora)} • ${UI.safe(h.usuario || 'DP/RH')}</small></div></div>
    `).join('')}</div>
  `).join('') || '<div class="empty-history"><i class="fa-solid fa-timeline"></i><span>Nenhuma movimentação registrada.</span></div>';

  box.innerHTML = `
    <div class="dossie-hero dossie-360-hero">
      <div class="dossie-avatar"><i class="fa-solid fa-user-tie"></i></div>
      <div class="dossie-main">
        <span class="enterprise-kicker">Dossiê 360° People</span>
        <h2>${UI.safe(c.nome)}</h2>
        <p>${UI.safe(c.cargo || 'Cargo não informado')} • Matrícula ${UI.safe(c.matricula)} • Regional/Folha ${UI.safe(c.folha || '---')}</p>
      </div>
      <div class="dossie-status"><span class="pill ${String(c.situacao || '').toLowerCase().includes('ativo') ? 'success' : 'warning'}">${UI.safe(c.situacao || 'Status não informado')}</span></div>
    </div>

    <div class="dossie-stats">
      <article><strong>${historico.length}</strong><span>Solicitações</span></article>
      <article><strong>${beneficios.length}</strong><span>Benefícios/Financeiro</span></article>
      <article><strong>${documentos.length}</strong><span>Documentos</span></article>
      <article><strong>${ultimaAcao?.data || '---'}</strong><span>Última ação</span></article>
    </div>

    <div class="dossie-tabs" role="tablist">
      <button class="active" data-dossie-tab="dados"><i class="fa-solid fa-id-card"></i> Dados Gerais</button>
      <button data-dossie-tab="solicitacoes"><i class="fa-solid fa-file-signature"></i> Solicitações</button>
      <button data-dossie-tab="beneficios"><i class="fa-solid fa-heart-pulse"></i> Benefícios</button>
      <button data-dossie-tab="documentos"><i class="fa-solid fa-folder-open"></i> Documentos</button>
      <button data-dossie-tab="timeline"><i class="fa-solid fa-timeline"></i> Timeline</button>
      <button data-dossie-tab="anexos"><i class="fa-solid fa-paperclip"></i> Anexos</button>
      <button data-dossie-tab="observacoes"><i class="fa-solid fa-note-sticky"></i> Observações</button>
    </div>

    <div class="dossie-tab-panel active" data-dossie-panel="dados">
      <div class="dossie-layout">
        <section class="dossie-card">
          <h3><i class="fa-solid fa-user"></i> Identificação</h3>
          <div class="dossie-data-grid">
            ${linha('Matrícula', c.matricula)}
            ${linha('CPF', c.cpf)}
            ${linha('Nome', c.nome)}
            ${linha('Situação', c.situacao)}
            ${linha('Cargo', c.cargo)}
            ${linha('Admissão', c.admissao)}
          </div>
        </section>
        <section class="dossie-card">
          <h3><i class="fa-solid fa-building-user"></i> Vínculo</h3>
          <div class="dossie-data-grid">
            ${linha('Empresa', c.empresa)}
            ${linha('Folha / Regional', c.folha)}
            ${linha('Centro de Custo', c.centroCusto)}
            ${linha('Gestor', c.gestor)}
            ${linha('Horário', c.horario)}
            ${linha('Escala', c.escala)}
          </div>
        </section>
        <section class="dossie-card full">
          <h3><i class="fa-solid fa-bolt"></i> Ações Rápidas</h3>
          <div class="dossie-actions">
            ${MODULOS.filter(m => m.favorito).map(m => `<button class="btn btn-outline-primary" data-module="${UI.safe(m.id)}"><i class="fa-solid ${UI.safe(m.icone)}"></i> ${UI.safe(m.titulo)}</button>`).join('')}
          </div>
        </section>
      </div>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="solicitacoes">
      <section class="dossie-card full"><h3><i class="fa-solid fa-file-signature"></i> Solicitações do colaborador</h3>${tabelaSolicitacoes(historico)}</section>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="beneficios">
      <section class="dossie-card full"><h3><i class="fa-solid fa-heart-pulse"></i> Benefícios e financeiro</h3>${tabelaSolicitacoes(beneficios)}</section>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="documentos">
      <section class="dossie-card full"><h3><i class="fa-solid fa-folder-open"></i> Documentos</h3>${tabelaSolicitacoes(documentos)}</section>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="timeline">
      <section class="dossie-card full"><h3><i class="fa-solid fa-timeline"></i> Timeline funcional</h3>${timeline}</section>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="anexos">
      <section class="dossie-card full">
        <h3><i class="fa-solid fa-paperclip"></i> Anexos</h3>
        <div class="dossie-placeholder">
          <i class="fa-solid fa-file-shield"></i>
          <div><strong>Área preparada para anexos</strong><span>Na próxima fase poderemos vincular RG, CPF, CNH, ASO, contratos, certificados e comprovantes ao colaborador.</span></div>
        </div>
      </section>
    </div>

    <div class="dossie-tab-panel" data-dossie-panel="observacoes">
      <section class="dossie-card full">
        <h3><i class="fa-solid fa-note-sticky"></i> Observações internas</h3>
        <p class="muted">As observações ficam salvas localmente para esta matrícula.</p>
        <textarea id="txtObservacoesDossie" class="dossie-notes" rows="7" placeholder="Registre observações internas do DP/RH sobre este colaborador...">${UI.safe(observacoes)}</textarea>
        <div class="form-actions"><button id="btnSalvarObservacoesDossie" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Salvar observações</button></div>
      </section>
    </div>
  `;
}


function executarPesquisaGlobal(texto) {
  const box = document.getElementById('resultadoPesquisaGlobal');
  if (!box) return;
  const q = ExcelService.normalizar(texto || '');
  if (q.length < 2) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-magnifying-glass"></i><span>Digite pelo menos 2 caracteres para pesquisar.</span></div>';
    return;
  }
  const colaboradores = ExcelService.colaboradores.filter(c =>
    ExcelService.normalizar(c.nome).includes(q) || ExcelService.normalizar(c.matricula).includes(q) || ExcelService.normalizar(c.cpf).includes(q)
  ).slice(0,8);
  const modulos = MODULOS.filter(m =>
    ExcelService.normalizar(m.titulo).includes(q) || ExcelService.normalizar(m.categoria).includes(q) || ExcelService.normalizar(m.descricao).includes(q)
  ).slice(0,8);
  const historico = obterHistorico().filter(h =>
    ExcelService.normalizar(h.protocolo).includes(q) || ExcelService.normalizar(h.colaborador).includes(q) || ExcelService.normalizar(h.modulo).includes(q) || ExcelService.normalizar(h.matricula).includes(q)
  ).slice(0,8);

  box.innerHTML = `
    <div class="global-group"><h4><i class="fa-solid fa-users"></i> Colaboradores</h4>${colaboradores.map(c => `<button class="global-result" data-global-colab="${UI.safe(c.matricula)}"><strong>${UI.safe(c.nome)}</strong><span>Mat. ${UI.safe(c.matricula)} • ${UI.safe(c.cargo || '---')}</span></button>`).join('') || '<p>Nenhum colaborador encontrado.</p>'}</div>
    <div class="global-group"><h4><i class="fa-solid fa-layer-group"></i> Módulos</h4>${modulos.map(m => `<button class="global-result" data-module="${UI.safe(m.id)}"><strong>${UI.safe(m.titulo)}</strong><span>${UI.safe(m.categoria)} • ${UI.safe(m.descricao)}</span></button>`).join('') || '<p>Nenhum módulo encontrado.</p>'}</div>
    <div class="global-group"><h4><i class="fa-solid fa-clock-rotate-left"></i> Histórico</h4>${historico.map(h => `<div class="global-result static"><strong>${UI.safe(h.modulo)}</strong><span>${UI.safe(h.protocolo)} • ${UI.safe(h.colaborador)} • ${UI.safe(h.data)}</span></div>`).join('') || '<p>Nenhum histórico encontrado.</p>'}</div>
  `;
}

function calcularRelatorios(historico) {
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(0, 7);
  const totalHoje = historico.filter(h => h.dataISO === hoje).length;
  const totalMes = historico.filter(h => String(h.dataISO || '').slice(0, 7) === mesAtual).length;
  const colaboradoresUnicos = new Set(historico.map(h => String(h.matricula))).size;
  const porModulo = {};
  const porUsuario = {};

  historico.forEach(h => {
    porModulo[h.modulo] = (porModulo[h.modulo] || 0) + 1;
    porUsuario[h.usuario || 'DP/RH'] = (porUsuario[h.usuario || 'DP/RH'] || 0) + 1;
  });

  return { totalHoje, totalMes, colaboradoresUnicos, porModulo, porUsuario };
}

function atualizarRelatoriosTela() {
  const tela = document.getElementById('reportsView');
  if (!tela) return;

  const historico = obterHistorico();
  const filtroModulo = document.getElementById('filtroModuloRelatorio')?.value || '';
  const filtroUsuario = document.getElementById('filtroUsuarioRelatorio')?.value || '';

  const filtrado = historico.filter(h => {
    const okModulo = !filtroModulo || h.modulo === filtroModulo;
    const okUsuario = !filtroUsuario || (h.usuario || 'DP/RH') === filtroUsuario;
    return okModulo && okUsuario;
  });

  const dados = calcularRelatorios(filtrado);
  document.getElementById('relTotalHoje').textContent = dados.totalHoje;
  document.getElementById('relTotalMes').textContent = dados.totalMes;
  document.getElementById('relTotalGeral').textContent = filtrado.length;
  document.getElementById('relColaboradores').textContent = dados.colaboradoresUnicos;

  const modulos = [...new Set(historico.map(h => h.modulo))].sort();
  const usuarios = [...new Set(historico.map(h => h.usuario || 'DP/RH'))].sort();

  const selModulo = document.getElementById('filtroModuloRelatorio');
  const selUsuario = document.getElementById('filtroUsuarioRelatorio');

  if (selModulo && !selModulo.dataset.loaded) {
    selModulo.innerHTML = '<option value="">Todos os módulos</option>' + modulos.map(m => `<option>${UI.safe(m)}</option>`).join('');
    selModulo.dataset.loaded = '1';
  }

  if (selUsuario && !selUsuario.dataset.loaded) {
    selUsuario.innerHTML = '<option value="">Todos os usuários</option>' + usuarios.map(u => `<option>${UI.safe(u)}</option>`).join('');
    selUsuario.dataset.loaded = '1';
  }

  const rankingModulo = document.getElementById('rankingModulo');
  rankingModulo.innerHTML = Object.entries(dados.porModulo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nome, total]) => `<div class="rank-item"><span>${UI.safe(nome)}</span><strong>${total}</strong></div>`)
    .join('') || '<div class="empty-history"><i class="fa-solid fa-chart-simple"></i><span>Nenhum dado para exibir.</span></div>';

  const rankingUsuario = document.getElementById('rankingUsuario');
  rankingUsuario.innerHTML = Object.entries(dados.porUsuario)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nome, total]) => `<div class="rank-item"><span>${UI.safe(nome)}</span><strong>${total}</strong></div>`)
    .join('') || '<div class="empty-history"><i class="fa-solid fa-user-check"></i><span>Nenhum dado para exibir.</span></div>';

  const tabela = document.getElementById('tabelaRelatorio');
  tabela.innerHTML = filtrado.slice(0, 80).map(h => `
    <tr>
      <td>${UI.safe(h.protocolo)}</td>
      <td>${UI.safe(h.data)} ${UI.safe(h.hora)}</td>
      <td>${UI.safe(h.modulo)}</td>
      <td>${UI.safe(h.colaborador)}</td>
      <td>${UI.safe(h.matricula)}</td>
      <td>${UI.safe(h.usuario || 'DP/RH')}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">Nenhuma solicitação encontrada.</td></tr>';
}

function exportarRelatorioCSV() {
  const historico = obterHistorico();
  if (!historico.length) return UI.toast('Atenção', 'Não há solicitações para exportar.');

  const linhas = [
    ['Protocolo', 'Data', 'Hora', 'Módulo', 'Colaborador', 'Matrícula', 'CPF', 'Usuário']
  ];

  historico.forEach(h => linhas.push([
    h.protocolo, h.data, h.hora, h.modulo, h.colaborador, h.matricula, h.cpf, h.usuario || 'DP/RH'
  ]));

  const csv = linhas.map(linha => linha.map(valor => `"${String(valor || '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_portal_rh_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  UI.toast('Relatório exportado', 'Arquivo CSV gerado com sucesso.');
}


async function exportarBackupGeral() {
  if (!temPermissao('backup')) return UI.toast('Acesso negado', 'Somente Admin pode exportar backup.');

  const backup = {
    sistema: 'TONHO TECH People',
    empresa: PortalRH.empresa,
    versao: '3.0',
    geradoEm: new Date().toISOString(),
    usuarios: obterUsuarios(),
    historico: obterHistorico(),
    auditoria: obterAuditoria(),
    baseInfo: JSON.parse(localStorage.getItem('portal-base-info') || 'null'),
    colaboradores: await IndexedDBService.listarColaboradores()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_portal_rh_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  registrarAuditoria('Backup exportado', 'Backup geral exportado em JSON.');
  UI.toast('Backup exportado', 'Arquivo JSON gerado com sucesso.');
}

async function importarBackupGeral(file) {
  if (!temPermissao('backup')) return UI.toast('Acesso negado', 'Somente Admin pode restaurar backup.');

  try {
    const texto = await file.text();
    const backup = JSON.parse(texto);

    if (!backup || !['Portal RH','THR Enterprise','TONHO TECH People'].includes(backup.sistema)) {
      UI.toast('Backup inválido', 'O arquivo selecionado não parece ser um backup do TONHO TECH People.');
      return;
    }

    if (Array.isArray(backup.usuarios)) {
      localStorage.setItem('portal-usuarios', JSON.stringify(backup.usuarios));
      preencherSelectUsuarios();
    }

    if (Array.isArray(backup.historico)) {
      localStorage.setItem('portal-historico', JSON.stringify(backup.historico));
    }

    if (Array.isArray(backup.auditoria)) {
      localStorage.setItem('portal-auditoria', JSON.stringify(backup.auditoria));
    }

    if (backup.baseInfo) {
      localStorage.setItem('portal-base-info', JSON.stringify(backup.baseInfo));
    }

    if (Array.isArray(backup.colaboradores)) {
      await IndexedDBService.salvarColaboradores(backup.colaboradores);
      ExcelService.colaboradores = backup.colaboradores;
      document.getElementById('statusBase').textContent = backup.colaboradores.length ? 'Carregada' : 'Não carregada';
      document.getElementById('totalFuncionarios').textContent = backup.colaboradores.length;
    }

    atualizarInfoBaseLocal();
    atualizarHistoricoTela();
    atualizarHistoricoColaborador();
    atualizarRelatoriosTela();
    atualizarAuditoriaTela();
    atualizarUsuarioTela();
    registrarAuditoria('Backup restaurado', 'Backup importado com sucesso.');
    UI.toast('Backup restaurado', 'Dados restaurados com sucesso neste navegador.');
  } catch (erro) {
    console.error('Erro ao restaurar backup:', erro);
    UI.toast('Erro', 'Não foi possível restaurar o backup selecionado.');
  }
}

function salvarHistorico(item) {
  const historico = obterHistorico();
  historico.unshift(item);
  localStorage.setItem('portal-historico', JSON.stringify(historico.slice(0, 300)));
  SupabaseService.salvarSolicitacao(item).then(r => {
    if (r?.ok) console.log('TONHO TECH Cloud:', r.mensagem);
    else if (r?.mensagem) console.warn('TONHO TECH Cloud:', r.mensagem);
  });
  const gridModulos = document.getElementById('modulesGrid');
  if (gridModulos) gridModulos.innerHTML = renderizarModulosPorCategoria();
  const favGrid = document.getElementById('favoritosGrid');
  if (favGrid) favGrid.innerHTML = MODULOS.filter(m => m.favorito).map(cardModulo).join('');
  atualizarHistoricoTela();
  atualizarHistoricoColaborador();
  atualizarRelatoriosTela();
  atualizarDashboardVivo();
  atualizarInteligencia();
  atualizarTimelineTela();
  atualizarDossieTela();
  renderizarAtividades();
  renderizarCentroProcessos();
}


function montarMenus() {
  document.getElementById('menuLateral').innerHTML = `
    <button class="menu-item" id="menuDashboard">
      <i class="fa-solid fa-house"></i><span>Home</span>
    </button>
    <button class="menu-item restricted-link" id="menuPesquisaGlobal">
      <i class="fa-solid fa-magnifying-glass-chart"></i><span>Pesquisa Global</span>
    </button>
    <button class="menu-item restricted-link" id="menuProcessos">
      <i class="fa-solid fa-diagram-project"></i><span>Processos</span>
    </button>
    <button class="menu-item support-only" id="menuImportarBaseSuporte">
      <i class="fa-solid fa-file-excel"></i><span>Importar Base</span>
    </button>
    <button class="menu-item support-only" id="menuNovaSolicitacaoSuporte">
      <i class="fa-solid fa-file-circle-plus"></i><span>Nova Solicitação</span>
    </button>
    <button class="menu-item support-only" id="menuMinhasSolicitacoes">
      <i class="fa-solid fa-clipboard-list"></i><span>Minhas Solicitações</span>
    </button>
    <button class="menu-item restricted-link" id="menuHistorico">
      <i class="fa-solid fa-clock-rotate-left"></i><span>Últimas Solicitações</span>
    </button>
    <button class="menu-item restricted-link" id="menuAtividades">
      <i class="fa-solid fa-bolt"></i><span>Atividades</span>
    </button>
    <button class="menu-item restricted-link" id="menuDossie">
      <i class="fa-solid fa-address-card"></i><span>Dossiê Colaborador</span>
    </button>
    <button class="menu-item restricted-link" id="menuTimeline">
      <i class="fa-solid fa-timeline"></i><span>Timeline</span>
    </button>
    <button class="menu-item restricted-link" id="menuBiblioteca">
      <i class="fa-solid fa-book-open"></i><span>Biblioteca RH</span>
    </button>
    <button class="menu-item restricted-link" id="menuNovidades">
      <i class="fa-solid fa-wand-magic-sparkles"></i><span>Novidades</span>
    </button>
    <button class="menu-item report-link" id="menuRelatorios">
      <i class="fa-solid fa-chart-column"></i><span>Relatórios</span>
    </button>
    <button class="menu-item admin-link" id="menuAuditoria">
      <i class="fa-solid fa-shield-halved"></i><span>Auditoria</span>
    </button>
    <button class="menu-item admin-link" id="menuConfig">
      <i class="fa-solid fa-gear"></i><span>Configurações</span>
    </button>
  `;

  document.getElementById('modulesGrid').innerHTML = renderizarModulosPorCategoria();
  document.getElementById('favoritosGrid').innerHTML = MODULOS.filter(m => m.favorito).map(cardModulo).join('');
  renderizarCentroProcessos();
  renderizarAtividades();
  renderizarBiblioteca();
  renderizarNovidades();
}

function iniciarRelogio() {
  const tick = () => document.getElementById('horaAtual').textContent = new Date().toLocaleTimeString('pt-BR');
  tick();
  setInterval(tick, 1000);
}

function gerarProtocolo() {
  const data = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `RH-${data}-${seq}`;
}

function criarHTMLDocumento(m, c, protocolo, dados) {
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');
  const linhasExtras = Object.entries(dados).map(([k, v]) => `
    <tr>
      <th>${UI.safe(k)}</th>
      <td>${UI.safe(v)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${UI.safe(m.titulo)} - ${UI.safe(protocolo)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;background:#f3f4f6;padding:24px}
  .page{max-width:850px;margin:auto;background:#fff;padding:42px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #1e3a8a;padding-bottom:18px;margin-bottom:24px}
  .brand h1{font-size:24px;margin:0;color:#1e3a8a;letter-spacing:.5px}.brand p{margin:5px 0 0;color:#475569;font-size:13px}
  .protocol{border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;text-align:right;font-size:12px;background:#f8fafc}.protocol strong{display:block;color:#1e3a8a;font-size:16px}
  h2{text-align:center;font-size:20px;margin:26px 0 22px;text-transform:uppercase;color:#111827}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}th{width:34%;text-align:left;background:#eff6ff;color:#1e3a8a}th,td{border:1px solid #cbd5e1;padding:10px 12px;font-size:13px;vertical-align:top}
  .section-title{font-weight:bold;color:#1e3a8a;margin:24px 0 10px;font-size:14px;text-transform:uppercase}.obs{min-height:65px}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:70px}.signature{text-align:center}.line{border-top:1px solid #111827;margin-bottom:8px}.footer{margin-top:34px;border-top:1px solid #e5e7eb;padding-top:12px;color:#64748b;font-size:11px;display:flex;justify-content:space-between}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;max-width:none}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand"><h1>EMPRESA TONHÃO LTDA</h1><p>TONHO TECH People • Gestão Inteligente de Pessoas</p></div>
    <div class="protocol">Protocolo<strong>${UI.safe(protocolo)}</strong></div>
  </div>

  <h2>${UI.safe(m.titulo)}</h2>

  <div class="section-title">Dados do colaborador</div>
  <table>
    <tr><th>Nome</th><td>${UI.safe(c.nome)}</td></tr>
    <tr><th>Matrícula</th><td>${UI.safe(c.matricula)}</td></tr>
    <tr><th>CPF</th><td>${UI.safe(c.cpf)}</td></tr>
    <tr><th>Cargo</th><td>${UI.safe(c.cargo)}</td></tr>
    <tr><th>Regional / Folha</th><td>${UI.safe(c.folha || '---')}</td></tr>
    <tr><th>Empresa</th><td>${UI.safe(c.empresa || 'Empresa Tonhão Ltda')}</td></tr>
  </table>

  <div class="section-title">Dados da solicitação</div>
  <table>
    <tr><th>Data da solicitação</th><td>${dataAtual} às ${horaAtual}</td></tr>
    ${linhasExtras}
  </table>

  <div class="signatures">
    <div class="signature"><div class="line"></div><strong>Assinatura do Colaborador</strong></div>
    <div class="signature"><div class="line"></div><strong>Responsável RH/DP</strong></div>
  </div>

  <div class="footer">
    <span>Emitido por ${UI.safe(PortalRH.usuario?.nome || 'DP/RH')} • ${UI.safe(PortalRH.usuario?.perfil || 'Perfil')} • Regional ${UI.safe(PortalRH.usuario?.regional || c.folha || '---')}</span>
    <span>${dataAtual} ${horaAtual}</span>
  </div>
</div>
</body>
</html>`;
}

function gerarDocumento(id) {
  if (!temPermissao('gerar-documento')) {
    UI.toast('Acesso negado', 'Seu perfil não tem permissão para gerar documentos.');
    return;
  }

  const m = MODULOS.find(x => x.id === id);
  const c = PortalRH.colaborador;
  if (!m || !c) return;

  const protocolo = gerarProtocolo();
  const dados = {};

  for (const campo of m.campos) {
    const el = document.getElementById(`campo_${campo.id}`);
    if (!el) continue;

    if (campo.obrigatorio && !el.value.trim()) {
      UI.toast('Atenção', `Preencha: ${campo.label}`);
      el.focus();
      return;
    }

    dados[campo.label] = el.value.trim() || '---';
  }

  const html = criarHTMLDocumento(m, c, protocolo, dados);
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);

  salvarHistorico({
    protocolo,
    modulo: m.titulo,
    colaborador: c.nome,
    matricula: c.matricula,
    cpf: c.cpf,
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    dataISO: new Date().toISOString().slice(0, 10),
    usuario: PortalRH.usuario?.nome || 'DP/RH',
    usuarioId: PortalRH.usuario?.id || 'sistema',
    perfil: PortalRH.usuario?.perfil || 'Sistema',
    regionalUsuario: PortalRH.usuario?.regional || '---',
    regionalColaborador: c.folha || '---',
    moduloId: m.id
  });

  registrarAuditoria('Documento gerado', `${m.titulo} • ${protocolo} • ${c.nome} (${c.matricula})`);
  UI.toast('Documento gerado', `${m.titulo} gerado com protocolo ${protocolo}.`);
}

function obterUsuarios() {
  let usuarios = JSON.parse(localStorage.getItem('portal-usuarios') || 'null');

  if (!usuarios || !Array.isArray(usuarios) || !usuarios.length) {
    usuarios = [...USUARIOS_PADRAO];
  }

  // v1.1: remove o perfil Consulta, migra o antigo Suporte e inclui Regional.
  usuarios = usuarios
    .filter(u => u.id !== 'consulta' && u.perfil !== 'Consulta')
    .map(u => ({
      ...u,
      perfil: (u.perfil === 'Consulta' || u.perfil === 'Suporte') ? PERFIS.SUPORTE : u.perfil,
      regional: u.regional || (u.perfil === PERFIS.SUPORTE || u.perfil === 'Suporte' ? 'Todas' : '')
    }));

  if (!usuarios.some(u => u.id === 'suporte')) {
    usuarios.push({ id: 'suporte', nome: 'Suporte Regional', perfil: PERFIS.SUPORTE, regional: 'Todas', pin: '1234', ativo: true });
  }

  localStorage.setItem('portal-usuarios', JSON.stringify(usuarios));
  return usuarios;
}

function salvarUsuarios(usuarios) {
  localStorage.setItem('portal-usuarios', JSON.stringify(usuarios));
  preencherSelectUsuarios();
}

function preencherSelectUsuarios() {
  const select = document.getElementById('loginUsuario');
  if (!select) return;
  const usuarios = obterUsuarios().filter(u => u.ativo !== false);
  select.innerHTML = usuarios.map(u => `<option value="${UI.safe(u.id)}">${UI.safe(u.nome)} • ${UI.safe(u.perfil)}</option>`).join('');
}

function obterUsuarioSalvo() {
  return JSON.parse(localStorage.getItem('portal-sessao') || 'null');
}

function temPermissao(permissao) {
  const perfil = PortalRH.usuario?.perfil;
  return Boolean(perfil && PERMISSOES[perfil]?.includes(permissao));
}

function ehSuporte() {
  return PortalRH.usuario?.perfil === PERFIS.SUPORTE;
}

function aplicarPermissoes() {
  const admin = temPermissao('configuracoes');
  const suporte = ehSuporte();

  document.body.classList.toggle('profile-support', suporte);

  document.querySelectorAll('.admin-only,.admin-link').forEach(el => el.classList.toggle('d-none', !admin));
  document.querySelectorAll('.report-link').forEach(el => el.classList.toggle('d-none', !temPermissao('relatorios') || suporte));
  document.querySelectorAll('.restricted-link').forEach(el => el.classList.toggle('d-none', suporte));
  document.querySelectorAll('.support-only').forEach(el => el.classList.toggle('d-none', !suporte));

  document.getElementById('btnImportar')?.classList.toggle('d-none', !temPermissao('importar-base'));
  document.getElementById('btnPesquisaGlobal')?.classList.toggle('d-none', suporte);
  document.getElementById('quickPesquisar')?.classList.toggle('d-none', suporte);
  document.getElementById('quickRelatorios')?.classList.toggle('d-none', suporte);
  document.getElementById('quickBackup')?.classList.toggle('d-none', suporte);
}

function atualizarUsuarioTela() {
  const usuario = PortalRH.usuario;
  const chip = document.getElementById('usuarioLogado');
  if (chip && usuario) chip.innerHTML = `<i class="fa-solid fa-user"></i> ${UI.safe(usuario.nome)} • ${UI.safe(usuario.perfil)}${usuario.regional ? ' • ' + UI.safe(usuario.regional) : ''}`;

  const info = document.getElementById('infoUsuarioAtual');
  if (info && usuario) info.textContent = `${usuario.nome} - Perfil: ${usuario.perfil}${usuario.regional ? ' - Regional: ' + usuario.regional : ''}`;
  aplicarPermissoes();
}

function abrirLogin(forcar = false) {
  preencherSelectUsuarios();

  // v5.8: por segurança, toda execução do sistema começa pela tela de login.
  // A sessão salva continua existindo apenas para registrar o último usuário,
  // mas não libera o acesso automaticamente ao recarregar/abrir o programa.
  if (!LOGIN_SEMPRE_AO_ABRIR) {
    PortalRH.usuario = obterUsuarioSalvo();
    if (PortalRH.usuario && !forcar) {
      atualizarUsuarioTela();
      document.getElementById('loginOverlay')?.classList.remove('show');
      return;
    }
  }

  PortalRH.usuario = null;
  document.getElementById('loginPin').value = '';
  document.getElementById('loginOverlay')?.classList.add('show');
}

async function entrarSistema() {
  const usuarioId = document.getElementById('loginUsuario').value;
  const pin = document.getElementById('loginPin').value.trim();

  const usuarioCloud = await SupabaseService.buscarUsuarioLogin(usuarioId, pin);
  if (usuarioCloud === false) {
    UI.toast('Atenção', 'PIN inválido.');
    return;
  }

  if (usuarioCloud) {
    PortalRH.usuario = usuarioCloud;
  } else {
    const usuario = obterUsuarios().find(u => u.id === usuarioId && u.ativo !== false);

    if (!usuario) {
      UI.toast('Atenção', 'Usuário não encontrado.');
      return;
    }
    if (pin !== String(usuario.pin)) {
      UI.toast('Atenção', 'PIN inválido.');
      return;
    }

    PortalRH.usuario = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil, regional: usuario.regional || '', entrada: new Date().toISOString(), origem: 'Local' };
  }
  localStorage.setItem('portal-sessao', JSON.stringify(PortalRH.usuario));
  atualizarUsuarioTela();
  document.getElementById('loginOverlay')?.classList.remove('show');
  registrarAuditoria('Login', `Acesso liberado para ${usuario.nome}.`);
  UI.toast('Bem-vindo', `Acesso liberado para ${usuario.nome}.`);
}

function atualizarInfoBaseLocal() {
  const info = document.getElementById('infoBaseLocal');
  if (!info) return;
  const base = JSON.parse(localStorage.getItem('portal-base-info') || 'null');
  if (!base) {
    info.textContent = 'Nenhuma base local carregada.';
    return;
  }
  info.textContent = `Última importação: ${base.data} • ${base.total} colaboradores.`;
}

function abrirModal(titulo, subtitulo, html) {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalSubtitulo').textContent = subtitulo;
  document.getElementById('modalConteudo').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

function abrirAlterarPin() {
  const u = PortalRH.usuario;
  if (!u) return;
  abrirModal('Alterar PIN', `Usuário: ${u.nome}`, `
    <div class="modal-form">
      <label>PIN atual</label>
      <input id="pinAtual" type="password">
      <label>Novo PIN</label>
      <input id="pinNovo" type="password">
      <label>Confirmar novo PIN</label>
      <input id="pinConfirmar" type="password">
      <button class="btn btn-primary w-100 mt-3" id="btnSalvarMeuPin"><i class="fa-solid fa-key"></i> Salvar novo PIN</button>
    </div>
  `);
}

function salvarMeuPin() {
  const atual = document.getElementById('pinAtual').value.trim();
  const novo = document.getElementById('pinNovo').value.trim();
  const confirmar = document.getElementById('pinConfirmar').value.trim();
  const usuarios = obterUsuarios();
  const idx = usuarios.findIndex(x => x.id === PortalRH.usuario.id);
  if (idx < 0) return;
  if (String(usuarios[idx].pin) !== atual) return UI.toast('Atenção', 'PIN atual inválido.');
  if (novo.length < 4) return UI.toast('Atenção', 'O novo PIN precisa ter pelo menos 4 caracteres.');
  if (novo !== confirmar) return UI.toast('Atenção', 'A confirmação não confere.');
  usuarios[idx].pin = novo;
  salvarUsuarios(usuarios);
  fecharModal();
  registrarAuditoria('PIN alterado', `Usuário ${PortalRH.usuario.nome} alterou o próprio PIN.`);
  UI.toast('PIN alterado', 'Seu PIN foi atualizado com sucesso.');
}

function abrirGerenciarUsuarios() {
  if (!temPermissao('usuarios')) {
    UI.toast('Acesso negado', 'Somente Admin pode gerenciar usuários.');
    return;
  }
  const linhas = obterUsuarios().map(u => `
    <tr>
      <td><input class="user-nome" data-id="${UI.safe(u.id)}" value="${UI.safe(u.nome)}"></td>
      <td>
        <select class="user-perfil" data-id="${UI.safe(u.id)}">
          ${Object.values(PERFIS).map(p => `<option ${p === u.perfil ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </td>
      <td><input class="user-regional" data-id="${UI.safe(u.id)}" value="${UI.safe(u.regional || '')}" placeholder="Ex: Campinas ou Todas"></td>
      <td><input class="user-pin" data-id="${UI.safe(u.id)}" value="${UI.safe(u.pin)}"></td>
      <td><input class="user-ativo" data-id="${UI.safe(u.id)}" type="checkbox" ${u.ativo !== false ? 'checked' : ''}></td>
    </tr>
  `).join('');
  abrirModal('Usuários e permissões', 'Controle local de acesso ao TONHO TECH People', `
    <div class="users-toolbar">
      <button class="btn btn-outline-primary" id="btnAdicionarUsuario"><i class="fa-solid fa-user-plus"></i> Adicionar usuário</button>
    </div>
    <div class="table-responsive">
      <table class="table-users">
        <thead><tr><th>Nome</th><th>Perfil</th><th>Regional</th><th>PIN</th><th>Ativo</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <button class="btn btn-primary w-100 mt-3" id="btnSalvarUsuarios"><i class="fa-solid fa-floppy-disk"></i> Salvar usuários</button>
    <small class="security-note">Permissões: Admin gerencia tudo; RH/DP importa base, relatórios e documentos; Suporte Regional importa base, cria solicitações pela Home e visualiza apenas as próprias solicitações.</small>
  `);
}

function adicionarUsuarioNoModal() {
  const tbody = document.querySelector('.table-users tbody');
  const id = `user_${Date.now()}`;
  tbody.insertAdjacentHTML('beforeend', `
    <tr>
      <td><input class="user-nome" data-id="${id}" value="Novo usuário"></td>
      <td><select class="user-perfil" data-id="${id}">${Object.values(PERFIS).map(p => `<option>${p}</option>`).join('')}</select></td>
      <td><input class="user-regional" data-id="${id}" value="Todas" placeholder="Ex: Campinas ou Todas"></td>
      <td><input class="user-pin" data-id="${id}" value="1234"></td>
      <td><input class="user-ativo" data-id="${id}" type="checkbox" checked></td>
    </tr>
  `);
}

function salvarUsuariosModal() {
  const ids = [...document.querySelectorAll('.user-nome')].map(el => el.dataset.id);
  const usuarios = ids.map(id => ({
    id,
    nome: document.querySelector(`.user-nome[data-id="${id}"]`).value.trim() || 'Usuário',
    perfil: document.querySelector(`.user-perfil[data-id="${id}"]`).value,
    regional: document.querySelector(`.user-regional[data-id="${id}"]`)?.value.trim() || '',
    pin: document.querySelector(`.user-pin[data-id="${id}"]`).value.trim() || '1234',
    ativo: document.querySelector(`.user-ativo[data-id="${id}"]`).checked
  }));
  salvarUsuarios(usuarios);
  fecharModal();
  registrarAuditoria('Usuários salvos', 'Permissões locais foram atualizadas.');
  UI.toast('Usuários salvos', 'Permissões atualizadas com sucesso.');
}


function atualizarMinhasSolicitacoes() {
  const box = document.getElementById('historicoGrid');
  if (!box) return;
  const usuario = PortalRH.usuario;
  const historico = obterHistorico().filter(h => h.usuarioId === usuario?.id || h.usuario === usuario?.nome);
  if (!historico.length) {
    box.innerHTML = '<div class="empty-history"><i class="fa-solid fa-clipboard-list"></i><span>Nenhuma solicitação gerada por este usuário ainda.</span></div>';
    return;
  }
  box.innerHTML = historico.slice(0, 80).map(h => `
    <div class="history-item">
      <div>
        <strong>${UI.safe(h.modulo)}</strong>
        <small>${UI.safe(h.protocolo)} • ${UI.safe(h.colaborador)} • Mat. ${UI.safe(h.matricula)} • Regional ${UI.safe(h.regionalColaborador || '---')}</small>
      </div>
      <span>${UI.safe(h.data)} ${UI.safe(h.hora)}</span>
    </div>
  `).join('');
}

function irParaNovaSolicitacaoSuporte() {
  Router.dashboard();
  setTimeout(() => document.getElementById('employeePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  UI.toast('Nova solicitação', 'Pesquise o colaborador e selecione uma solicitação nos cards da Home.');
}


// =====================================================
// TONHO TECH Command Center - v1.1
// =====================================================
let commandIndexSelecionado = 0;

function obterComandosDisponiveis() {
  const suporte = PortalRH.usuario?.perfil === PERFIS.SUPORTE;
  const comandos = [
    { id:'home', titulo:'Abrir Home', subtitulo:'Voltar para a tela inicial executiva', icone:'fa-house', acao:()=>Router.dashboard(), perfis:['Admin','RH/DP','Suporte Regional'] },
    { id:'processos', titulo:'Central de Processos', subtitulo:'Abrir processos e solicitações por categoria', icone:'fa-diagram-project', acao:()=>document.getElementById('menuProcessos')?.click(), perfis:['Admin','RH/DP'] },
    { id:'nova', titulo:'Nova Solicitação', subtitulo:'Pesquisar colaborador e gerar uma solicitação', icone:'fa-file-circle-plus', acao:()=>document.getElementById(suporte?'supportNovaSolicitacao':'quickNovaSolicitacao')?.click(), perfis:['Admin','RH/DP','Suporte Regional'] },
    { id:'importar', titulo:'Importar Base Excel', subtitulo:'Carregar ou atualizar a base de colaboradores', icone:'fa-file-excel', acao:()=>document.getElementById('btnImportar')?.click(), perfis:['Admin','RH/DP','Suporte Regional'] },
    { id:'pesquisa', titulo:'Pesquisa Global', subtitulo:'Buscar colaboradores, protocolos, módulos e histórico', icone:'fa-magnifying-glass-chart', acao:()=>document.getElementById('menuPesquisaGlobal')?.click(), perfis:['Admin','RH/DP'] },
    { id:'dossie', titulo:'Dossiê do Colaborador', subtitulo:'Abrir o prontuário 360° do colaborador selecionado', icone:'fa-address-card', acao:()=>document.getElementById('menuDossie')?.click(), perfis:['Admin','RH/DP'] },
    { id:'historico', titulo:'Últimas Solicitações', subtitulo:'Consultar o histórico geral de solicitações', icone:'fa-clock-rotate-left', acao:()=>document.getElementById('menuHistorico')?.click(), perfis:['Admin','RH/DP'] },
    { id:'minhas', titulo:'Minhas Solicitações', subtitulo:'Ver solicitações geradas pelo suporte regional', icone:'fa-clipboard-list', acao:()=>document.getElementById('menuMinhasSolicitacoes')?.click(), perfis:['Suporte Regional'] },
    { id:'relatorios', titulo:'Relatórios', subtitulo:'Indicadores, rankings e exportações CSV', icone:'fa-chart-column', acao:()=>document.getElementById('menuRelatorios')?.click(), perfis:['Admin','RH/DP'] },
    { id:'biblioteca', titulo:'Base de Conhecimento', subtitulo:'Procedimentos, políticas internas e modelos', icone:'fa-book-open', acao:()=>document.getElementById('menuBiblioteca')?.click(), perfis:['Admin','RH/DP'] },
    { id:'auditoria', titulo:'Auditoria', subtitulo:'Logs de segurança e operação do sistema', icone:'fa-shield-halved', acao:()=>document.getElementById('menuAuditoria')?.click(), perfis:['Admin'] },
    { id:'config', titulo:'Configurações do Sistema', subtitulo:'Usuários, backup, base local e segurança', icone:'fa-gear', acao:()=>document.getElementById('menuConfig')?.click(), perfis:['Admin'] }
  ];
  return comandos.filter(c => !PortalRH.usuario || c.perfis.includes(PortalRH.usuario.perfil));
}

function abrirCommandCenter() {
  const palette = document.getElementById('commandPalette');
  const input = document.getElementById('commandInput');
  if (!palette || !input) return;
  palette.classList.add('show');
  palette.setAttribute('aria-hidden','false');
  input.value = '';
  commandIndexSelecionado = 0;
  renderizarComandos('');
  setTimeout(()=>input.focus(),30);
}

function fecharCommandCenter() {
  const palette = document.getElementById('commandPalette');
  if (!palette) return;
  palette.classList.remove('show');
  palette.setAttribute('aria-hidden','true');
}

function renderizarComandos(filtro='') {
  const box = document.getElementById('commandResults');
  if (!box) return;
  const termo = normalizarTexto(filtro);
  const comandos = obterComandosDisponiveis().filter(c =>
    normalizarTexto(c.titulo).includes(termo) || normalizarTexto(c.subtitulo).includes(termo) || normalizarTexto(c.id).includes(termo)
  );
  if (commandIndexSelecionado >= comandos.length) commandIndexSelecionado = 0;
  box.innerHTML = comandos.map((c, i) => `
    <button class="command-item ${i===commandIndexSelecionado?'active':''}" data-command-id="${UI.safe(c.id)}" type="button">
      <i class="fa-solid ${UI.safe(c.icone)}"></i>
      <div><strong>${UI.safe(c.titulo)}</strong><span>${UI.safe(c.subtitulo)}</span></div>
    </button>
  `).join('') || '<div class="empty-history"><i class="fa-solid fa-magnifying-glass"></i><span>Nenhum comando encontrado.</span></div>';
}

function executarComando(id) {
  const comando = obterComandosDisponiveis().find(c => c.id === id);
  if (!comando) return;
  fecharCommandCenter();
  comando.acao();
  registrarAuditoria('Command Center', `Comando executado: ${comando.titulo}.`);
}

function iniciarCommandCenter() {
  const input = document.getElementById('commandInput');
  const results = document.getElementById('commandResults');
  const palette = document.getElementById('commandPalette');
  if (!input || !results || !palette) return;

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      abrirCommandCenter();
    }
    if (e.key === 'Escape' && palette.classList.contains('show')) fecharCommandCenter();
  });

  input.addEventListener('input', e => {
    commandIndexSelecionado = 0;
    renderizarComandos(e.target.value);
  });

  input.addEventListener('keydown', e => {
    const itens = [...document.querySelectorAll('.command-item')];
    if (!itens.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      commandIndexSelecionado = (commandIndexSelecionado + 1) % itens.length;
      renderizarComandos(input.value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      commandIndexSelecionado = (commandIndexSelecionado - 1 + itens.length) % itens.length;
      renderizarComandos(input.value);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const ativo = document.querySelector('.command-item.active') || itens[0];
      if (ativo) executarComando(ativo.dataset.commandId);
    }
  });

  results.addEventListener('click', e => {
    const item = e.target.closest('.command-item');
    if (item) executarComando(item.dataset.commandId);
  });

  palette.addEventListener('click', e => {
    if (e.target === palette) fecharCommandCenter();
  });
}

function registrarEventos() {
  document.addEventListener('click', e => {
    if (ehSuporte() && e.target.closest('.restricted-link')) {
      UI.toast('Acesso restrito', 'O perfil Suporte Regional acessa apenas Home, Importar Base, Nova Solicitação e Minhas Solicitações.');
      return;
    }

    const mod = e.target.closest('[data-module]');
    if (mod) Router.abrir(mod.dataset.module);

    if (e.target.closest('#menuDashboard') || e.target.closest('#btnVoltarDashboard')) Router.dashboard();

    if (e.target.closest('#quickNovaSolicitacao')) {
      if (ehSuporte()) return irParaNovaSolicitacaoSuporte();
      renderizarCentroProcessos();
      Router.processos();
    }

    if (e.target.closest('#quickPesquisar')) {
      Router.pesquisaGlobal();
      setTimeout(() => document.getElementById('txtPesquisaGlobal')?.focus(), 50);
    }

    if (e.target.closest('#quickRelatorios')) {
      if (!temPermissao('relatorios')) return UI.toast('Acesso negado', 'Seu perfil não pode abrir relatórios.');
      atualizarRelatoriosTela();
      Router.relatorios();
    }

    if (e.target.closest('#quickBackup')) {
      if (!temPermissao('configuracoes')) return UI.toast('Acesso negado', 'Somente Admin pode abrir as configurações.');
      atualizarInfoBaseLocal();
      atualizarUsuarioTela();
      Router.configuracoes();
    }

    if (e.target.closest('#menuImportarBaseSuporte')) {
      if (!temPermissao('importar-base')) return UI.toast('Acesso negado', 'Seu perfil não pode importar a base.');
      document.getElementById('arquivoExcel').click();
    }

    if (e.target.closest('#menuNovaSolicitacaoSuporte')) {
      irParaNovaSolicitacaoSuporte();
    }

    if (e.target.closest('#menuMinhasSolicitacoes')) {
      atualizarMinhasSolicitacoes();
      Router.historico();
      UI.setTitle('Minhas Solicitações', 'Solicitações criadas por este usuário regional');
    }

    if (e.target.closest('#menuProcessos')) {
      if (ehSuporte()) return UI.toast('Acesso restrito', 'O perfil Suporte cria solicitações diretamente pela Home.');
      renderizarCentroProcessos();
      Router.processos();
    }

    if (e.target.closest('#menuHistorico')) {
      atualizarHistoricoTela();
      Router.historico();
    }

    if (e.target.closest('#menuAtividades')) {
      renderizarAtividades();
      Router.atividades();
    }

    if (e.target.closest('#menuBiblioteca')) {
      renderizarBiblioteca(document.getElementById('txtBiblioteca')?.value || '');
      Router.biblioteca();
    }

    if (e.target.closest('#menuNovidades')) {
      renderizarNovidades();
      Router.novidades();
    }

    if (e.target.closest('#menuDossie') || e.target.closest('#btnAbrirDossie')) {
      if (ehSuporte()) return UI.toast('Acesso restrito', 'O perfil Suporte não acessa o dossiê do colaborador.');
      atualizarDossieTela();
      Router.dossie();
    }

    if (e.target.closest('#menuTimeline')) {
      if (ehSuporte()) return UI.toast('Acesso restrito', 'O perfil Suporte não acessa a timeline.');
      atualizarTimelineTela();
      Router.timeline();
    }

    if (e.target.closest('#menuPesquisaGlobal') || e.target.closest('#btnPesquisaGlobal')) {
      if (ehSuporte()) return UI.toast('Acesso restrito', 'O perfil Suporte usa apenas a pesquisa de colaborador da Home.');
      Router.pesquisaGlobal();
      setTimeout(() => document.getElementById('txtPesquisaGlobal')?.focus(), 50);
    }

    if (e.target.closest('#btnNotificacoes')) {
          document.getElementById('notificationPanel')?.classList.add('show');
    }

    if (e.target.closest('#btnFecharNotificacoes')) {
      document.getElementById('notificationPanel')?.classList.remove('show');
    }

    const globalColab = e.target.closest('[data-global-colab]');
    if (globalColab) {
      const c = ExcelService.colaboradores.find(x => String(x.matricula) === String(globalColab.dataset.globalColab));
      if (c) {
        ColaboradorService.selecionar(c);
        atualizarTimelineTela();
        atualizarDossieTela();
        Router.dashboard();
      }
    }

    const dossieTab = e.target.closest('[data-dossie-tab]');
    if (dossieTab) {
      const tab = dossieTab.dataset.dossieTab;
      document.querySelectorAll('[data-dossie-tab]').forEach(btn => btn.classList.toggle('active', btn === dossieTab));
      document.querySelectorAll('[data-dossie-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.dossiePanel === tab));
    }

    if (e.target.closest('#btnSalvarObservacoesDossie')) {
      if (!PortalRH.colaborador) return UI.toast('Atenção', 'Selecione um colaborador antes de salvar observações.');
      salvarObservacoesDossie(PortalRH.colaborador.matricula, document.getElementById('txtObservacoesDossie')?.value || '');
      registrarAuditoria('Dossiê', `Observações atualizadas para ${PortalRH.colaborador.nome}.`);
      UI.toast('Dossiê atualizado', 'Observações salvas com sucesso.');
    }

    if (e.target.closest('#menuRelatorios')) {
      if (!temPermissao('relatorios')) return UI.toast('Acesso negado', 'Seu perfil não pode abrir relatórios.');
      atualizarRelatoriosTela();
      Router.relatorios();
    }

    if (e.target.closest('#menuAuditoria')) {
      if (!temPermissao('auditoria')) return UI.toast('Acesso negado', 'Somente Admin pode abrir a auditoria.');
      atualizarAuditoriaTela();
      Router.auditoria();
    }

    if (e.target.closest('#menuConfig')) {
      if (!temPermissao('configuracoes')) return UI.toast('Acesso negado', 'Somente Admin pode abrir as configurações.');
      atualizarInfoBaseLocal();
      atualizarUsuarioTela();
      Router.configuracoes();
    }

    const gerar = e.target.closest('#btnGerarDocumento');
    if (gerar) gerarDocumento(gerar.dataset.id);

    if (e.target.closest('#btnCancelarModulo')) Router.dashboard();
    if (e.target.closest('#btnFecharModal')) fecharModal();
    if (e.target.closest('#btnAlterarPin')) abrirAlterarPin();
    if (e.target.closest('#btnSalvarMeuPin')) salvarMeuPin();
    if (e.target.closest('#btnGerenciarUsuarios')) abrirGerenciarUsuarios();
    if (e.target.closest('#btnAdicionarUsuario')) adicionarUsuarioNoModal();
    if (e.target.closest('#btnSalvarUsuarios')) salvarUsuariosModal();
    if (e.target.closest('#btnExportarCSV')) exportarRelatorioCSV();
    if (e.target.closest('#btnAtualizarRelatorio')) atualizarRelatoriosTela();
    if (e.target.closest('#btnExportarBackup')) exportarBackupGeral();
    if (e.target.closest('#btnImportarBackup')) document.getElementById('arquivoBackup').click();
    if (e.target.closest('#btnExportarAuditoria')) exportarAuditoriaCSV();
    if (e.target.closest('#btnAtualizarAuditoria')) atualizarAuditoriaTela();
    if (e.target.closest('#btnLimparAuditoria')) limparAuditoria();
  });

  document.addEventListener('change', e => {
    if (e.target.matches('#filtroModuloRelatorio,#filtroUsuarioRelatorio')) atualizarRelatoriosTela();
    if (e.target.matches('#filtroUsuarioAuditoria,#filtroAcaoAuditoria')) atualizarAuditoriaTela();
    if (e.target.matches('#arquivoBackup') && e.target.files.length) importarBackupGeral(e.target.files[0]);
  });

  document.addEventListener('input', e => {
    if (e.target.matches('#txtPesquisaGlobal')) executarPesquisaGlobal(e.target.value);
    if (e.target.matches('#txtBiblioteca')) renderizarBiblioteca(e.target.value);
  });
  document.getElementById('btnTema').addEventListener('click', () => UI.darkToggle());
  document.getElementById('btnEntrar').addEventListener('click', entrarSistema);
  document.getElementById('loginPin').addEventListener('keydown', e => { if (e.key === 'Enter') entrarSistema(); });
  document.getElementById('btnSair').addEventListener('click', () => { registrarAuditoria('Logout', `Usuário ${PortalRH.usuario?.nome || 'desconhecido'} saiu do sistema.`); localStorage.removeItem('portal-sessao'); abrirLogin(true); });
  document.getElementById('btnTrocarUsuario')?.addEventListener('click', () => abrirLogin(true));
  document.getElementById('btnLimparHistorico')?.addEventListener('click', () => {
    if (!temPermissao('limpar-historico')) return UI.toast('Acesso negado', 'Somente Admin pode limpar o histórico.');
    localStorage.removeItem('portal-historico'); atualizarHistoricoTela(); atualizarHistoricoColaborador(); registrarAuditoria('Histórico limpo', 'Histórico de solicitações removido.'); UI.toast('Histórico limpo','Registros removidos deste navegador.');
  });
  document.getElementById('btnLimparBase')?.addEventListener('click', async () => {
    if (!temPermissao('limpar-base')) return UI.toast('Acesso negado', 'Somente Admin pode limpar a base local.');
    await IndexedDBService.limparColaboradores(); ExcelService.colaboradores = []; localStorage.removeItem('portal-base-info'); document.getElementById('statusBase').textContent='Não carregada'; document.getElementById('totalFuncionarios').textContent='0'; atualizarInfoBaseLocal(); registrarAuditoria('Base limpa', 'Base local de colaboradores removida.'); UI.toast('Base limpa','A base local foi removida.');
  });
  document.getElementById('btnImportar').addEventListener('click', () => {
    if (!temPermissao('importar-base')) return UI.toast('Acesso negado', 'Seu perfil não pode importar a base.');
    document.getElementById('arquivoExcel').click();
  });
  document.getElementById('arquivoExcel').addEventListener('change', async e => {
    if (!e.target.files.length) return;
    if (!temPermissao('importar-base')) return UI.toast('Acesso negado', 'Seu perfil não pode importar a base.');
    await ExcelService.importar(e.target.files[0]);
    atualizarInfoBaseLocal();
    registrarAuditoria('Base importada', `${e.target.files[0].name} importada com sucesso.`);
    UI.toast('Base carregada', 'Planilha importada com sucesso e salva localmente.');

    try {
      UI.toast('Sincronizando nuvem', 'Enviando base para o Supabase...');
      const sync = await SupabaseService.sincronizarColaboradores(ExcelService.colaboradores);
      if (sync.ok) {
        registrarAuditoria('Base sincronizada na nuvem', sync.mensagem);
        atualizarStatusCloud('Online');
        UI.toast('Nuvem atualizada', sync.mensagem);
      } else {
        atualizarStatusCloud('Local');
        UI.toast('Modo local', sync.mensagem);
      }
    } catch (erro) {
      console.error('Erro ao sincronizar Supabase:', erro);
      atualizarStatusCloud('Local');
      UI.toast('Aviso', 'Base local carregada. Não foi possível sincronizar a nuvem.');
    }
    atualizarInteligencia();
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  UI.loadTheme();
  obterUsuarios();
  preencherSelectUsuarios();
  montarMenus();
  iniciarRelogio();
  registrarEventos();
  await testarCloudInicial();
  iniciarCommandCenter();
  ColaboradorService.iniciar();
  await carregarBaseLocal();
  atualizarInfoBaseLocal();
  atualizarHistoricoTela();
  atualizarHistoricoColaborador();
  atualizarRelatoriosTela();
  atualizarAuditoriaTela();
  atualizarTimelineTela();
  atualizarDossieTela();
  atualizarInteligencia();
  renderizarCentroProcessos();
  renderizarAtividades();
  renderizarBiblioteca();
  renderizarNovidades();
  executarPesquisaGlobal('');
  abrirLogin(true);
  UI.hideLoader();
});
