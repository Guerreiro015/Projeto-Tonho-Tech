import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { UserService } from '../services/userService';
import { RegionalService } from '../services/regionalService';

const emptyForm = {
  id: '', auth_id: '', nome: '', usuario: '', perfil: 'RHDP', senha: '', regional_nome: '', ativo: true, primeiro_acesso: true
};

function profileLabel(perfil) {
  if (perfil === 'ADMIN') return 'Administrador';
  if (perfil === 'RHDP') return 'RH/DP';
  return 'Suporte Regional';
}

export function Admin({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [credentialModal, setCredentialModal] = useState(null);

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

  function resetCreateForm() {
    setForm(emptyForm);
    setMessage('');
  }

  function openEdit(usuario) {
    setEditingUser({
      id: usuario.id || '',
      auth_id: usuario.auth_id || '',
      nome: usuario.nome || '',
      usuario: usuario.usuario || '',
      perfil: usuario.perfil || 'RHDP',
      senha: '',
      regional_nome: usuario.regional_nome || '',
      ativo: usuario.ativo !== false,
      primeiro_acesso: usuario.primeiro_acesso !== false
    });
  }

  async function createUser(e) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    const senhaInicial = form.senha;
    try {
      await UserService.salvar(form);
      setCredentialModal({
        title: 'Usuário criado com sucesso',
        nome: form.nome,
        usuario: form.usuario.trim().toLowerCase(),
        senha: senhaInicial,
        perfil: profileLabel(form.perfil),
        regional: form.perfil === 'SUPORTE' ? form.regional_nome : 'Todas'
      });
      resetCreateForm();
      await load();
    } catch (err) {
      setMessage(err.message || 'Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(e) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await UserService.salvar(editingUser);
      setEditingUser(null);
      setMessage('Usuário atualizado com sucesso.');
      await load();
    } catch (err) {
      setMessage(err.message || 'Erro ao atualizar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(usuario) {
    if (usuario.auth_id === user.auth_id) {
      setMessage('O Administrador conectado não pode desativar a própria conta.');
      return;
    }
    try {
      await UserService.alterarStatus(usuario, usuario.ativo === false);
      setMessage(usuario.ativo === false ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.');
      await load();
    } catch (err) {
      setMessage(err.message || 'Não foi possível alterar o status.');
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    try {
      await UserService.redefinirSenha(passwordModal, newPassword);
      setCredentialModal({
        title: 'Senha temporária redefinida',
        nome: passwordModal.nome,
        usuario: passwordModal.usuario,
        senha: newPassword,
        perfil: profileLabel(passwordModal.perfil),
        regional: passwordModal.regional_nome || 'Todas'
      });
      setPasswordModal(null);
      setNewPassword('');
      setMessage('Senha redefinida. O usuário deverá trocá-la no próximo acesso.');
    } catch (err) {
      setMessage(err.message || 'Não foi possível redefinir a senha.');
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Informação copiada.');
    } catch {
      setMessage('Não foi possível copiar automaticamente.');
    }
  }

  if (user.perfil !== 'ADMIN') {
    return <Card title="Acesso restrito"><EmptyState icon="🔒" title="Administração indisponível" message="Apenas administradores podem gerenciar usuários, senhas e permissões." /></Card>;
  }

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
        <Card title="Cadastrar Usuário">
          <form className="admin-form" onSubmit={createUser}>
            <label className="tt-field"><span>Nome completo</span><input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></label>
            <label className="tt-field"><span>Nome de usuário</span><input required autoCapitalize="none" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} placeholder="ex: joao.silva" /></label>
            <label className="tt-field"><span>Perfil</span><select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value, regional_nome: e.target.value === 'SUPORTE' ? form.regional_nome : '' })}><option value="RHDP">RH/DP</option><option value="SUPORTE">Suporte Regional</option></select></label>
            <label className="tt-field"><span>Senha inicial</span><input type="password" autoComplete="new-password" required value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
            {form.perfil === 'SUPORTE' && <label className="tt-field full"><span>Regional autorizada</span><select required value={form.regional_nome} onChange={e => setForm({ ...form, regional_nome: e.target.value })}><option value="">Selecione...</option>{regionais.filter(r => r.ativo !== false && r.nome).map(r => <option key={r.id || r.nome} value={r.nome}>{r.nome}</option>)}</select></label>}
            <label className="remember-row full"><input type="checkbox" checked={form.primeiro_acesso} onChange={e => setForm({ ...form, primeiro_acesso: e.target.checked })} /> <span>Exigir troca de senha no primeiro acesso</span></label>
            <div className="form-actions full"><button type="button" className="table-action" onClick={resetCreateForm}>Limpar</button><Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar Usuário'}</Button></div>
            {message && <div className={message.includes('sucesso') || message.includes('copiada') ? 'success-box full' : 'error-box full'}>{message}</div>}
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
            {usuarios.map(u => <tr key={u.id}><td>{u.nome}</td><td>{u.usuario}</td><td><Badge tone={u.perfil === 'ADMIN' ? 'blue' : u.perfil === 'SUPORTE' ? 'orange' : 'green'}>{u.perfil === 'RHDP' ? 'RH/DP' : u.perfil}</Badge></td><td>{u.regional_nome || 'Todas'}</td><td>{u.ativo === false ? <Badge tone="orange">Inativo</Badge> : <Badge tone="green">Ativo</Badge>}</td><td>{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : '-'}</td><td className="table-actions"><button className="table-action" onClick={() => openEdit(u)}>Editar</button><button className="table-action" onClick={() => { setPasswordModal(u); setNewPassword(''); }}>Redefinir senha</button><button className="table-action" disabled={u.auth_id === user.auth_id} onClick={() => toggle(u)}>{u.ativo === false ? 'Ativar' : 'Desativar'}</button></td></tr>)}
          </tbody></table></div>
        )}
      </Card>

      {editingUser && <div className="modal-backdrop"><form className="modal-card modal-card-wide" onSubmit={updateUser}><h3>Editar Usuário</h3><p>Atualize os dados de {editingUser.nome}.</p><div className="admin-form"><label className="tt-field"><span>Nome completo</span><input required value={editingUser.nome} onChange={e => setEditingUser({ ...editingUser, nome: e.target.value })} /></label><label className="tt-field"><span>Nome de usuário</span><input required value={editingUser.usuario} onChange={e => setEditingUser({ ...editingUser, usuario: e.target.value })} /></label><label className="tt-field"><span>Perfil</span><select value={editingUser.perfil} onChange={e => setEditingUser({ ...editingUser, perfil: e.target.value, regional_nome: e.target.value === 'SUPORTE' ? editingUser.regional_nome : '' })}><option value="ADMIN">Administrador</option><option value="RHDP">RH/DP</option><option value="SUPORTE">Suporte Regional</option></select></label><label className="tt-field"><span>Status</span><select value={String(editingUser.ativo)} onChange={e => setEditingUser({ ...editingUser, ativo: e.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>{editingUser.perfil === 'SUPORTE' && <label className="tt-field full"><span>Regional autorizada</span><select required value={editingUser.regional_nome} onChange={e => setEditingUser({ ...editingUser, regional_nome: e.target.value })}><option value="">Selecione...</option>{regionais.filter(r => r.ativo !== false && r.nome).map(r => <option key={r.id || r.nome} value={r.nome}>{r.nome}</option>)}</select></label>}</div><div className="modal-actions"><button type="button" className="table-action" onClick={() => setEditingUser(null)}>Cancelar</button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button></div></form></div>}

      {passwordModal && <div className="modal-backdrop"><form className="modal-card" onSubmit={resetPassword}><h3>Redefinir senha</h3><p>{passwordModal.nome} • {passwordModal.usuario}</p><label className="tt-field"><span>Nova senha temporária</span><input autoFocus type="password" minLength="8" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" /></label><div className="modal-actions"><button type="button" className="table-action" onClick={() => setPasswordModal(null)}>Cancelar</button><Button type="submit">Salvar senha temporária</Button></div></form></div>}

      {credentialModal && <div className="modal-backdrop"><div className="modal-card credential-card"><div className="credential-success">✓</div><h3>{credentialModal.title}</h3><p>Entregue estas credenciais de forma segura. A senha deverá ser alterada no primeiro acesso.</p><div className="credential-grid"><span>Nome</span><strong>{credentialModal.nome}</strong><span>Usuário</span><div><strong>{credentialModal.usuario}</strong><button type="button" className="copy-button" onClick={() => copyText(credentialModal.usuario)}>Copiar</button></div><span>Senha temporária</span><div><strong className="credential-password">{credentialModal.senha}</strong><button type="button" className="copy-button" onClick={() => copyText(credentialModal.senha)}>Copiar</button></div><span>Perfil</span><strong>{credentialModal.perfil}</strong><span>Regional</span><strong>{credentialModal.regional}</strong></div><div className="modal-actions"><Button type="button" onClick={() => setCredentialModal(null)}>Concluir</Button></div></div></div>}
    </div>
  );
}
