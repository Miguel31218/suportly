import { useState } from "react";
import { INTEGRATIONS, RUBROS, VOLUMES, CHANNELS } from "../data.js";
import { buildAreas, recommend } from "../engine.js";
import { Icon, Modal, Toggle } from "./ui.jsx";

const LEVEL = {
  esencial:    { label: "Esencial",    bg: "var(--brand)",    fg: "#fff" },
  recomendada: { label: "Recomendada", bg: "var(--brand-50)", fg: "var(--brand-600)" },
  opcional:    { label: "Opcional",    bg: "var(--bg)",       fg: "var(--muted)" },
};
const byId = Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i]));
const iconText = (i) => (i.channel ? CHANNELS[i.channel].short : i.id === "payments" ? "S/" : i.id === "orders" ? "PD" : "✉");

export default function Integrations({ state, update, toast, go }) {
  const [redo, setRedo] = useState(!state.profile);
  const [connecting, setConnecting] = useState(null);

  if (redo) {
    return (
      <Wizard
        initial={state.profile}
        businessName={state.businessName}
        canCancel={!!state.profile}
        onCancel={() => setRedo(false)}
        onApply={(profile, plan) => {
          update((s) => {
            const integrations = { ...s.integrations };
            plan.integrations.forEach((r) => {
              if (integrations[r.id]?.status === "conectada") return;
              integrations[r.id] = { status: r.level === "opcional" ? "sugerida" : "pendiente" };
            });
            plan.skip.forEach((r) => { if (integrations[r.id]?.status !== "conectada") delete integrations[r.id]; });
            const areas = !s.areas.length || s.profile?.rubro !== profile.rubro ? buildAreas(profile.rubro, s.accountId) : s.areas;
            return { ...s, profile, plan, integrations, areas };
          });
          setRedo(false);
          toast("Plan aplicado: conecta las integraciones esenciales");
        }}
      />
    );
  }

  const plan = state.plan;
  const essentials = plan.integrations.filter((r) => r.level === "esencial");
  const doneEss = essentials.filter((r) => state.integrations[r.id]?.status === "conectada").length;
  const pct = essentials.length ? Math.round((doneEss / essentials.length) * 100) : 100;
  const next = plan.integrations.find((r) => state.integrations[r.id]?.status !== "conectada");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Integraciones</h1>
          <p className="muted">Elegidas para {state.businessName} según tu diagnóstico · {RUBROS.find((r) => r.id === state.profile.rubro)?.label}</p>
        </div>
        <button className="btn" onClick={() => setRedo(true)}><Icon name="spark" size={15} />Rehacer diagnóstico</button>
      </div>

      <div className="card pad" style={{ marginBottom: 16 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="grow" style={{ minWidth: 220 }}>
            <b>{doneEss} de {essentials.length} integraciones esenciales conectadas</b>
            <div className="bar" style={{ marginTop: 10, height: 8 }}><i style={{ width: `${pct}%` }} /></div>
          </div>
          {next ? (
            <button className="btn primary" onClick={() => setConnecting(next.id)}>Conectar {byId[next.id].name}<Icon name="arrow" size={14} /></button>
          ) : (
            <button className="btn primary" onClick={() => go("bandeja")}>Todo listo · ir a la bandeja<Icon name="arrow" size={14} /></button>
          )}
        </div>
      </div>

      <div className="label">Recomendadas para ti, en orden</div>
      <div className="grid-int" style={{ marginBottom: 24 }}>
        {plan.integrations.map((r) => {
          const i = byId[r.id];
          const st = state.integrations[r.id]?.status;
          const lv = LEVEL[r.level];
          return (
            <div key={r.id} className="card int">
              <div className="row" style={{ alignItems: "flex-start" }}>
                <span className="int-icon">{iconText(i)}</span>
                <div className="grow">
                  <b style={{ display: "block" }}>{i.name}</b>
                  <span className="row" style={{ gap: 6, marginTop: 4 }}>
                    <span className="badge" style={{ background: lv.bg, color: lv.fg }}>{lv.label}</span>
                    <span className="soft small">{i.kind} · {i.minutes} min</span>
                  </span>
                </div>
              </div>
              <p className="small"><b>Por qué: </b><span className="muted">{r.reason}</span></p>
              <p className="small muted">{i.brings}</p>
              <div style={{ marginTop: "auto" }}>
                {st === "conectada" ? (
                  <div className="row between">
                    <span className="badge" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}><Icon name="check" size={12} />Conectada</span>
                    <button className="btn sm ghost danger" onClick={() => { update((s) => ({ ...s, integrations: { ...s.integrations, [r.id]: { status: "pendiente" } } })); toast(`${i.name} desconectada`); }}>Desconectar</button>
                  </div>
                ) : (
                  <button className={`btn ${r.level === "esencial" ? "primary" : ""}`} style={{ width: "100%" }} onClick={() => setConnecting(r.id)}>Conectar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="matrix" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="section"><h3>Qué automatizar y qué no</h3><p className="muted small" style={{ marginTop: 4 }}>La IA atiende sola lo repetitivo; lo delicado siempre pasa a una persona.</p></div>
          {plan.automate.map((a, idx) => (
            <div key={idx} className="rec">
              <span className="badge" style={{ background: a.auto ? "var(--ok-bg)" : "var(--bad-bg)", color: a.auto ? "var(--ok)" : "var(--bad)", flexShrink: 0, marginTop: 2 }}>{a.auto ? "IA sola" : "Persona"}</span>
              <div><b className="small" style={{ display: "block" }}>{a.what}</b><span className="muted small">{a.how}</span></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section"><h3>No necesitas por ahora</h3><p className="muted small" style={{ marginTop: 4 }}>Menos integraciones = menos ruido. Puedes sumarlas cuando cambie tu negocio.</p></div>
          {plan.skip.length === 0 && <div className="rec muted small">Usas todos los canales disponibles.</div>}
          {plan.skip.map((s) => (
            <div key={s.id} className="rec">
              <span className="int-icon" style={{ width: 30, height: 30, fontSize: 10, opacity: 0.6 }}>{iconText(byId[s.id])}</span>
              <div><b className="small" style={{ display: "block" }}>{byId[s.id].name}</b><span className="muted small">{s.reason}</span></div>
            </div>
          ))}
        </div>
      </div>

      {connecting && (
        <ConnectModal
          integration={byId[connecting]}
          accountId={state.accountId}
          onClose={() => setConnecting(null)}
          onDone={() => {
            update((s) => ({ ...s, integrations: { ...s.integrations, [connecting]: { status: "conectada", at: Date.now() } } }));
            toast(`${byId[connecting].name} conectada`);
            setConnecting(null);
          }}
        />
      )}
    </>
  );
}

function Wizard({ initial, businessName, canCancel, onCancel, onApply }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState(initial || { rubro: "", canales: [], volumen: "", web: false, cobraOnline: false, local: false });
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const toggleCh = (c) => set("canales", p.canales.includes(c) ? p.canales.filter((x) => x !== c) : [...p.canales, c]);
  const canNext = [!!p.rubro, p.canales.length > 0, !!p.volumen, true][step];
  const plan = step === 3 ? recommend(p) : null;

  return (
    <div className="wizard">
      <div className="page-head">
        <div>
          <h1>Diagnóstico de atención</h1>
          <p className="muted">4 preguntas · te decimos qué conectar en {businessName} y qué no</p>
        </div>
        {canCancel && <button className="btn ghost" onClick={onCancel}>Cancelar</button>}
      </div>
      <div className="progress">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>

      <div className="card pad">
        {step === 0 && (
          <>
            <h2 style={{ marginBottom: 14 }}>¿Qué tipo de negocio tienes?</h2>
            <div className="choice-grid">
              {RUBROS.map((r) => <button key={r.id} className={`choice ${p.rubro === r.id ? "on" : ""}`} onClick={() => set("rubro", r.id)}>{r.label}</button>)}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 style={{ marginBottom: 4 }}>¿Por dónde te escriben o reclaman tus clientes?</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>Marca todos los que apliquen.</p>
            <div className="row wrap">
              {Object.entries(CHANNELS).map(([k, v]) => (
                <button key={k} className={`chip-btn ${p.canales.includes(k) ? "on" : ""}`} onClick={() => toggleCh(k)}>
                  {p.canales.includes(k) && <Icon name="check" size={14} />}{v.label}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 style={{ marginBottom: 14 }}>¿Cuántos mensajes recibes al día?</h2>
            <div className="choice-grid" style={{ marginBottom: 20 }}>
              {VOLUMES.map((v) => <button key={v.id} className={`choice ${p.volumen === v.id ? "on" : ""}`} onClick={() => set("volumen", v.id)}>{v.label}</button>)}
            </div>
            <div className="stack" style={{ gap: 14 }}>
              {[["web", "Tengo página web"], ["cobraOnline", "Cobro en línea (Mercado Pago, Yape, tarjeta)"], ["local", "Tengo local físico donde me visitan"]].map(([k, l]) => (
                <div key={k} className="row between"><span style={{ fontWeight: 600 }}>{l}</span><Toggle on={!!p[k]} onChange={(v) => set(k, v)} label={l} /></div>
              ))}
            </div>
          </>
        )}
        {step === 3 && plan && (
          <>
            <h2 style={{ marginBottom: 4 }}>Tu plan recomendado</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>
              {plan.integrations.filter((r) => r.level === "esencial").length} esenciales, {plan.integrations.filter((r) => r.level !== "esencial").length} opcionales y {plan.skip.length} que no necesitas. También creamos las áreas de derivación de tu rubro.
            </p>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              {plan.integrations.map((r, i) => (
                <div key={r.id} className="rec">
                  <span className="score" style={{ width: 26, height: 26, fontSize: 12, background: "var(--brand-50)", color: "var(--brand-600)" }}>{i + 1}</span>
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}><b className="small">{byId[r.id].name}</b><span className="badge" style={{ background: LEVEL[r.level].bg, color: LEVEL[r.level].fg }}>{LEVEL[r.level].label}</span></div>
                    <span className="muted small">{r.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="row between" style={{ marginTop: 22 }}>
          <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="back" size={14} />Atrás</button>
          {step < 3
            ? <button className="btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Siguiente<Icon name="arrow" size={14} /></button>
            : <button className="btn primary" onClick={() => onApply(p, plan)}><Icon name="check" size={14} />Aplicar plan</button>}
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ integration: i, accountId, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const detail = {
    email: `Tu correo de atención: ${accountId}@soporte.suportly.com`,
    web: `<script src="https://widget.suportly.com/w.js" data-negocio="${accountId}"></script>`,
    area_mail: "Los correos de cada área se editan en Derivación.",
  }[i.id];

  const advance = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (step + 1 >= i.steps.length) onDone();
      else setStep(step + 1);
    }, 700);
  };

  return (
    <Modal onClose={busy ? undefined : onClose}>
      <div className="row between">
        <h2>Conectar {i.name}</h2>
        <button className="btn sm ghost" onClick={onClose} disabled={busy} aria-label="Cerrar"><Icon name="x" size={16} /></button>
      </div>
      <p className="muted small" style={{ marginTop: 4 }}>{i.brings}</p>
      <div className="steps">
        {i.steps.map((s, idx) => (
          <div key={idx} className={`step ${idx < step ? "done" : idx === step ? "now" : ""}`}>
            <span className="n">{idx < step ? <Icon name="check" size={13} /> : idx + 1}</span>
            <span className="grow" style={{ fontWeight: 600 }}>{s}</span>
            {idx === step && busy && <span className="spinner" />}
          </div>
        ))}
      </div>
      {detail && <code style={{ display: "block", padding: "10px 12px", borderRadius: 10, background: "var(--bg)", fontSize: 12, wordBreak: "break-all", marginBottom: 16 }}>{detail}</code>}
      <p className="soft small" style={{ marginBottom: 16 }}>Demo: la conexión se simula. En producción este paso abre la autorización real del proveedor.</p>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn primary" onClick={advance} disabled={busy}>{step + 1 >= i.steps.length ? "Finalizar conexión" : "Continuar"}</button>
      </div>
    </Modal>
  );
}
