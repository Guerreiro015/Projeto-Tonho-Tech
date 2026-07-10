import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { FirstAccess } from './pages/FirstAccess';
import { Home } from './pages/Home';
import { ImportBase } from './pages/ImportBase';
import { People } from './pages/People';
import { NewRequest } from './pages/NewRequest';
import { Requests } from './pages/Requests';
import { Processes } from './pages/Processes';
import { Dossie } from './pages/Dossie';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';
import { AppLayout } from './layouts/AppLayout';
import { AuthService } from './services/authService';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [currentPage, setCurrentPage] = useState('Home');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [initialProcessId, setInitialProcessId] = useState(null);

  useEffect(() => {
    let mounted = true;
    AuthService.restoreSession().then(profile => {
      if (mounted) { setUser(profile); setBooting(false); }
    });
    const { data: listener } = AuthService.onAuthStateChange(profile => {
      if (mounted) setUser(profile);
    });
    return () => { mounted = false; listener?.subscription?.unsubscribe(); };
  }, []);

  async function logout() {
    await AuthService.logout();
    setUser(null);
    setCurrentPage('Home');
  }

  function navigate(page) { setCurrentPage(page); }
  function startProcess(processId) { setInitialProcessId(processId); setCurrentPage('Nova Solicitação'); }

  if (booting) return <div className="app-loading"><div className="loading-mark">TT</div><strong>TONHO TECH People</strong><span>Validando sessão segura...</span></div>;
  if (!user) return <Login onLogin={setUser} />;
  if (user.primeiro_acesso) return <FirstAccess user={user} onComplete={setUser} onLogout={logout} />;

  function renderPage() {
    if (currentPage === 'Home') return <Home user={user} navigate={navigate} />;
    if (currentPage === 'Importar Base') return user.perfil === 'SUPORTE' ? <Placeholder title="Acesso restrito" message="O perfil Suporte Regional não possui permissão para carregar a base." /> : <ImportBase user={user} />;
    if (currentPage === 'Colaboradores') return <People user={user} onSelect={(p) => { setSelectedPerson(p); setCurrentPage('Dossiê'); }} />;
    if (currentPage === 'Processos') return <Processes onStart={startProcess} />;
    if (currentPage === 'Nova Solicitação') return <NewRequest user={user} initialProcessId={initialProcessId} />;
    if (currentPage === 'Minhas Solicitações' || currentPage === 'Solicitações') return <Requests user={user} />;
    if (currentPage === 'Dossiê') return <Dossie person={selectedPerson} onNewRequest={() => setCurrentPage('Nova Solicitação')} />;
    if (currentPage === 'Relatórios') return <Reports user={user} />;
    if (currentPage === 'Administração') return <Admin user={user} />;
    return <Placeholder title={currentPage} />;
  }

  return <AppLayout user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} logout={logout}>{renderPage()}</AppLayout>;
}

function Placeholder({ title, message = 'Módulo em preparação para a arquitetura Web.' }) {
  return <section className="tt-card"><h3>{title}</h3><p>{message}</p></section>;
}
