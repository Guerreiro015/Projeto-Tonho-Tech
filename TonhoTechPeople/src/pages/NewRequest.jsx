import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { People } from './People';
import { RequestService } from '../services/requestService';
import { ProcessService } from '../services/processService';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export function NewRequest({ user, initialProcessId }) {
  const [colaborador, setColaborador] = useState(null);
  const [processId, setProcessId] = useState(initialProcessId || 'cracha');
  const [dados, setDados] = useState({});
  const [created, setCreated] = useState(null);
  const processo = useMemo(() => ProcessService.obter(processId), [processId]);
  const processos = ProcessService.listar();

  function updateField(key, value) {
    setDados(prev => ({ ...prev, [key]: value }));
  }

  async function criar() {
    if (!colaborador) return alert('Selecione um colaborador.');
    const req = await RequestService.criar({ colaborador, tipo: processo.titulo, dados, usuario: user });
    setCreated(req);
  }

  return (
    <div className="grid two">
      <People onSelect={setColaborador} />
      <Card title="Nova Solicitação Online">
        {colaborador ? (
          <div className="selected-person"><strong>{colaborador.nome}</strong><span>{colaborador.matricula} • {colaborador.cargo} • {colaborador.regional}</span></div>
        ) : <p>Selecione um colaborador para continuar.</p>}

        <label className="tt-field"><span>Processo</span><select value={processId} onChange={e => { setProcessId(e.target.value); setDados({}); setCreated(null); }}>
          {processos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
        </select></label>

        <div className="process-summary">
          <div className="process-icon">{processo.icon}</div>
          <div><strong>{processo.titulo}</strong><p>{processo.descricao}</p><Badge tone="blue">{processo.categoria}</Badge></div>
        </div>

        <div className="form-grid">
          {processo.campos.map(campo => (
            <label key={campo.key} className={`tt-field ${campo.type === 'textarea' ? 'full' : ''}`}>
              <span>{campo.label}</span>
              {campo.type === 'select' ? (
                <select value={dados[campo.key] || ''} onChange={e => updateField(campo.key, e.target.value)}>
                  <option value="">Selecione...</option>
                  {campo.options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              ) : campo.type === 'textarea' ? (
                <textarea rows="4" value={dados[campo.key] || ''} onChange={e => updateField(campo.key, e.target.value)} />
              ) : (
                <input value={dados[campo.key] || ''} onChange={e => updateField(campo.key, e.target.value)} />
              )}
            </label>
          ))}
        </div>

        <Button onClick={criar}>Gerar Solicitação</Button>
        {created && <div className="success-box">Solicitação criada. Protocolo: <strong>{created.protocolo}</strong></div>}
      </Card>
    </div>
  );
}
