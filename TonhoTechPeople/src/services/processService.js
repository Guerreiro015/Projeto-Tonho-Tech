export const PROCESSOS = [
  { id: 'cracha', titulo: '2ª Via de Crachá', categoria: 'Documentos', icon: '🪪', cor: 'blue', descricao: 'Emitir solicitação de nova via de crachá.', campos: [{ key: 'motivo', label: 'Motivo', type: 'select', options: ['Perda', 'Roubo', 'Danificado', 'Alteração de Nome', 'Outro'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'vt', titulo: 'Vale Transporte', categoria: 'Benefícios', icon: '🚌', cor: 'green', descricao: 'Solicitação ou alteração de vale transporte.', campos: [{ key: 'tipoAlteracao', label: 'Tipo de Alteração', type: 'select', options: ['Inclusão', 'Alteração', 'Cancelamento'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'farmacia', titulo: 'Convênio Farmácia', categoria: 'Benefícios', icon: '💊', cor: 'red', descricao: 'Adesão ou manutenção de convênio farmácia.', campos: [{ key: 'acao', label: 'Ação', type: 'select', options: ['Adesão', 'Atualização', 'Cancelamento'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'convenio-medico', titulo: 'Exclusão de Convênio Médico', categoria: 'Benefícios', icon: '🏥', cor: 'red', descricao: 'Exclusão do titular e/ou dependentes do convênio médico.', campos: [{ key: 'tipoExclusao', label: 'Tipo de Exclusão', type: 'select', options: ['Titular', 'Dependente', 'Titular e Dependentes'] }, { key: 'motivo', label: 'Motivo', type: 'select', options: ['Pedido do colaborador', 'Inclusão em outro plano', 'Desligamento', 'Óbito', 'Outro'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'reembolso', titulo: 'Reembolso', categoria: 'Financeiro', icon: '💰', cor: 'purple', descricao: 'Autorização e registro de reembolso.', campos: [{ key: 'valor', label: 'Valor', type: 'text' }, { key: 'motivo', label: 'Motivo', type: 'text' }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'uniforme', titulo: 'Uniforme', categoria: 'RH', icon: '👕', cor: 'cyan', descricao: 'Solicitação de uniforme.', campos: [{ key: 'tamanho', label: 'Tamanho', type: 'select', options: ['PP', 'P', 'M', 'G', 'GG', 'XG'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] }
];

export const ProcessService = {
  listar() { return PROCESSOS; },
  obter(id) { return PROCESSOS.find(p => p.id === id) || PROCESSOS[0]; },
  categorias() {
    return PROCESSOS.reduce((acc, processo) => {
      acc[processo.categoria] = acc[processo.categoria] || [];
      acc[processo.categoria].push(processo);
      return acc;
    }, {});
  }
};
