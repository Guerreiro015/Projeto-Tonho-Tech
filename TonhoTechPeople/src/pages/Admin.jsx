import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { UserService } from '../services/userService';
import { RegionalService } from '../services/regionalService';

const emptyForm = {
  id: '', auth_id: '', nome: '', usuario: '', perfil: 'SUPORTE', senha: '', regional_nome: '', ativo: true, primeiro_acesso: true
};

export function Admin({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([UserService.listar(), RegionalService.listar()]);
      setUsuarios(u);
      setRegionais(r);
    } catch (err) {
      setMessage(err.message || 'Não foi possível carregar a administração.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const ativos = useMemo(() => usuarios.filter(u => u.ativo !== false).length, [usuarios]);
  const suporte = useMemo(() => usuarios.filter(u => u.perfil === 'SUPORTE').length, [usuarios]);

  function resetForm() { setForm(emptyForm); setEditing(false); setMessage(''); }

  function editUser(usuario) {
    setForm({
      id: usuario.id || '', auth_id: usuario.auth_id || '', nome: usuario.nome || '', usuario: usuario.usuario || '',
      perfil: usuario.perfil || 'SUPORTE', senha: '', regional_nome: usuario.regional_nome || '', ativo: usuario.ativo !== false,
      primeiro_acesso: usuario.primeiro_acesso !== false
    });
    setEditing(true);
    setMessage('Editando cadastro. Deixe a senha vazia para mantê-la sem alteração.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault(); setMessage(''); setSaving(true);
    try {
      await UserService.salvar(form);
      setForm(emptyForm); setEditing(false);
      setMessage(editing ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso. Entregue as credenciais de forma segura.');
      await load();
    } catch (err) { setMessage(err.message || 'Erro ao salvar usuário.'); }
    finally { setSaving(false); }
  }

  async function toggle(usuario) {
    try { await UserService.alterarStatus(usuario, usuario.ativo === false); await load(); }
    catch (err) { setMessage(err.message || 'Não foi possível alterar o status.'); }
  }

  async function resetPassword(e) {
    e.preventDefault();
    try {
      await UserService.redefinirSenha(passwordModal, newPassword);
      setPasswordModal(null); setNewPassword('');
      setMessage('Senha redefinida. O usuário deverá usar a nova senha no próximo acesso.');
    } catch (err) { setMessage(err.message || 'Não foi possível redefinir a senha.'); }
  }

  if (user.perfil !== 'ADMIN') return <Card title="Acesso restrito"><EmptyState icon="🔒" title="Administração indisponível" message="Apenas administradores podem gerenciar usuários, senhas e permissões." /></Card>;

  return (
    <div className="home-stack">
      <section className="welcome-panel compact"><div><span className="eyebrow">TONHO TECH Control Center</span><h2>Usuários e Acessos</h2><p>Somente o Administrador cria contas, define senhas, perfis, regionais e bloqueios.</p></div></section>

      <div className="stats-grid">
        <section className="tt-stat"><div className="tt-stat-icon">👤</div><div><span>Usuários</span><strong>{usuarios.length}</strong><small>Total cadastrado</small></div></section>
        <section className="tt-stat tt-stat-green"><div className="tt-stat-icon">✅</div><div><span>Ativos</span><strong>{ativos}</strong><small>Podem acessar</small></div></section>
        <section className="tt-stat tt-stat-orange"><div className="tt-stat-icon">🏢</div><div><span>Suporte</span><strong>{suporte}</strong><small>Vinculados a regionais</small></div></section>
        <section className="tt-stat tt-stat-purple"><div className="tt-stat-icon">🌎</div><div><span>Regionais</span><strong>{regionais.length}</strong><small>Disponíveis</small></div></section>
      </div>

      <div className="grid two admin-grid">
        <Card title={editing ? 'Editar Usuário' : 'Cadastrar Usuário'}>
          <form className="admin-form" onSubmit={submit}>
            <label className="tt-field"><span>Nome completo</span><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></label>
            <label className="tt-field"><span>Nome de usuário</span><input required autoCapitalize="none" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} placeholder="ex: regional.campinas" /></label>
            <label className="tt-field"><span>Perfil</span><select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value, regional_nome: e.target.value === 'SUPORTE' ? form.regional_nome : '' })}><option value="ADMIN">Administrador</option><option value="RHDP">RH/DP</option><option value="SUPORTE">Suporte Regional</option></select></label>
            <label className="tt-field"><span>{editing ? 'Nova senha (opcional)' : 'Senha inicial'}</span><input type="password" autoComplete="new-password" required={!editing} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
            <label className="tt-field"><span>Status</span><select value={String(form.ativo)} onChange={e => setForm({ ...form, ativo: e.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
            <label className="tt-field"><span>Regional autorizada</span><select required={form.perfil === 'SUPORTE'} value={form.regional_nome} onChange={e => setForm({ ...form, regional_nome: e.target.value })} disabled={form.perfil !== 'SUPORTE'}><option value="">Selecione...</option>{regionais.filter(r => r.ativo !== false && r.nome).map(r => <option key={r.id || r.nome} value={r.nome}>{r.nome}</option>)}</select></label>
            <label className="remember-row full"><input type="checkbox" checked={form.primeiro_acesso} onChange={e => setForm({ ...form, primeiro_acesso: e.target.checked })} /> <span>Marcar senha como inicial</span></label>
            <div className="form-actions full">{editing && <button type="button" className="table-action" onClick={resetForm}>Cancelar</button>}<Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Atualizar Usuário' : 'Criar Usuário'}</Button></div>
            {message && <div className={message.includes('sucesso') || message.includes('criado') || message.includes('redefinida') ? 'success-box full' : message.includes('Editando') ? 'info-box full' : 'error-box full'}>{message}</div>}
          </form>
        </Card>

        <Card title="Regra de Acesso">
          <div className="permission-list">
            <div><Badge tone="blue">ADMIN</Badge><strong>Controle exclusivo de usuários</strong><p>Cria contas, redefine senhas, altera perfil, regional, status e permissões.</p></div>
            <div><Badge tone="green">RH/DP</Badge><strong>Operação central</strong><p>Consulta todas as regionais e pode importar a base, mas não gerencia usuários.</p></div>
            <div><Badge tone="orange">SUPORTE</Badge><strong>Acesso regional</strong><p>Entra com usuário e senha e o banco libera somente os dados autorizados para sua regional.</p></div>
          </div>
        </Card>
      </div>

      <Card title="Usuários Cadastrados">
        {loading ? 'Carregando usuários...' : usuarios.length === 0 ? <EmptyState icon="👥" title="Nenhum usuário" message="Cadastre o primeiro usuário." /> : (
          <div className="tt-table-wrap"><table className="tt-table"><thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Regional</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>
            {usuarios.map(u => <tr key={u.id}><td>{u.nome}</td><td>{u.usuario}</td><td><Badge tone={u.perfil === 'ADMIN' ? 'blue' : u.perfil === 'SUPORTE' ? 'orange' : 'green'}>{u.perfil}</Badge></td><td>{u.regional_nome || 'Todas'}</td><td>{u.ativo === false ? <Badge tone="orange">Inativo</Badge> : <Badge tone="green">Ativo</Badge>}</td><td>{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '-'}</td><td className="table-actions"><button className="table-action" onClick={() => editUser(u)}>Editar</button><button className="table-action" onClick={() => { setPasswordModal(u); setNewPassword(''); }}>Redefinir senha</button><button className="table-action" onClick={() => toggle(u)}>{u.ativo === false ? 'Ativar' : 'Inativar'}</button></td></tr>)}
          </tbody></table></div>
        )}
      </Card>

      {passwordModal && <div className="modal-backdrop"><form className="modal-card" onSubmit={resetPassword}><h3>Redefinir senha</h3><p>{passwordModal.nome} • {passwordModal.usuario}</p><label className="tt-field"><span>Nova senha</span><input autoFocus type="password" minLength="8" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><div className="modal-actions"><button type="button" className="table-action" onClick={() => setPasswordModal(null)}>Cancelar</button><Button type="submit">Salvar nova senha</Button></div></form></div>}
    </div>
  );
}
