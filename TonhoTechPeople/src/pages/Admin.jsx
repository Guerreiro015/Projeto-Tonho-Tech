import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { UserService } from '../services/userService';
import { RegionalService } from '../services/regionalService';

const emptyForm = {
  nome: '',
  usuario: '',
  perfil: 'SUPORTE',
  pin: '1234',
  regional_nome: 'MATRIZ',
  ativo: true
};

export function Admin({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [u, r] = await Promise.all([UserService.listar(), RegionalService.listar()]);
    setUsuarios(u);
    setRegionais(r);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const ativos = useMemo(() => usuarios.filter(u => u.ativo !== false).length, [usuarios]);
  const suporte = useMemo(() => usuarios.filter(u => u.perfil === 'SUPORTE').length, [usuarios]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    try {
      await UserService.salvar(form);
      setForm(emptyForm);
      setMessage('Usuário salvo com sucesso.');
      await load();
    } catch (err) {
      setMessage(err.message || 'Erro ao salvar usuário.');
    }
  }

  async function toggle(usuario) {
    await UserService.alterarStatus(usuario.usuario, usuario.ativo === false);
    await load();
  }

  if (user.perfil !== 'ADMIN') {
    return <Card title="Acesso restrito"><EmptyState icon="🔒" title="Administração indisponível" message="Apenas administradores podem acessar esta área." /></Card>;
  }

  return (
    <div className="home-stack">
      <section className="welcome-panel compact">
        <div>
          <span className="eyebrow">TONHO TECH Control Center</span>
          <h2>Administração Online</h2>
          <p>Gerencie usuários, perfis e vínculos regionais diretamente no Supabase.</p>
        </div>
      </section>

      <div className="stats-grid">
        <section className="tt-stat"><div className="tt-stat-icon">👤</div><div><span>Usuários</span><strong>{usuarios.length}</strong><small>Total cadastrado</small></div></section>
        <section className="tt-stat tt-stat-green"><div className="tt-stat-icon">✅</div><div><span>Ativos</span><strong>{ativos}</strong><small>Podem acessar</small></div></section>
        <section className="tt-stat tt-stat-orange"><div className="tt-stat-icon">🏢</div><div><span>Suporte</span><strong>{suporte}</strong><small>Usuários regionais</small></div></section>
        <section className="tt-stat tt-stat-purple"><div className="tt-stat-icon">🌎</div><div><span>Regionais</span><strong>{regionais.length}</strong><small>Base Folha</small></div></section>
      </div>

      <div className="grid two admin-grid">
        <Card title="Novo / Atualizar Usuário">
          <form className="admin-form" onSubmit={submit}>
            <label className="tt-field"><span>Nome</span><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" /></label>
            <label className="tt-field"><span>Usuário</span><input value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} placeholder="ex: regional.campinas" /></label>
            <label className="tt-field"><span>Perfil</span><select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}><option value="ADMIN">Administrador</option><option value="RHDP">RH/DP</option><option value="SUPORTE">Suporte Regional</option></select></label>
            <label className="tt-field"><span>PIN</span><input value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} placeholder="PIN" /></label>
            <label className="tt-field full"><span>Regional do Suporte</span><select value={form.regional_nome || 'MATRIZ'} onChange={e => setForm({ ...form, regional_nome: e.target.value })} disabled={form.perfil !== 'SUPORTE'}>{['MATRIZ', ...regionais.map(r => r.nome).filter(Boolean)].map(nome => <option key={nome}>{nome}</option>)}</select></label>
            <div className="form-actions full"><Button type="submit">Salvar Usuário</Button></div>
            {message && <div className={message.includes('sucesso') ? 'success-box full' : 'error-box full'}>{message}</div>}
          </form>
        </Card>

        <Card title="Perfis e Permissões">
          <div className="permission-list">
            <div><Badge tone="blue">ADMIN</Badge><strong>Administração completa</strong><p>Usuários, base, relatórios, processos e solicitações.</p></div>
            <div><Badge tone="green">RH/DP</Badge><strong>Operação da matriz</strong><p>Colaboradores, processos, solicitações e relatórios.</p></div>
            <div><Badge tone="orange">SUPORTE</Badge><strong>Suporte Regional</strong><p>Importa base, faz solicitações e visualiza apenas suas solicitações.</p></div>
          </div>
        </Card>
      </div>

      <Card title="Usuários Cadastrados">
        {loading ? 'Carregando usuários...' : usuarios.length === 0 ? <EmptyState icon="👥" title="Nenhum usuário" message="Cadastre o primeiro usuário para liberar o acesso." /> : (
          <table className="tt-table">
            <thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Regional</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id || u.usuario}>
                  <td>{u.nome}</td>
                  <td>{u.usuario}</td>
                  <td><Badge tone={u.perfil === 'ADMIN' ? 'blue' : u.perfil === 'SUPORTE' ? 'orange' : 'green'}>{u.perfil}</Badge></td>
                  <td>{u.regional_nome || '-'}</td>
                  <td>{u.ativo === false ? <Badge tone="orange">Inativo</Badge> : <Badge tone="green">Ativo</Badge>}</td>
                  <td>{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '-'}</td>
                  <td><button className="table-action" onClick={() => toggle(u)}>{u.ativo === false ? 'Ativar' : 'Inativar'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
