import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Table } from '../components/Table';
import { EmptyState } from '../components/EmptyState';
import { RequestService } from '../services/requestService';

export function Dossie({ person, onNewRequest }) {
  const [tab, setTab] = useState('dados');
  const [solicitacoes, setSolicitacoes] = useState([]);

  useEffect(() => {
    if (!person) return;
    RequestService.ultimas(100).then(lista => {
      setSolicitacoes(lista.filter(s => String(s.colaborador_matricula) === String(person.matricula)));
    });
  }, [person]);

  if (!person) {
    return <Card><EmptyState icon="👤" title="Nenhum colaborador selecionado" message="Pesquise um colaborador para abrir o Dossiê 360°." /></Card>;
  }

  const tabs = [
    ['dados', 'Dados'], ['solicitacoes', 'Solicitações'], ['beneficios', 'Benefícios'], ['documentos', 'Documentos'], ['timeline', 'Timeline'], ['observacoes', 'Observações']
  ];

  return (
    <div className="dossie-page">
      <section className="dossie-hero">
        <div className="avatar-xl">{person.nome?.slice(0,1)}</div>
        <div>
          <span className="eyebrow">Dossiê 360°</span>
          <h2>{person.nome}</h2>
          <p>{person.cargo || 'Cargo não informado'} • {person.regional || person.folha || 'Regional não informada'}</p>
          <div className="dossie-badges"><Badge tone="green">{person.situacao || 'Ativo'}</Badge><Badge tone="blue">Matrícula {person.matricula}</Badge></div>
        </div>
        <button onClick={onNewRequest}>+ Nova Solicitação</button>
      </section>

      <div className="tabs">
        {tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === 'dados' && <Card title="Dados Gerais">
        <div className="data-grid">
          <Info label="Nome" value={person.nome} />
          <Info label="Matrícula" value={person.matricula} />
          <Info label="CPF" value={person.cpf} />
          <Info label="Cargo" value={person.cargo} />
          <Info label="Regional / Folha" value={person.regional || person.folha} />
          <Info label="Horário" value={person.horario} />
          <Info label="Situação" value={person.situacao} />
          <Info label="Admissão" value={person.admissao} />
        </div>
      </Card>}

      {tab === 'solicitacoes' && <Card title="Solicitações do Colaborador">
        {solicitacoes.length === 0 ? <EmptyState title="Sem solicitações" message="Nenhuma solicitação online encontrada para este colaborador." /> : <Table columns={[{ key:'protocolo', label:'Protocolo' }, { key:'tipo', label:'Tipo' }, { key:'status', label:'Status' }, { key:'criado_em', label:'Criado em', render: r => new Date(r.criado_em).toLocaleString('pt-BR') }]} rows={solicitacoes} />}
      </Card>}

      {tab !== 'dados' && tab !== 'solicitacoes' && <Card title={tabs.find(t => t[0] === tab)?.[1]}><EmptyState icon="🧩" title="Área preparada" message="Este bloco já está reservado para a evolução do Dossiê 360°." /></Card>}
    </div>
  );
}

function Info({ label, value }) {
  return <div className="info-box"><span>{label}</span><strong>{value || '—'}</strong></div>;
}
