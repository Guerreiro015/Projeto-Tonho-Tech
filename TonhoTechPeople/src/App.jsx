import { useState } from 'react';
import { Login } from './pages/Login';
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
import './styles.css';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('tt_user') || 'null'));
  const [currentPage, setCurrentPage] = useState('Home');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [initialProcessId, setInitialProcessId] = useState(null);

  function login(u) {
    sessionStorage.setItem('tt_user', JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    sessionStorage.removeItem('tt_user');
    setUser(null);
  }

  function navigate(page) {
    setCurrentPage(page);
  }

  function startProcess(processId) {
    setInitialProcessId(processId);
    setCurrentPage('Nova Solicitação');
  }

  if (!user) return <Login onLogin={login} />;

  function renderPage() {
    if (currentPage === 'Home') return <Home user={user} navigate={navigate} />;
    if (currentPage === 'Importar Base') return <ImportBase />;
    if (currentPage === 'Colaboradores') return <People onSelect={(p) => { setSelectedPerson(p); setCurrentPage('Dossiê'); }} />;
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
