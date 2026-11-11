import { Link } from 'react-router-dom';
import { useSession } from '../session';

export const destinations = [
  { path: '/catalogo', title: 'Catálogo', kicker: 'Encontre o que precisa', description: 'Consulte os equipamentos para o seu dia a dia.', action: 'Ver catálogo', operationsOnly: false },
  { path: '/meus-emprestimos', title: 'Meus empréstimos', kicker: 'Acompanhe seus itens', description: 'Acesse seus empréstimos e os prazos de devolução.', action: 'Ver meus empréstimos', operationsOnly: false },
  { path: '/operacoes', title: 'Operações', kicker: 'Controle de empréstimos', description: 'Acesse a área de acompanhamento dos empréstimos em aberto.', action: 'Ir para Operações', operationsOnly: true },
  { path: '/equipamentos', title: 'Equipamentos', kicker: 'Gestão do acervo', description: 'Acesse a área de cadastro dos equipamentos de TI.', action: 'Ver equipamentos', operationsOnly: true },
] as const;

export default function Home() {
  const { session } = useSession();
  const shortcuts = destinations.filter((item) => !item.operationsOnly || session?.role === 'operacoes');

  return (
    <main className="home-content" id="content">
      <header className="home-heading">
        <p className="section-kicker">Seu ponto de partida</p>
        <h1>Boas-vindas ao EMPREST<span className="brand-accent">.AI</span></h1>
        <p>Os equipamentos de que você precisa. Os empréstimos sob controle.</p>
      </header>
      <section className="home-shortcuts" aria-labelledby="shortcuts-title">
        <div className="section-heading">
          <h2 id="shortcuts-title">Por onde você quer começar?</h2>
          <span>Acesso rápido</span>
        </div>
        <div className="shortcut-grid">
          {shortcuts.map((item, index) => (
            <article className="shortcut-card" key={item.path}>
              <div className="shortcut-topline">
                <span className="section-kicker">{item.kicker}</span>
                <span className="shortcut-number" aria-hidden="true">0{index + 1}</span>
              </div>
              <div className="shortcut-copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <div className="shortcut-action">
                <Link className="btn btn-primary" to={item.path}>{item.action}<span aria-hidden="true"> →</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="home-footer">
        <span>Operações · TI interno</span>
        <span>Até 3 itens por pessoa · Prazo padrão de 14 dias</span>
      </footer>
    </main>
  );
}
