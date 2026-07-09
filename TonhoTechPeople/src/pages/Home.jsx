import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PeopleService } from '../services/peopleService';
import { RequestService } from '../services/requestService';
import { RegionalService } from '../services/regionalService';

export function Home({ user, navigate }) {
  const [metrics, setMetrics] = useState({ colaboradores: 0, solicitacoes: 0, hoje: 0, regionais: 0, ultimas: [] });

  useEffect(() => {
    Promise.all([
      PeopleService.contar(user),
      RequestService.contar(user),
      RequestService.hoje(user),
      user.perfil === 'SUPORTE' ? Promise.resolve(user.regional_nome ? 1 : 0) : RegionalService.contar(),
      RequestService.ultimas(5, user)
    ]).then(([colaboradores, solicitacoes, hoje, regionais, ultimas]) => {
      setMetrics({ colaboradores, solicitacoes, hoje, regionais, ultimas });
    });
  }, []);

  return (
    <div className="home-stack">
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">TONHO TECH People Web</span>
          <h2>Bom trabalho, {user.nome} 👋</h2>
          <p>Gestão inteligente de pessoas, processos e regionais em ambiente cloud.</p>
        </div>
        <div className="welcome-actions">
          <button onClick={() => navigate('Nova Solicitação')}>+ Nova Solicitação</button>
          {user.perfil !== 'SUPORTE' && <button onClick={() => navigate('Colaboradores')}>Pesquisar Colaborador</button>}
        </div>
      </section>

      <div className="stats-grid">
        <StatCard icon="👥" label="Colaboradores" value={metrics.colaboradores} hint="Base online" />
        <StatCard icon="📄" label="Solicitações" value={metrics.solicitacoes} hint="Total geral" tone="green" />
        <StatCard icon="⚡" label="Hoje" value={metrics.hoje} hint="Geradas no dia" tone="orange" />
        <StatCard icon="🏢" label="Regionais" value={metrics.regionais} hint="Coluna Folha" tone="purple" />
      </div>

      <div className="grid two">
        <Card title="Status da Plataforma">
          <div className="status-grid">
            <span><Badge tone="green">Online</Badge> Supabase configurado</span>
            <span><Badge tone="blue">Perfil</Badge> {user.perfil}</span>
            <span><Badge tone="green">Base</Badge> {metrics.colaboradores ? 'Carregada' : 'Aguardando importação'}</span>
            {user.regional_nome && <span><Badge tone="orange">Regional</Badge> {user.regional_nome}</span>}
          </div>
        </Card>

        <Card title="Ações Rápidas">
          <div className="quick-grid">
            <button onClick={() => navigate('Nova Solicitação')}>📝 Nova Solicitação</button>
            {user.perfil !== 'SUPORTE' && <button onClick={() => navigate('Importar Base')}>📥 Importar Base</button>}
            <button onClick={() => navigate('Minhas Solicitações')}>📋 Solicitações</button>
            {user.perfil !== 'SUPORTE' && <button onClick={() => navigate('Relatórios')}>📊 Relatórios</button>}
          </div>
        </Card>
      </div>

      <Card title="Últimas Solicitações Online">
        {metrics.ultimas.length === 0 ? (
          <EmptyState icon="📭" title="Nenhuma solicitação ainda" message="As solicitações geradas aparecerão aqui automaticamente." />
        ) : (
          <div className="activity-list">
            {metrics.ultimas.map(item => (
              <div key={item.id || item.protocolo} className="activity-item">
                <div><strong>{item.tipo}</strong><span>{item.colaborador_nome} • {item.colaborador_matricula}</span></div>
                <div><Badge tone="blue">{item.protocolo}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
