import { useState } from 'react';
import { AuthService } from '../services/authService';
import { Logo } from '../brand/Logo';
import { Button } from '../components/Button';

export function FirstAccess({ user, onComplete, onLogout }) {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (senha.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (senha !== confirmacao) return setError('As senhas não coincidem.');

    setLoading(true);
    try {
      const profile = await AuthService.trocarSenha(senha);
      onComplete(profile);
    } catch (err) {
      setError(err.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card first-access-card" onSubmit={submit}>
        <Logo />
        <div className="product-label">People</div>
        <p className="subtitle">Primeiro acesso</p>
        <div className="license-box">
          Olá, <strong>{user.nome}</strong>.<br />Crie uma nova senha pessoal para continuar.
        </div>
        <label className="tt-field">
          <span>Nova senha</span>
          <input autoFocus type="password" autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo de 8 caracteres" />
        </label>
        <label className="tt-field">
          <span>Confirmar nova senha</span>
          <input type="password" autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} placeholder="Digite novamente" />
        </label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Definir nova senha'}</Button>
        <button type="button" className="link-button" onClick={onLogout}>Sair e fazer depois</button>
      </form>
    </div>
  );
}
