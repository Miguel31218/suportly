import { useState } from "react";
import { PRIORITY, triageLocal, uid } from "../engine.js";
import { Icon, PriorityBadge, Toggle } from "./ui.jsx";

export default function Routing({ state, update, toast, go }) {
  const [test, setTest] = useState("Me cobraron dos veces y nadie responde, voy a poner una denuncia");

  if (!state.profile) {
    return (
      <div className="card empty" style={{ maxWidth: 560 }}>
        <h2 style={{ marginBottom: 8 }}>Primero el diagnóstico</h2>
        <p style={{ marginBottom: 18 }}>Las áreas de derivación se crean según tu rubro.</p>
        <button className="btn primary" onClick={() => go("integraciones")}>Ir al diagnóstico</button>
      </div>
    );
  }

  const setSetting = (k, v) => update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));
  const patchArea = (id, patch) => update((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const removeArea = (id) => {
    if (state.areas.length <= 1) { toast("Debe quedar al menos un área"); return; }
    update((s) => ({ ...s, areas: s.areas.filter((a) => a.id !== id) }));
  };
  const addArea = () => update((s) => ({ ...s, areas: [...s.areas, { id: uid("area"), name: "Nueva área", email: `area@${s.accountId}.pe`, keywords: [] }] }));

  const result = test.trim() ? triageLocal({ text: test, channel: "whatsapp", customerName: "Cliente" }, { areas: state.areas, businessName: state.businessName }) : null;
  const resultArea = result && state.areas.find((a) => a.id === result.areaId);
  const autoDerives = result && state.settings.autoDerive && ["urgente", "alta"].includes(result.priority);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Derivación</h1>
          <p className="muted">Reglas para que cada caso llegue solo al área correcta</p>
        </div>
        <button className="btn" onClick={addArea}><Icon name="plus" size={15} />Agregar área</button>
      </div>

      <div className="matrix" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="section"><h3>Automático</h3></div>
          <div className="rec" style={{ alignItems: "center" }}>
            <div className="grow"><b className="small" style={{ display: "block" }}>Acuse inmediato con IA</b><span className="muted small">Responde al instante. Si es una consulta simple, la IA la resuelve sola.</span></div>
            <Toggle on={state.settings.autoAck} onChange={(v) => setSetting("autoAck", v)} label="Acuse inmediato" />
          </div>
          <div className="rec" style={{ alignItems: "center" }}>
            <div className="grow"><b className="small" style={{ display: "block" }}>Derivar solos los urgentes y altos</b><span className="muted small">Se envían al área con link seguro sin esperar a que alguien los abra.</span></div>
            <Toggle on={state.settings.autoDerive} onChange={(v) => setSetting("autoDerive", v)} label="Derivación automática" />
          </div>
          <div className="section" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="label">Plazos de respuesta (SLA)</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {Object.entries(PRIORITY).map(([k, p]) => (
                <span key={k} className="row" style={{ gap: 6, padding: "6px 10px", borderRadius: 10, background: "var(--bg)" }}>
                  <PriorityBadge priority={k} /><b className="small">{p.slaHours < 24 ? `${p.slaHours} h` : `${p.slaHours / 24} d`}</b>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section"><h3>Probar una regla</h3><p className="muted small" style={{ marginTop: 4 }}>Escribe un mensaje y mira a dónde iría.</p></div>
          <div className="section">
            <textarea className="input" value={test} onChange={(e) => setTest(e.target.value)} aria-label="Mensaje de prueba" />
            {result && (
              <div className="stack" style={{ gap: 8, marginTop: 12 }}>
                <div className="row wrap" style={{ gap: 6 }}>
                  <PriorityBadge priority={result.priority} />
                  <span className="badge" style={{ background: "var(--bg)", color: "var(--muted)" }}>{result.categoryLabel}</span>
                  <span className="badge" style={{ background: "var(--bg)", color: "var(--muted)" }}>Urgencia {result.score}</span>
                </div>
                <p className="small"><b>Va a:</b> {resultArea?.name || "—"} {autoDerives ? <span style={{ color: "var(--brand-600)", fontWeight: 600 }}>· se deriva solo</span> : <span className="muted">· queda en la bandeja</span>}</p>
                <ul className="reasons">{result.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="label">Áreas ({state.areas.length})</div>
      <div className="grid-int">
        {state.areas.map((a) => <AreaCard key={a.id} a={a} patch={(p) => patchArea(a.id, p)} remove={() => removeArea(a.id)} />)}
      </div>
    </>
  );
}

function AreaCard({ a, patch, remove }) {
  const [kw, setKw] = useState("");
  const add = () => {
    const k = kw.trim().toLowerCase();
    if (k && !a.keywords.includes(k)) patch({ keywords: [...a.keywords, k] });
    setKw("");
  };
  return (
    <div className="card area">
      <div className="row">
        <input className="input" style={{ fontWeight: 700 }} value={a.name} onChange={(e) => patch({ name: e.target.value })} aria-label="Nombre del área" />
        <button className="btn sm ghost danger" onClick={remove} aria-label={`Eliminar ${a.name}`}><Icon name="x" size={14} /></button>
      </div>
      <label className="field">Correo que recibe los casos
        <input className="input" type="email" value={a.email} onChange={(e) => patch({ email: e.target.value })} />
      </label>
      <div>
        <div className="label" style={{ marginBottom: 6 }}>Palabras que la traen aquí</div>
        <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>
          {a.keywords.length === 0 && <span className="soft small">Sin palabras: recibe lo que la IA le asigne por tipo de caso.</span>}
          {a.keywords.map((k) => (
            <span key={k} className="kw">{k}<button onClick={() => patch({ keywords: a.keywords.filter((x) => x !== k) })} aria-label={`Quitar ${k}`}>✕</button></span>
          ))}
        </div>
        <div className="row">
          <input className="input" style={{ height: 34 }} placeholder="Agregar palabra" value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="btn sm" onClick={add} disabled={!kw.trim()}>Agregar</button>
        </div>
      </div>
    </div>
  );
}
