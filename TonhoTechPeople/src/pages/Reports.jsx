import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { RequestService } from '../services/requestService';
import { PeopleService } from '../services/peopleService';
import { RegionalService } from '../services/regionalService';

function groupBy(rows, field) {
  const acc = new Map();
  rows.forEach(row => {
    const key = row[field] || 'Não informado';
    acc.set(key, (acc.get(key) || 0) + 1);
  });
  return [...acc.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
}

function toCsv(rows) {
  const header = ['protocolo', 'colaborador', 'matricula', 'tipo', 'status', 'usuario', 'regional_usuario', 'regional_colaborador', 'data'];
  const lines = rows.map(row => [
    row.protocolo,
    row.colaborador_nome,
    row.colaborador_matricula,
    row.tipo,
    row.status,
    row.usuario,
    row.regional_usuario,
    row.regional_colaborador,
    row.criado_em
  ].map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';'));
  return [header.join(';'), ...lines].join('\n');
}

export function Reports({ user }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ colaboradores: 0, regionais: 0, hoje: 0 });
  const [filter, setFilter] = useState({ regional: 'Todas', tipo: 'Todos' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [solicitacoes, colaboradores, regionais, hoje] = await Promise.all([
        RequestService.listarTodas(500),
        PeopleService.contar(),
        RegionalService.contar(),
        RequestService.hoje()
      ]);
      setRows(solicitacoes);
      setTotals({ colaboradores, regionais, hoje });
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => rows.filter(row => {
    const regionalOk = filter.regional === 'Todas' || row.regional_colaborador === filter.regional || row.regional_usuario === filter.regional;
    const tipoOk = filter.tipo === 'Todos' || row.tipo === filter.tipo;
    return regionalOk && tipoOk;
  }), [rows, filter]);

  const regionais = useMemo(() => ['Todas', ...new Set(rows.flatMap(r => [r.regional_colaborador, r.regional_usuario]).filter(Boolean))].sort(), [rows]);
  const tipos = useMemo(() => ['Todos', ...new Set(rows.map(r => r.tipo).filter(Boolean))].sort(), [rows]);
  const porTipo = useMemo(() => groupBy(filtered, 'tipo'), [filtered]);
  const porRegional = useMemo(() => groupBy(filtered, 'regional_colaborador'), [filtered]);
  const porUsuario = useMemo(() => groupBy(filtered, 'usuario'), [filtered]);

  function exportarCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tonho-tech-people-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (user.perfil === 'SUPORTE') {
    return <Card title="Acesso restrito"><EmptyState icon="🔒" title="Relatórios indisponíveis" message="O perfil Suporte Regional acessa apenas a operação de solicitações." /></Card>;
  }

  return (
    <div className="home-stack">
      <section className="welcome-panel reports-hero">
        <div>
          <span className="eyebrow">TONHO TECH Analytics</span>
          <h2>Relatórios Online</h2>
          <p>Indicadores centralizados diretamente do Supabase.</p>
        </div>
        <button onClick={exportarCsv} disabled={!filtered.length}>Exportar CSV</button>
      </section>

      <div className="stats-grid">
        <StatCard icon="📋" label="Solicitações" value={filtered.length} hint="Resultado filtrado" />
        <StatCard icon="⚡" label="Hoje" value={totals.hoje} hint="Geradas no dia" tone="orange" />
        <StatCard icon="👥" label="Colaboradores" value={totals.colaboradores} hint="Base online" tone="green" />
        <StatCard icon="🏢" label="Regionais" value={totals.regionais} hint="Folha/Regional" tone="purple" />
      </div>

      <Card title="Filtros">
        <div className="filter-row">
          <label>Regional
            <select value={filter.regional} onChange={(e) => setFilter(prev => ({ ...prev, regional: e.target.value }))}>
              {regionais.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Processo
            <select value={filter.tipo} onChange={(e) => setFilter(prev => ({ ...prev, tipo: e.target.value }))}>
              {tipos.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {loading ? <Card title="Carregando">Buscando relatórios...</Card> : (
        <>
          <div className="grid three">
            <Ranking title="Ranking por Processo" rows={porTipo} />
            <Ranking title="Ranking por Regional" rows={porRegional} />
            <Ranking title="Ranking por Usuário" rows={porUsuario} />
          </div>

          <Card title="Últimas Solicitações">
            {filtered.length === 0 ? <EmptyState icon="📭" title="Sem registros" message="Nenhuma solicitação encontrada com os filtros atuais." /> : (
              <table className="tt-table">
                <thead>
                  <tr><th>Protocolo</th><th>Colaborador</th><th>Processo</th><th>Regional</th><th>Usuário</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map(row => (
                    <tr key={row.id || row.protocolo}>
                      <td>{row.protocolo}</td>
                      <td>{row.colaborador_nome}<br/><small>{row.colaborador_matricula}</small></td>
                      <td>{row.tipo}</td>
                      <td>{row.regional_colaborador || '-'}</td>
                      <td>{row.usuario || '-'}</td>
                      <td><Badge tone="blue">{row.status || 'GERADA'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Ranking({ title, rows }) {
  const max = Math.max(...rows.map(r => r.total), 1);
  return (
    <Card title={title}>
      {rows.length === 0 ? <EmptyState icon="📊" title="Sem dados" message="Ainda não há registros." /> : (
        <div className="ranking-list">
          {rows.slice(0, 8).map(row => (
            <div className="ranking-item" key={row.nome}>
              <div><strong>{row.nome}</strong><span>{row.total} solicitações</span></div>
              <div className="ranking-bar"><i style={{ width: `${(row.total / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
