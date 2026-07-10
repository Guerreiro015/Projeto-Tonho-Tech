import { useState } from 'react';
import { AuthService } from '../services/authService';
import { Logo } from '../brand/Logo';
import { Button } from '../components/Button';

export function Login({ onLogin }) {
  const [usuario, setUsuario] = useState(() => localStorage.getItem('tt_last_username') || '');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(Boolean(localStorage.getItem('tt_last_username')));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await AuthService.login(usuario, senha);
      if (lembrar) localStorage.setItem('tt_last_username', usuario.trim().toLowerCase());
      else localStorage.removeItem('tt_last_username');
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit} autoComplete="on">
        <Logo />
        <div className="product-label">People</div>
        <p className="subtitle">Gestão Inteligente de Pessoas</p>
        <div className="license-box">Licenciado para<br/><strong>Empresa Tonhão Ltda.</strong></div>
        <label className="tt-field">
          <span>Usuário</span>
          <input autoFocus autoCapitalize="none" autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Digite seu usuário" />
        </label>
        <label className="tt-field">
          <span>Senha</span>
          <input type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" />
        </label>
        <label className="remember-row"><input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} /> <span>Lembrar meu usuário</span></label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        <small className="login-footer">TONHO TECH • Software & Business Solutions</small>
      </form>
    </div>
  );
}
