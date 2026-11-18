import { useCallback, useEffect, useMemo, useState } from "react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./data.js";
import { seedAccount } from "./engine.js";
import { Icon, LogoMark } from "./components/ui.jsx";
import Inbox from "./components/Inbox.jsx";
import Integrations from "./components/Integrations.jsx";
import Routing from "./components/Routing.jsx";
import Metrics from "./components/Metrics.jsx";

const KEY = "suportly:v1";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado: la demo sigue en memoria */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

function loadAccount(id) {
  return read(`${KEY}:acct:${id}`) || seedAccount(id);
}

export default function App() {
  const [session, setSession] = useState(() => read(`${KEY}:session`));
  const [state, setState] = useState(() => (session ? loadAccount(session.id) : null));

  useEffect(() => { if (state) write(`${KEY}:acct:${state.accountId}`, state); }, [state]);

  const login = (id) => {
    const s = { id };
    write(`${KEY}:session`, s);
    setSession(s);
    setState(loadAccount(id));
  };
  const logout = () => { drop(`${KEY}:session`); setSession(null); setState(null); };
  const resetDemo = () => {
    if (!state) return;
    drop(`${KEY}:acct:${state.accountId}`);
    setState(seedAccount(state.accountId));
  };

  if (!session || !state) return <Login onLogin={login} />;
  return <Shell state={state} setState={setState} onLogout={logout} onReset={resetDemo} />;
}

function Login({ onLogin }) {
  const [sel, setSel] = useState(DEMO_ACCOUNTS[0].id);
  const [pass, setPass] = useState(DEMO_PASSWORD);
  const [err, setErr] = useState("");
  const acc = DEMO_ACCOUNTS.find((a) => a.id === sel);

  const submit = (e) => {
    e.preventDefault();
    if (pass !== DEMO_PASSWORD) { setErr("Contraseña incorrecta. En la demo es " + DEMO_PASSWORD + "."); return; }
    onLogin(sel);
  };

  return (
    <div className="login">
      <form className="login-box card pad stack" onSubmit={submit} style={{ gap: 16, padding: 28 }}>
        <div className="row" style={{ gap: 10 }}>
          <LogoMark size={34} />
          <div>
            <h1 style={{ fontSize: 19 }}>Suportly</h1>
            <p className="muted small">Atención centralizada con IA</p>
          </div>
        </div>
        <div>
          <div className="label">Elige un negocio de la demo</div>
          <div className="stack" style={{ gap: 8 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button type="button" key={a.id} className={`acct ${sel === a.id ? "on" : ""}`} onClick={() => { setSel(a.id); setErr(""); }}>
                <span className="avatar" style={a.preset ? null : { background: "#fff", color: "var(--brand)", border: "1.5px dashed var(--brand-100)" }}>{a.initials}</span>
                <span className="grow">
                  <b style={{ display: "block" }}>{a.name}</b>
                  <span className="muted small">{a.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <label className="field">Correo
          <input className="input" value={acc.email} readOnly />
        </label>
        <label className="field">Contraseña
          <input className="input" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} />
        </label>
        {err && <p className="small" style={{ color: "var(--bad)" }}>{err}</p>}
        <button className="btn primary" style={{ height: 44 }}>Entrar</button>
        <p className="soft small" style={{ textAlign: "center" }}>Demo de clase · los datos se guardan solo en este navegador</p>
      </form>
    </div>
  );
}

const PAGES = [
  { id: "bandeja", label: "Bandeja", icon: "inbox" },
  { id: "integraciones", label: "Integraciones", icon: "plug" },
  { id: "derivacion", label: "Derivación", icon: "route" },
  { id: "metricas", label: "Métricas", icon: "chart" },
];

function Shell({ state, setState, onLogout, onReset }) {
  const [page, setPage] = useState(state.profile ? "bandeja" : "integraciones");
  const [toasts, setToasts] = useState([]);
  const acc = DEMO_ACCOUNTS.find((a) => a.id === state.accountId);

  const toast = useCallback((text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const update = useCallback((fn) => setState((s) => fn(s)), [setState]);

  const openCount = useMemo(() => state.cases.filter((c) => c.status !== "resuelto").length, [state.cases]);
  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }); };

  const props = { state, update, toast, go };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><LogoMark /><b>Suportly</b></div>
        {PAGES.map((p) => (
          <button key={p.id} className={`nav ${page === p.id ? "on" : ""}`} onClick={() => go(p.id)}>
            <Icon name={p.icon} />{p.label}
            {p.id === "bandeja" && openCount > 0 && <span className="count">{openCount}</span>}
          </button>
        ))}
        <div className="side-foot stack" style={{ gap: 10 }}>
          <div className="row">
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{acc?.initials}</span>
            <div className="grow">
              <b className="truncate" style={{ display: "block", fontSize: 13 }}>{state.businessName}</b>
              <span className="soft small truncate" style={{ display: "block" }}>{acc?.email}</span>
            </div>
          </div>
          <div className="row">
            <button className="btn sm ghost" onClick={onReset} title="Volver a los datos iniciales"><Icon name="reset" size={14} />Reiniciar</button>
            <button className="btn sm ghost" onClick={onLogout}><Icon name="out" size={14} />Salir</button>
          </div>
        </div>
      </aside>

      <main className="main">
        {page === "bandeja" && <Inbox {...props} />}
        {page === "integraciones" && <Integrations {...props} />}
        {page === "derivacion" && <Routing {...props} />}
        {page === "metricas" && <Metrics {...props} />}
      </main>

      <nav className="mobile-nav">
        {PAGES.map((p) => (
          <button key={p.id} className={page === p.id ? "on" : ""} onClick={() => go(p.id)}>
            <Icon name={p.icon} size={20} />{p.label}
          </button>
        ))}
        <button onClick={onLogout}><Icon name="out" size={20} />Salir</button>
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
    </div>
  );
}
