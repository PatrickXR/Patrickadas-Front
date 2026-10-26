import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Home, { destinations } from './pages/Home';
import { SessionProvider, useSession } from './session';

function AppLayout() {
  const { session, signOut } = useSession();
  if (!session) return <Navigate to="/" replace />;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">Pular para o conteúdo</a>
      <header className="app-nav">
        <Link className="brand" to="/home" aria-label="EMPREST.AI — Início">
          <span className="brand-mark" aria-hidden="true" />
          <span>EMPREST<span className="brand-accent">.AI</span></span>
        </Link>
        <nav aria-label="Navegação principal">
          <NavLink to="/home" className="nav-tab">Início</NavLink>
        </nav>
        <div className="nav-account">
          <span className="role-tag">{session.role === 'operacoes' ? 'Operações' : 'Colaborador'}</span>
          <button className="btn btn-ghost" onClick={signOut}>Sair</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function ComingSoon({ title, operationsOnly }: { title: string; operationsOnly: boolean }) {
  const { session } = useSession();
  if (operationsOnly && session?.role !== 'operacoes') return <Navigate to="/home" replace />;

  return (
    <main className="home-content" id="content">
      <header className="home-heading">
        <p className="section-kicker">{title}</p>
        <h1>Em breve</h1>
        <p>Esta área ainda está em desenvolvimento.</p>
      </header>
      <Link className="btn btn-primary" to="/home">Voltar ao Início</Link>
    </main>
  );
}

function App() {
  return (
    <SessionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            {destinations.map((item) => (
              <Route key={item.path} path={item.path} element={<ComingSoon title={item.title} operationsOnly={item.operationsOnly} />} />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SessionProvider>
  );
}
export default App;
