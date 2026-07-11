import { MODULOS } from './modules.js';
import { UI } from './ui.js';

const VIEW_IDS = [
  'dashboardView',
  'historyView',
  'reportsView',
  'configView',
  'auditView',
  'timelineView',
  'globalSearchView',
  'dossieView',
  'processCenterView',
  'activityView',
  'libraryView',
  'updatesView',
  'moduleView'
];

function ativarView(id, menuId, titulo, subtitulo) {
  VIEW_IDS.forEach(viewId => document.getElementById(viewId)?.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.getElementById('btnVoltarDashboard')?.classList.toggle('d-none', id === 'dashboardView');
  document.querySelectorAll('.menu-item').forEach(b => b.classList.toggle('active', menuId && b.id === menuId));
  UI.setTitle(titulo, subtitulo);
}

export const Router = {
  abrir(id) {
    const modulo = MODULOS.find(m => m.id === id);
    if (!modulo) return;
    ativarView('moduleView', null, modulo.titulo, modulo.descricao);
    document.querySelectorAll('.menu-item').forEach(b => b.classList.toggle('active', b.dataset.module === id));
    document.getElementById('workspace').innerHTML = this.renderFormulario(modulo);
  },

  dashboard() {
    ativarView('dashboardView', 'menuDashboard', 'Home', 'TONHO TECH People • Visão executiva do RH');
  },

  historico() {
    ativarView('historyView', 'menuHistorico', 'Últimas Solicitações', 'Histórico geral de solicitações geradas no TONHO TECH People');
  },

  relatorios() {
    ativarView('reportsView', 'menuRelatorios', 'Relatórios', 'Indicadores e exportação das solicitações do TONHO TECH People');
  },

  auditoria() {
    ativarView('auditView', 'menuAuditoria', 'Auditoria', 'Logs de acesso e operações sensíveis do TONHO TECH People');
  },

  timeline() {
    ativarView('timelineView', 'menuTimeline', 'Timeline do Colaborador', 'Histórico visual da vida do colaborador no TONHO TECH People');
  },

  pesquisaGlobal() {
    ativarView('globalSearchView', 'menuPesquisaGlobal', 'Pesquisa Global', 'Localize colaboradores, módulos e solicitações em um único lugar');
  },

  dossie() {
    ativarView('dossieView', 'menuDossie', 'Dossiê do Colaborador', 'Prontuário completo com dados, solicitações, timeline e documentos');
  },

  processos() {
    ativarView('processCenterView', 'menuProcessos', 'Processos', 'Central de processos, indicadores e rotinas do RH');
  },

  atividades() {
    ativarView('activityView', 'menuAtividades', 'Centro de Atividades', 'Feed operacional com as ações recentes do TONHO TECH People');
  },

  biblioteca() {
    ativarView('libraryView', 'menuBiblioteca', 'Biblioteca RH', 'Procedimentos, políticas, modelos e orientações internas');
  },

  novidades() {
    ativarView('updatesView', 'menuNovidades', 'Novidades da Versão', 'O que mudou no TONHO TECH People v5.7');
  },

  configuracoes() {
    ativarView('configView', 'menuConfig', 'Configurações', 'Base local, histórico, usuários e segurança do sistema');
  },

  renderFormulario(m) {
    const c = window.PortalRH.colaborador;
    if (!c) {
      return `<div class="alert alert-warning"><strong>Atenção:</strong> pesquise e selecione um colaborador antes de abrir esta solicitação.</div>`;
    }

    const campos = m.campos.map(campo => this.renderCampo(campo)).join('');

    return `
      <div class="form-header">
        <div>
          <h3>${UI.safe(m.titulo)}</h3>
          <p>${UI.safe(m.descricao)}</p>
        </div>
        <span class="badge bg-primary">${UI.safe(m.categoria)}</span>
      </div>

      <div class="form-card">
        <h4>Dados do colaborador</h4>
        <div class="form-grid">
          ${this.readonly('Nome', c.nome)}
          ${this.readonly('Matrícula', c.matricula)}
          ${this.readonly('Cargo', c.cargo)}
          ${this.readonly('CPF', c.cpf)}
          ${this.readonly('Empresa', c.empresa)}
          ${this.readonly('Regional / Folha', c.folha)}
          ${this.readonly('Data', new Date().toLocaleDateString('pt-BR'))}
        </div>
      </div>

      <div class="form-card">
        <h4>Dados da solicitação</h4>
        <div class="form-grid">${campos}</div>
        <div class="form-actions">
          <button class="btn btn-secondary" id="btnCancelarModulo">Cancelar</button>
          <button class="btn btn-primary" id="btnGerarDocumento" data-id="${m.id}">
            <i class="fa-solid fa-print"></i> Gerar Documento
          </button>
        </div>
      </div>`;
  },

  readonly(label, value) {
    return `<div class="field"><label>${label}</label><input readonly value="${UI.safe(value)}"></div>`;
  },

  renderCampo(c) {
    const req = c.obrigatorio ? 'data-required="1"' : '';
    if (c.tipo === 'select') {
      return `<div class="field"><label>${UI.safe(c.label)}</label><select id="campo_${c.id}" ${req}><option value="">Selecione...</option>${(c.opcoes || []).map(o => `<option>${UI.safe(o)}</option>`).join('')}</select></div>`;
    }
    if (c.tipo === 'textarea') {
      return `<div class="field full"><label>${UI.safe(c.label)}</label><textarea id="campo_${c.id}" rows="4" ${req}></textarea></div>`;
    }
    if (c.tipo === 'date') {
      return `<div class="field"><label>${UI.safe(c.label)}</label><input id="campo_${c.id}" type="date" ${req}></div>`;
    }
    return `<div class="field"><label>${UI.safe(c.label)}</label><input id="campo_${c.id}" type="text" ${req}></div>`;
  }
};
