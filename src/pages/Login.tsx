import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
type Role = 'colaborador' | 'operacoes';
export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<Role | null>(null);
  async function go(role: Role) {
    setErr('');
    setBusy(role);
    try {
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';
      const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pwd, expectedRole: role }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(b.detail || 'E-mail ou senha incorretos.'); return; }
      if (b.token) localStorage.setItem('t', b.token);
      nav(b.role === 'operacoes' ? '/operacoes' : '/catalogo');
    } catch { setErr('Sem conexão com o servidor.'); }
    finally { setBusy(null); }
  }
  return (
    <main className="login-page">
      <section className="login-brand" aria-label="EMPREST.AI">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>EMPREST<span className="brand-accent">.AI</span></span>
        </div>
        <div className="login-intro">
          <div className="login-pitch">
            <h1>Empréstimo de equipamentos sem planilha.</h1>
            <p className="login-pitch-lead">Peça um notebook, monitor ou câmera em segundos.</p>
          </div>
          <dl className="login-stats" aria-label="Regras de empréstimo">
            <div><dt>3</dt><dd>itens por pessoa</dd></div>
            <div><dt>14</dt><dd>dias de prazo</dd></div>
            <div><dt>0</dt><dd>linhas para preencher</dd></div>
          </dl>
        </div>
        <footer className="login-footer">Operações · TI interno</footer>
      </section>
      <section className="login-content" aria-labelledby="login-title">
        <form className="login-form" aria-busy={busy !== null} onSubmit={(event) => { event.preventDefault(); void go('colaborador'); }}>
          <header className="login-heading">
            <h2 id="login-title">Entrar</h2>
            <p className="login-lead">Use seu e-mail corporativo.</p>
          </header>
          <div className="login-fields">
            <div className="field">
              <label htmlFor="login-email">E-mail</label>
              <input id="login-email" name="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
            </div>
            <div className="field">
              <label htmlFor="login-password">Senha</label>
              <input id="login-password" name="password" className="input" type="password" autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Sua senha" />
            </div>
          </div>
          <div className="login-actions">
            {err !== '' && <div role="alert" className="login-error">{err}</div>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy !== null}>{busy === 'colaborador' ? 'Entrando…' : 'Entrar'}</button>
            <button type="button" className="btn btn-ghost btn-block" disabled={busy !== null} onClick={() => void go('operacoes')}>{busy === 'operacoes' ? 'Entrando…' : 'Entrar como Operações →'}</button>
          </div>
          <p className="login-note">Cada pessoa vê apenas os próprios empréstimos.</p>
        </form>
      </section>
    </main>
  );
}
