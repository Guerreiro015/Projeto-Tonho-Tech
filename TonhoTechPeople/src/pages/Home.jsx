import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PeopleService } from '../services/peopleService';
import { RequestService } from '../services/requestService';
import { RegionalService } from '../services/regionalService';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

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
  }, [user]);

  const isSupport = user.perfil === 'SUPORTE';
  const scope = isSupport ? (user.regional_nome || 'Regional não vinculada') : 'Todas as regionais';

  return (
    <div className="home-stack">
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">TONHO TECH People Web</span>
          <h2>{greeting()}, {user.nome} 👋</h2>
          <p>{isSupport ? `Operação autorizada para a Regional ${scope}.` : 'Gestão central de pessoas, processos e regionais em ambiente cloud.'}</p>
          <div className="welcome-scope"><strong>Escopo de acesso:</strong> {scope}</div>
        </div>
        <div className="welcome-actions">
          <button onClick={() => navigate('Nova Solicitação')}>+ Nova Solicitação</button>
          <button onClick={() => navigate('Colaboradores')}>Pesquisar Colaborador</button>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard icon="👥" label="Colaboradores" value={metrics.colaboradores} hint={isSupport ? scope : 'Base online'} />
        <StatCard icon="📄" label="Solicitações" value={metrics.solicitacoes} hint={isSupport ? 'Da regional' : 'Total geral'} tone="green" />
        <StatCard icon="⚡" label="Hoje" value={metrics.hoje} hint="Geradas no dia" tone="orange" />
        <StatCard icon="🏢" label={isSupport ? 'Regional' : 'Regionais'} value={isSupport ? scope : metrics.regionais} hint={isSupport ? 'Acesso autorizado' : 'Coluna Folha'} tone="purple" />
      </div>

      <div className="grid two">
        <Card title="Status da Plataforma">
          <div className="status-grid">
            <span><Badge tone="green">Online</Badge> Supabase configurado</span>
            <span><Badge tone="blue">Perfil</Badge> {user.perfil === 'RHDP' ? 'RH/DP' : user.perfil}</span>
            <span><Badge tone="green">Base</Badge> {metrics.colaboradores ? 'Carregada' : 'Aguardando importação'}</span>
            <span><Badge tone="orange">Escopo</Badge> {scope}</span>
          </div>
        </Card>

        <Card title="Ações Rápidas">
          <div className="quick-grid">
            <button onClick={() => navigate('Nova Solicitação')}>📝 Nova Solicitação</button>
            {!isSupport && <button onClick={() => navigate('Importar Base')}>📥 Importar Base</button>}
            <button onClick={() => navigate(isSupport ? 'Minhas Solicitações' : 'Solicitações')}>📋 Solicitações</button>
            {!isSupport && <button onClick={() => navigate('Relatórios')}>📊 Relatórios</button>}
          </div>
        </Card>
      </div>

      <Card title={isSupport ? `Últimas Solicitações — ${scope}` : 'Últimas Solicitações Online'}>
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
