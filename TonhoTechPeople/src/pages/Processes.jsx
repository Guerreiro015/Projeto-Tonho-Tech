import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProcessService } from '../services/processService';

export function Processes({ onStart }) {
  const categorias = ProcessService.categorias();
  return (
    <div className="process-page">
      <section className="welcome-panel compact">
        <div>
          <span className="eyebrow">Central de Processos</span>
          <h2>Solicitações organizadas por categoria</h2>
          <p>Escolha um processo para iniciar uma nova solicitação online.</p>
        </div>
      </section>

      {Object.entries(categorias).map(([categoria, processos]) => (
        <Card key={categoria} title={categoria}>
          <div className="process-grid">
            {processos.map(processo => (
              <button key={processo.id} className={`process-card tone-${processo.cor}`} onClick={() => onStart(processo.id)}>
                <div className="process-icon">{processo.icon}</div>
                <div>
                  <strong>{processo.titulo}</strong>
                  <p>{processo.descricao}</p>
                  <Badge tone="blue">Solicitação online</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
