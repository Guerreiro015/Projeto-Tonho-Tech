import { useEffect, useMemo, useState } from 'react';
import { AuditService } from '../services/auditService';

const ACTION_LABELS = {
  LOGIN: 'Login realizado',
  PASSWORD_CHANGED: 'Senha alterada',
  USER_CREATED: 'Usuário criado',
  USER_UPDATED: 'Usuário alterado',
  USER_PASSWORD_RESET: 'Senha redefinida',
  USER_ACTIVATED: 'Usuário ativado',
  USER_DEACTIVATED: 'Usuário desativado'
};

function isoDateInput(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'medium'
  }).format(new Date(value));
}

function actionLabel(action) {
  return ACTION_LABELS[action] || String(action || 'Evento').replaceAll('_', ' ');
}

function detailsText(details) {
  if (!details || typeof details !== 'object') return '—';
  const preferred = ['nome', 'usuario', 'perfil', 'regional', 'status', 'resultado', 'motivo'];
  const entries = Object.entries(details);
  const ordered = [
    ...preferred.flatMap(key => entries.filter(([entryKey]) => entryKey === key)),
    ...entries.filter(([key]) => !preferred.includes(key))
  ];
  if (!ordered.length) return '—';
  return ordered.map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(' • ');
}

export function Audit({ user }) {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [filters, setFilters] = useState({
    from: isoDateInput(thirtyDaysAgo),
    to: isoDateInput(today),
    user: '',
    action: '',
    profile: '',
    regional: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAudit() {
    setLoading(true);
    setError('');
    try {
      const data = await AuditService.listar(filters);
      setEvents(data);
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar a auditoria.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAudit(); }, []);

  const summary = useMemo(() => {
    const todayKey = isoDateInput(new Date());
    const todayEvents = events.filter(item => String(item.criado_em || '').slice(0, 10) === todayKey);
    return {
      total: events.length,
      logins: todayEvents.filter(item => item.acao === 'LOGIN').length,
      userChanges: events.filter(item => ['USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_PASSWORD_RESET'].includes(item.acao)).length,
      actors: new Set(events.map(item => item.ator_auth_id).filter(Boolean)).size
    };
  }, [events]);

  function updateFilter(name, value) {
    setFilters(current => ({ ...current, [name]: value }));
  }

  async function exportCsv() {
    await AuditService.exportarCsv(events, `auditoria-${isoDateInput(new Date())}.csv`);
  }

  if (user?.perfil !== 'ADMIN') {
    return <section className="tt-card"><h3>Acesso restrito</h3><p>Somente o Administrador pode consultar a auditoria.</p></section>;
  }

  return (
    <section className="audit-page">
      <div className="audit-hero">
        <div>
          <span className="eyebrow">CENTRAL ADMINISTRATIVA</span>
          <h2>Auditoria e Acessos</h2>
          <p>Acompanhe logins e alterações administrativas realizadas no sistema.</p>
        </div>
        <button className="tt-btn tt-btn-primary" onClick={exportCsv} disabled={!events.length}>Exportar CSV</button>
      </div>

      <div className="audit-stats">
        <article><span>Eventos no período</span><strong>{summary.total}</strong></article>
        <article><span>Acessos hoje</span><strong>{summary.logins}</strong></article>
        <article><span>Alterações em usuários</span><strong>{summary.userChanges}</strong></article>
        <article><span>Usuários envolvidos</span><strong>{summary.actors}</strong></article>
      </div>

      <div className="tt-card audit-filter-card">
        <div className="audit-filters">
          <label><span>Data inicial</span><input type="date" value={filters.from} onChange={e => updateFilter('from', e.target.value)} /></label>
          <label><span>Data final</span><input type="date" value={filters.to} onChange={e => updateFilter('to', e.target.value)} /></label>
          <label><span>Usuário</span><input placeholder="Nome ou login" value={filters.user} onChange={e => updateFilter('user', e.target.value)} /></label>
          <label><span>Ação</span><select value={filters.action} onChange={e => updateFilter('action', e.target.value)}><option value="">Todas</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Perfil</span><select value={filters.profile} onChange={e => updateFilter('profile', e.target.value)}><option value="">Todos</option><option value="ADMIN">ADMIN</option><option value="RHDP">RH/DP</option><option value="SUPORTE">SUPORTE</option></select></label>
          <label><span>Regional</span><input placeholder="Ex.: Setor Sul" value={filters.regional} onChange={e => updateFilter('regional', e.target.value)} /></label>
        </div>
        <div className="audit-filter-actions">
          <button className="tt-btn tt-btn-ghost audit-clear" onClick={() => setFilters({ from: '', to: '', user: '', action: '', profile: '', regional: '' })}>Limpar</button>
          <button className="tt-btn tt-btn-primary" onClick={loadAudit}>Pesquisar</button>
        </div>
      </div>

      <div className="tt-card audit-table-card">
        <div className="audit-table-heading"><div><h3>Registro de atividades</h3><p>{events.length} evento(s) encontrado(s)</p></div></div>
        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="tt-empty"><strong>Carregando auditoria...</strong></div> : events.length === 0 ? <div className="tt-empty"><div>🛡️</div><strong>Nenhum evento encontrado</strong><span>Ajuste os filtros e pesquise novamente.</span></div> : (
          <div className="tt-table-wrap"><table className="tt-table audit-table"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Detalhes</th><th>Regional</th></tr></thead><tbody>{events.map(item => <tr key={item.id}><td className="nowrap">{formatDateTime(item.criado_em)}</td><td><strong>{item.ator_nome || 'Sistema'}</strong><small>{item.ator_usuario || '—'}</small></td><td><span className={`profile-badge profile-${String(item.ator_perfil || '').toLowerCase()}`}>{item.ator_perfil === 'RHDP' ? 'RH/DP' : item.ator_perfil || '—'}</span></td><td><span className="audit-action-badge">{actionLabel(item.acao)}</span></td><td className="audit-details">{detailsText(item.detalhes)}</td><td>{item.detalhes?.regional || item.detalhes?.regional_nome || (item.ator_perfil === 'SUPORTE' ? 'Regional' : 'Todas')}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </section>
  );
}
