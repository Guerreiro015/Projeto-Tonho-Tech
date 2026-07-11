export const MODULOS = [
  {
    id:'cracha', titulo:'2ª Via de Crachá', categoria:'Documentos', icone:'fa-id-card', cor:'azul',
    descricao:'Emitir solicitação de nova via de crachá.', favorito:true,
    campos:[
      {id:'motivo', label:'Motivo', tipo:'select', opcoes:['Perda','Roubo','Danificado','Alteração de Nome','Outro'], obrigatorio:true},
      {id:'urgencia', label:'Urgência', tipo:'select', opcoes:['Normal','Urgente']},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'vrva', titulo:'2ª Via VR / VA', categoria:'Benefícios', icone:'fa-credit-card', cor:'laranja',
    descricao:'Solicitar segunda via de cartão VR/VA.', favorito:true,
    campos:[
      {id:'cartao', label:'Tipo de cartão', tipo:'select', opcoes:['VR','VA','VR e VA'], obrigatorio:true},
      {id:'motivo', label:'Motivo', tipo:'select', opcoes:['Perda','Roubo','Danificado','Bloqueio','Outro'], obrigatorio:true},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'recebimento-cracha', titulo:'Declaração Receb. Crachá', categoria:'Documentos', icone:'fa-clipboard-check', cor:'ciano',
    descricao:'Declaração de recebimento de crachá.',
    campos:[
      {id:'tipo', label:'Tipo de entrega', tipo:'select', opcoes:['Primeira via','Segunda via','Substituição'], obrigatorio:true},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'vt', titulo:'Vale Transporte', categoria:'Benefícios', icone:'fa-bus', cor:'verde',
    descricao:'Solicitação ou alteração de vale transporte.', favorito:true,
    campos:[
      {id:'tipo', label:'Tipo de solicitação', tipo:'select', opcoes:['Inclusão','Alteração','Atualização de trajeto'], obrigatorio:true},
      {id:'linha', label:'Linha / Trajeto', tipo:'text'},
      {id:'valor', label:'Valor diário', tipo:'text'},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'desistencia-vt', titulo:'Desistência de VT', categoria:'Benefícios', icone:'fa-ban', cor:'vermelha',
    descricao:'Registrar desistência do vale transporte.',
    campos:[
      {id:'motivo', label:'Motivo da desistência', tipo:'textarea', obrigatorio:true},
      {id:'data', label:'Data da desistência', tipo:'date', obrigatorio:true}
    ]
  },
  {
    id:'farmacia', titulo:'Convênio Farmácia', categoria:'Benefícios', icone:'fa-heart-pulse', cor:'vermelha',
    descricao:'Solicitação de convênio farmácia.', favorito:true,
    campos:[
      {id:'tipo', label:'Tipo', tipo:'select', opcoes:['Inclusão','Exclusão','Alteração'], obrigatorio:true},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'reembolso', titulo:'Autorização de Reembolso', categoria:'Financeiro', icone:'fa-money-bill-wave', cor:'roxa',
    descricao:'Autorização de reembolso.', favorito:true,
    campos:[
      {id:'valor', label:'Valor do reembolso', tipo:'text', obrigatorio:true},
      {id:'motivo', label:'Motivo', tipo:'textarea', obrigatorio:true},
      {id:'dadosBancarios', label:'Dados bancários / PIX', tipo:'textarea'}
    ]
  },
  {
    id:'residencia', titulo:'Declaração de Residência', categoria:'Documentos', icone:'fa-house', cor:'laranja',
    descricao:'Gerar declaração de residência.',
    campos:[
      {id:'endereco', label:'Endereço completo', tipo:'textarea', obrigatorio:true},
      {id:'comprovante', label:'Comprovante apresentado?', tipo:'select', opcoes:['Sim','Não']}
    ]
  },
  {
    id:'uniao', titulo:'União Estável', categoria:'RH', icone:'fa-heart', cor:'ciano',
    descricao:'Registro de união estável.',
    campos:[
      {id:'companheiro', label:'Nome do(a) companheiro(a)', tipo:'text', obrigatorio:true},
      {id:'cpfCompanheiro', label:'CPF do(a) companheiro(a)', tipo:'text'},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'experiencia', titulo:'Termo de Experiência', categoria:'RH', icone:'fa-file-signature', cor:'azul',
    descricao:'Controle e emissão de termo de experiência.',
    campos:[
      {id:'periodo', label:'Período', tipo:'select', opcoes:['45 dias','90 dias','Prorrogação'], obrigatorio:true},
      {id:'dataFinal', label:'Data final', tipo:'date'},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'exclusao-convenio-medico', titulo:'Exclusão de Convênio Médico', categoria:'Benefícios', icone:'fa-user-minus', cor:'vermelha',
    descricao:'Solicitar exclusão do colaborador e/ou dependentes do convênio médico.',
    campos:[
      {id:'tipoExclusao', label:'Tipo de exclusão', tipo:'select', opcoes:['Titular','Dependente','Titular e Dependentes'], obrigatorio:true},
      {id:'motivo', label:'Motivo', tipo:'select', opcoes:['Pedido do Colaborador','Desligamento','Inclusão em outro plano','Óbito','Outro'], obrigatorio:true},
      {id:'dataExclusao', label:'Data da exclusão', tipo:'date', obrigatorio:true},
      {id:'dependentes', label:'Dependentes a excluir', tipo:'textarea'},
      {id:'observacoes', label:'Observações', tipo:'textarea'}
    ]
  },
  {
    id:'crow-odonto', titulo:'Exclusão Crow Odonto', categoria:'Benefícios', icone:'fa-tooth', cor:'ciano',
    descricao:'Solicitar exclusão do benefício odontológico.',
    campos:[
      {id:'motivo', label:'Motivo', tipo:'textarea', obrigatorio:true},
      {id:'dependentes', label:'Possui dependentes?', tipo:'select', opcoes:['Não','Sim']}
    ]
  },
  {
    id:'convocacao', titulo:'Convocação de Trabalho', categoria:'RH', icone:'fa-bullhorn', cor:'laranja',
    descricao:'Emitir convocação de trabalho.',
    campos:[
      {id:'data', label:'Data da convocação', tipo:'date', obrigatorio:true},
      {id:'horario', label:'Horário', tipo:'text', obrigatorio:true},
      {id:'local', label:'Local', tipo:'text'},
      {id:'motivo', label:'Motivo', tipo:'textarea'}
    ]
  },
  {
    id:'mudanca-local', titulo:'Movimentação de Local', categoria:'RH', icone:'fa-building-user', cor:'verde',
    descricao:'Alteração de local de trabalho.',
    campos:[
      {id:'localAtual', label:'Local atual', tipo:'text'},
      {id:'novoLocal', label:'Novo local', tipo:'text', obrigatorio:true},
      {id:'dataInicio', label:'Data de início', tipo:'date'},
      {id:'motivo', label:'Motivo', tipo:'textarea'}
    ]
  },
  {
    id:'mudanca-horario', titulo:'Movimentação de Horário', categoria:'RH', icone:'fa-clock', cor:'azul',
    descricao:'Alteração de horário de trabalho.',
    campos:[
      {id:'horarioAtual', label:'Horário atual', tipo:'text'},
      {id:'novoHorario', label:'Novo horário', tipo:'text', obrigatorio:true},
      {id:'dataInicio', label:'Data de início', tipo:'date'},
      {id:'motivo', label:'Motivo', tipo:'textarea'}
    ]
  }
];
