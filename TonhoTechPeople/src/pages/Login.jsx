import { useEffect, useState } from 'react';
import { AuthService } from '../services/authService';
import { Logo } from '../brand/Logo';
import { Button } from '../components/Button';

export function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [usuario, setUsuario] = useState('admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { AuthService.listarUsuarios().then(setUsers); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await AuthService.login(usuario, pin);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <Logo />
        <div className="product-label">People</div>
        <p className="subtitle">Gestão Inteligente de Pessoas</p>
        <div className="license-box">Licenciado para<br/><strong>Empresa Tonhão Ltda.</strong></div>
        <label className="tt-field"><span>Usuário</span><select value={usuario} onChange={e => setUsuario(e.target.value)}>{users.map(u => <option key={u.usuario} value={u.usuario}>{u.nome} — {u.perfil}</option>)}</select></label>
        <label className="tt-field"><span>PIN</span><input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Digite o PIN" /></label>
        {error && <div className="error-box">{error}</div>}
        <Button type="submit">Entrar</Button>
        <small className="login-footer">TONHO TECH • Software & Business Solutions</small>
      </form>
    </div>
  );
}
