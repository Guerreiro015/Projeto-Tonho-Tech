export const PROCESSOS = [
  { id: 'cracha', titulo: '2ª Via de Crachá', categoria: 'Documentos', icon: '🪪', cor: 'blue', descricao: 'Emitir solicitação de nova via de crachá.', campos: [{ key: 'motivo', label: 'Motivo', type: 'select', options: ['Perda', 'Roubo', 'Danificado', 'Alteração de Nome', 'Outro'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'entrega-cracha', titulo: 'Entrega de Crachá', categoria: 'Documentos', icon: '🪪', cor: 'blue', descricao: 'Entrega de crachá.', campos: [{ key: 'tipoEntrega', label: 'Tipo de Entrega', type: 'select', options: ['Primeira via', 'Segunda via','Substituição'] }], },
  { id: 'vt', titulo: 'Vale Transporte', categoria: 'Benefícios', icon: '🚌', cor: 'green', descricao: 'Solicitação ou alteração de vale transporte.', campos: [{ key: 'tipoAlteracao', label: 'Tipo de Alteração', type: 'select', options: ['Inclusão', 'Alteração', 'Cancelamento'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'farmacia', titulo: 'Convênio Farmácia', categoria: 'Benefícios', icon: '💊', cor: 'red', descricao: 'Adesão ou manutenção de convênio farmácia.', campos: [{ key: 'acao', label: 'Ação', type: 'select', options: ['Adesão', 'Atualização', 'Cancelamento'] }, { key: 'motivo', label: 'Motivo', type: 'select', options: ['Admissão', 'Solicitação', 'Alteração de Nome', 'Outros'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'convenio-medico', titulo: 'Exclusão de Convênio Médico', categoria: 'Benefícios', icon: '🏥', cor: 'red', descricao: 'Exclusão do titular e/ou dependentes do convênio médico.', campos: [{ key: 'tipoExclusao', label: 'Tipo de Exclusão', type: 'select', options: ['Titular', 'Dependente', 'Titular e Dependentes'] }, { key: 'motivo', label: 'Motivo', type: 'select', options: ['Pedido do colaborador', 'Inclusão em outro plano', 'Desligamento', 'Óbito', 'Outro'] }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'convenio-odonto',
  titulo: 'Exclusão de Convênio Odontológico',
  categoria: 'Benefícios',
  icon: '🦷',
  cor: 'red',
  descricao: 'Exclusão do titular e/ou dependentes do convênio odontológico.',
  campos: [
    {
      key: 'tipoExclusao',
      label: 'Tipo de Exclusão',
      type: 'select',
      required: true,
      options: ['Titular', 'Dependente', 'Titular e Dependentes']
    },
    {
      key: 'motivo',
      label: 'Motivo',
      type: 'select',
      required: true,
      options: [
        'Pedido do colaborador',
        'Inclusão em outro plano',
        'Desligamento',
        'Óbito',
        'Outro'
      ]
    },
    {
      key: 'observacoes',
      label: 'Observações',
      type: 'textarea',
      required: false
    }
  ]
},
  { id: 'reembolso', titulo: 'Reembolso', categoria: 'Financeiro', icon: '💰', cor: 'purple', descricao: 'Autorização e registro de reembolso.', campos: [{ key: 'valor', label: 'Valor', type: 'text' }, { key: 'motivo', label: 'Motivo', type: 'text' }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'movimentação-setor', titulo: 'Movimentação de Setor', categoria: 'Operacional', icon: '🏢', cor: 'purple', descricao: 'Autorização e registro de movimentação de setor.', campos: [{ key: 'Setor Origem', label: 'Setor Origem', type: 'text' }, { key: 'Setor Destino', label: 'Setor Destino', type: 'text' },{ key: 'Horário Destino', label: 'Horário Destino', type: 'text' }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'movimentação-horário', titulo: 'Movimentação de Horário', categoria: 'Operacional', icon: '⏰', cor: 'orange', descricao: 'Autorização e registro de movimentação de horário.', campos: [{ key: 'Horário Origem', label: 'Horário Origem', type: 'text' }, { key: 'Horário Destino', label: 'Horário Destino', type: 'text' }, { key: 'observacoes', label: 'Observações', type: 'textarea' }] },
  { id: 'uniforme', titulo: 'Uniforme', categoria: 'RH', icon: '👕', cor: 'cyan', descricao: 'Solicitação de uniforme.', campos: [{ key: 'tamanho', label: 'Tamanho', type: 'select', options: ['PP', 'P', 'M', 'G', 'GG', 'XG'] }, { key: 'observacoes', label: 'Observações', type: 'textarea'}] }
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
