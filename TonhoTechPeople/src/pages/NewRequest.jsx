import { Fragment, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { People } from './People';
import { RequestService } from '../services/requestService';
import { ProcessService } from '../services/processService';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

function hojeBR() {
  return new Date().toLocaleDateString('pt-BR');
}

function agoraBR() {
  return new Date().toLocaleString('pt-BR');
}

function valorCampo(dados, key) {
  const valor = dados?.[key];
  return valor && String(valor).trim() ? valor : 'Não informado';
}

export function NewRequest({ user, initialProcessId }) {
  const [colaborador, setColaborador] = useState(null);
  const [processId, setProcessId] = useState(initialProcessId || 'cracha');
  const [dados, setDados] = useState({});
  const [created, setCreated] = useState(null);
  const processo = useMemo(() => ProcessService.obter(processId), [processId]);
  const processos = ProcessService.listar();

  function updateField(key, value) {
    setDados(prev => ({ ...prev, [key]: value }));
    setCreated(null);
  }

  async function criar() {
    if (!colaborador) return alert('Selecione um colaborador.');
    const req = await RequestService.criar({ colaborador, tipo: processo.titulo, dados, usuario: user });
    setCreated(req);
  }

  function montarDocumentoHTML() {
    if (!created || !colaborador) return '';

    const camposHtml = processo.campos.map(campo => `
      <tr>
        <th>${campo.label}</th>
        <td>${valorCampo(created.dados || dados, campo.key)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${created.protocolo} - ${processo.titulo}</title>
        <style>
          *{box-sizing:border-box}
          body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f2f5f9;color:#172033}
          .doc{width:900px;max-width:calc(100% - 40px);margin:24px auto;background:#fff;border:1px solid #dce5f2;border-radius:18px;padding:34px}
          .brand{display:flex;align-items:center;gap:14px;border-bottom:3px solid #0F3D75;padding-bottom:18px;margin-bottom:24px}
          .mark{width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#0F3D75,#2D7FF9);color:#fff;display:grid;place-items:center;font-weight:900;font-size:24px;letter-spacing:-2px}
          .brand h1{margin:0;color:#0F3D75;font-size:28px;line-height:1}
          .brand span{display:block;color:#6b7280;font-size:12px;margin-top:5px}
          .title{text-align:center;margin:24px 0}.title h2{margin:0;color:#0F3D75}.title p{margin:6px 0 0;color:#6b7280}
          .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.box{border:1px solid #dce5f2;background:#f8fbff;border-radius:12px;padding:12px}.box span{display:block;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase}.box strong{display:block;color:#0F3D75;margin-top:4px}
          table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #dce5f2;padding:12px;text-align:left;vertical-align:top}th{width:32%;background:#eef5ff;color:#0F3D75}
          .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:70px;text-align:center}.line{border-top:1px solid #172033;padding-top:10px}
          .footer{border-top:1px solid #dce5f2;margin-top:28px;padding-top:14px;color:#6b7280;font-size:12px;display:flex;justify-content:space-between;gap:16px}
          .actions{width:900px;max-width:calc(100% - 40px);margin:20px auto;text-align:right}.actions button{border:0;border-radius:12px;background:#2D7FF9;color:#fff;font-weight:800;padding:12px 18px;cursor:pointer}
          @media print{body{background:#fff}.actions{display:none}.doc{border:0;margin:0;max-width:100%;width:100%;border-radius:0}}
        </style>
      </head>
      <body>
        <div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div>
        <main class="doc">
          <header class="brand">
            <div class="mark">TT</div>
            <div>
              <h1>TONHO TECH People</h1>
              <span>Gestão Inteligente de Pessoas • Software & Business Solutions</span>
            </div>
          </header>

          <section class="title">
            <h2>${processo.titulo}</h2>
            <p>Documento gerado pelo TONHO TECH People</p>
          </section>

          <section class="meta">
            <div class="box"><span>Protocolo</span><strong>${created.protocolo}</strong></div>
            <div class="box"><span>Data</span><strong>${hojeBR()}</strong></div>
            <div class="box"><span>Status</span><strong>${created.status || 'GERADA'}</strong></div>
          </section>

          <table>
            <tbody>
              <tr><th>Colaborador</th><td>${colaborador.nome}</td></tr>
              <tr><th>Matrícula</th><td>${colaborador.matricula || 'Não informado'}</td></tr>
              <tr><th>Cargo</th><td>${colaborador.cargo || 'Não informado'}</td></tr>
              <tr><th>Regional / Folha</th><td>${colaborador.regional || colaborador.folha || 'Não informado'}</td></tr>
              <tr><th>Solicitação</th><td>${processo.titulo}</td></tr>
              ${camposHtml}
              <tr><th>Emitido por</th><td>${user?.nome || user?.usuario || 'Usuário'} • ${user?.perfil || ''} • ${user?.regional_nome || 'MATRIZ'}</td></tr>
              <tr><th>Emitido em</th><td>${agoraBR()}</td></tr>
            </tbody>
          </table>

          <section class="sign">
            <div class="line">Assinatura do Colaborador</div>
            <div class="line">Responsável RH/DP</div>
          </section>

          <footer class="footer">
            <span>Licenciado para Empresa Tonhão Ltda.</span>
            <span>Powered by TONHO TECH</span>
          </footer>
        </main>
      </body>
      </html>
    `;
  }

  function imprimirDocumento() {
    if (!created) return alert('Gere a solicitação primeiro.');
    const win = window.open('', '_blank', 'width=1000,height=800');
    win.document.open();
    win.document.write(montarDocumentoHTML());
    win.document.close();
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

        <div className="request-actions">
          <Button onClick={criar}>Gerar Solicitação</Button>
          {created && <Button variant="ghost" onClick={imprimirDocumento}>Imprimir / Salvar PDF</Button>}
        </div>

        {created && (
          <div className="success-box">
            Solicitação criada. Protocolo: <strong>{created.protocolo}</strong>
          </div>
        )}

        {created && (
          <div className="document-preview">
            <div className="document-preview-header">
              <div className="tt-logo-mini">TT</div>
              <div>
                <strong>TONHO TECH People</strong>
                <span>Pré-visualização do documento</span>
              </div>
            </div>
            <h3>{processo.titulo}</h3>
            <div className="preview-grid">
              <span>Protocolo</span><strong>{created.protocolo}</strong>
              <span>Colaborador</span><strong>{colaborador.nome}</strong>
              <span>Matrícula</span><strong>{colaborador.matricula || 'Não informado'}</strong>
              <span>Regional</span><strong>{colaborador.regional || colaborador.folha || 'Não informado'}</strong>
              {processo.campos.map(campo => (
                <Fragment key={campo.key}>
                  <span>{campo.label}</span><strong>{valorCampo(created.dados || dados, campo.key)}</strong>
                </Fragment>
              ))}
              <span>Emitido por</span><strong>{user?.nome || user?.usuario} • {user?.regional_nome || 'MATRIZ'}</strong>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
