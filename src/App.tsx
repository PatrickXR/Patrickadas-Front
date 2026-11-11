import { createBrowserRouter, RouterProvider, Navigate, NavLink, Link, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Home, { destinations } from './pages/Home';
import { SessionProvider, useSession } from './session';
import Catalog from './pages/Catalog';
import Loans from './pages/Loans';
import Equipment from './pages/Equipment';
import { useEffect } from 'react';
import { useUiStore } from './ui-store';

function AppLayout() {
  const { session, signOut } = useSession();
  const { toast, dismiss } = useUiStore();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, 2600);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);
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
          <NavLink to="/catalogo" className="nav-tab">Catálogo</NavLink>
          <NavLink to="/meus-emprestimos" className="nav-tab">Meus empréstimos</NavLink>
          {session.role === 'operacoes' && <NavLink to="/operacoes" className="nav-tab">Operações</NavLink>}
          {session.role === 'operacoes' && <NavLink to="/equipamentos" className="nav-tab">Equipamentos</NavLink>}
        </nav>
        <div className="nav-account">
          <span className="role-tag">{session.role === 'operacoes' ? 'Operações' : 'Colaborador'}</span>
          <button className="btn btn-ghost" onClick={signOut}>Sair</button>
        </div>
      </header>
      <Outlet />
      {toast && <div className="flow-toast" role="status">{toast.text}</div>}
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { element: <AppLayout />, children: [
    { path: '/home', element: <Home /> },
    ...destinations.map(item => ({ path: item.path, element: item.path === '/catalogo' ? <Catalog /> : item.path === '/meus-emprestimos' ? <Loans /> : item.path === '/operacoes' ? <Loans operations /> : <Equipment /> })),
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
export default App;
