import { Logo } from '../brand/Logo';
import { Button } from '../components/Button';

export function AppLayout({ user, currentPage, setCurrentPage, logout, children }) {
  const adminItems = ['Home', 'Colaboradores', 'Processos', 'Solicitações', 'Relatórios', 'Administração'];
  const rhItems = ['Home', 'Colaboradores', 'Processos', 'Solicitações', 'Relatórios'];
  const suporteItems = ['Home', 'Importar Base', 'Nova Solicitação', 'Minhas Solicitações'];
  const items = user.perfil === 'ADMIN' ? adminItems : user.perfil === 'RHDP' ? rhItems : suporteItems;

  const labels = {
    Home: 'Início',
    Colaboradores: 'Pessoas',
    Processos: 'Processos',
    Solicitações: 'Solicitações',
    Relatórios: 'Relatórios',
    Administração: 'Administração',
    'Importar Base': 'Importar Base',
    'Nova Solicitação': 'Nova Solicitação',
    'Minhas Solicitações': 'Minhas Solicitações'
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo"><Logo /></div>
        <nav>
          {items.map(item => (
            <button key={item} className={currentPage === item ? 'active' : ''} onClick={() => setCurrentPage(item)}>{labels[item] || item}</button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <small>Usuário conectado</small>
          <strong>{user.nome}</strong>
          <span>{user.perfil}{user.regional_nome ? ` • ${user.regional_nome}` : ''}</span>
          <Button variant="ghost" onClick={logout}>Sair</Button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{labels[currentPage] || currentPage}</h1>
            <p>TONHO TECH People • Gestão Inteligente de Pessoas</p>
          </div>
          <div className="cloud-pill">☁️ Supabase Online</div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
