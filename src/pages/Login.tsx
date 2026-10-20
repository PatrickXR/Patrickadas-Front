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
    } catch { setErr('Sem conexao com o servidor.'); }
    finally { setBusy(null); }
  }
  return (
    <div className="login-page">
      <div className="login-brand">
        <div style={{ fontWeight: 700, fontSize: 17 }}><span>EMPREST</span><span style={{ color: '#2fb8ac' }}>.AI</span></div>
        <div className="login-intro">
          <h1>Emprestimo de equipamentos sem planilha.</h1>
          <p style={{ opacity: 0.6, fontSize: 16 }}>Peca um notebook, monitor ou camera em segundos.</p>
        </div>
        <div className="login-footer" style={{ fontSize: 12, opacity: 0.4 }}>Operacoes - TI interno</div>
      </div>
      <div className="login-content">
        <div className="login-form">
          <h2 style={{ fontSize: 26, margin: 0 }}>Entrar</h2>
          <p style={{ fontSize: 14, opacity: 0.55 }}>Use seu e-mail corporativo.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" style={{ height: 36, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(233,233,237,0.16)', background: '#232532', color: '#e9e9ed' }} />
            <input value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="senha" style={{ height: 36, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(233,233,237,0.16)', background: '#232532', color: '#e9e9ed' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            {err !== '' && (<div role="alert" style={{ fontSize: 13, color: '#e88b8b', background: 'rgba(200,90,90,0.14)', border: '1px solid rgba(200,90,90,0.40)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>)}
            <button disabled={busy !== null} onClick={() => go('colaborador')} style={{ height: 40, background: 'transparent', border: '1px solid #2fb8ac', color: '#2fb8ac', borderRadius: 8, fontWeight: 600 }}>{busy === 'colaborador' ? 'Entrando...' : 'Entrar'}</button>
            <button disabled={busy !== null} onClick={() => go('operacoes')} style={{ background: 'transparent', border: 'none', color: '#5fcfc4', textAlign: 'left' }}>{busy === 'operacoes' ? 'Entrando...' : 'Entrar como Operacoes'}</button>
          </div>
          <p style={{ fontSize: 12, opacity: 0.55, textAlign: 'center' }}>Cada pessoa ve apenas os proprios emprestimos.</p>
        </div>
      </div>
    </div>
  );
}
