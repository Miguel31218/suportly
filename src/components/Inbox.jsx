import { useMemo, useState } from "react";
import { CHANNELS, SAMPLE_MESSAGES } from "../data.js";
import { applyAutomation, makeCase, PRIORITY, triage, uid } from "../engine.js";
import { ago, ChannelBadge, Icon, Modal, PriorityBadge, scoreColors, slaInfo, StatusBadge, useNow } from "./ui.jsx";

const FILTERS = [
  { id: "abiertos", label: "Abiertos", test: (c) => c.status !== "resuelto" },
  { id: "derivado", label: "Derivados", test: (c) => c.status === "derivado" },
  { id: "resuelto", label: "Resueltos", test: (c) => c.status === "resuelto" },
  { id: "todos", label: "Todos", test: () => true },
];

export default function Inbox({ state, update, toast, go }) {
  const now = useNow();
  const [filter, setFilter] = useState("abiertos");
  const [channel, setChannel] = useState("");
  const [selId, setSelId] = useState(null);
  const [simOpen, setSimOpen] = useState(false);

  const cases = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return state.cases
      .filter(f.test)
      .filter((c) => !channel || c.channel === channel)
      .sort((a, b) => (a.status === "resuelto") - (b.status === "resuelto") || b.triage.score - a.triage.score || a.slaDueAt - b.slaDueAt);
  }, [state.cases, filter, channel]);

  const sel = state.cases.find((c) => c.id === selId) || null;
  const openCount = state.cases.filter((c) => c.status !== "resuelto").length;
  const breached = state.cases.filter((c) => c.status !== "resuelto" && slaInfo(c, now).breached).length;

  const patchCase = (id, fn) => update((s) => ({ ...s, cases: s.cases.map((c) => (c.id === id ? fn(c) : c)) }));

  if (!state.profile) {
    return (
      <div className="card empty" style={{ maxWidth: 560 }}>
        <h2 style={{ marginBottom: 8 }}>Aún no hay canales conectados</h2>
        <p style={{ marginBottom: 18 }}>Haz el diagnóstico de 1 minuto: te decimos qué conectar según tu negocio y los casos empiezan a llegar aquí.</p>
        <button className="btn primary" onClick={() => go("integraciones")}><Icon name="spark" size={16} />Empezar diagnóstico</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bandeja</h1>
          <p className="muted">
            {openCount} abiertos · ordenados por urgencia
            {breached > 0 && <span style={{ color: "var(--bad)", fontWeight: 600 }}> · {breached} con plazo vencido</span>}
          </p>
        </div>
        <button className="btn primary" onClick={() => setSimOpen(true)}><Icon name="plus" size={16} />Simular caso entrante</button>
      </div>

      <div className={`inbox ${sel ? "has-sel" : ""}`}>
        <div className="card list">
          <div className="list-head">
            {FILTERS.map((f) => (
              <button key={f.id} className={`chip-btn ${filter === f.id ? "on" : ""}`} style={{ height: 30, fontSize: 12, padding: "0 12px" }} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
            <select className="input" style={{ height: 30, width: "auto", fontSize: 12, marginLeft: "auto" }} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Filtrar por canal">
              <option value="">Todos los canales</option>
              {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {cases.length === 0 && <div className="empty">No hay casos en esta vista.</div>}
          {cases.map((c) => {
            const sc = scoreColors(c.triage.score);
            const sla = slaInfo(c, now);
            const area = state.areas.find((a) => a.id === c.areaId);
            return (
              <button key={c.id} className={`item ${selId === c.id ? "on" : ""}`} onClick={() => setSelId(c.id)}>
                <span className="score" style={{ background: sc.bg, color: sc.fg }} title="Puntaje de urgencia">{c.triage.score}</span>
                <span className="grow">
                  <span className="row between">
                    <b className="truncate">{c.customer.name}</b>
                    <span className="soft small" style={{ flexShrink: 0 }}>{ago(c.createdAt, now)}</span>
                  </span>
                  <span className="muted small" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: "2px 0 8px" }}>{c.triage.summary}</span>
                  <span className="row wrap" style={{ gap: 6 }}>
                    <ChannelBadge channel={c.channel} size={22} />
                    <PriorityBadge priority={c.triage.priority} />
                    <StatusBadge status={c.status} />
                    {area && <span className="badge" style={{ background: "var(--bg)", color: "var(--muted)" }}>{area.name}</span>}
                  </span>
                  <span className="small" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, color: sla.color, fontWeight: 600 }}>
                    <Icon name="clock" size={12} />{sla.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {sel ? (
          <CaseDetail key={sel.id} c={sel} state={state} now={now} patch={(fn) => patchCase(sel.id, fn)} toast={toast} onBack={() => setSelId(null)} />
        ) : (
          <div className="card detail empty">
            <Icon name="inbox" size={28} style={{ color: "var(--brand-100)" }} />
            <p style={{ marginTop: 8 }}>Elige un caso para ver el análisis de la IA, responder o derivarlo.</p>
          </div>
        )}
      </div>

      {simOpen && (
        <SimulateModal
          state={state}
          onClose={() => setSimOpen(false)}
          onCreated={(c) => {
            update((s) => ({ ...s, cases: [c, ...s.cases] }));
            setSimOpen(false);
            setFilter("todos");
            setChannel("");
            setSelId(c.id);
            const area = state.areas.find((a) => a.id === c.areaId);
            toast(c.status === "resuelto" ? "La IA resolvió el caso sola" : c.status === "derivado" ? `Caso derivado a ${area?.name}` : "Caso nuevo en la bandeja");
          }}
        />
      )}
    </>
  );
}

function CaseDetail({ c, state, now, patch, toast, onBack }) {
  const [reply, setReply] = useState("");
  const [areaSel, setAreaSel] = useState(c.areaId || state.areas[0]?.id || "");
  const area = state.areas.find((a) => a.id === c.areaId);
  const t = c.triage;
  const sla = slaInfo(c, now);
  const parts = [
    ["Prioridad", t.scoreParts.prioridad, 60],
    ["Sentimiento", t.scoreParts.sentimiento, 15],
    ["Cliente", t.scoreParts.cliente, 10],
    ["Canal público", t.scoreParts.publico, 10],
  ];

  const send = () => {
    const text = reply.trim();
    if (!text) return;
    const at = Date.now();
    patch((x) => ({
      ...x,
      messages: [...x.messages, { id: uid("m"), from: "agente", text, at }],
      firstResponseAt: x.firstResponseAt || at,
      status: x.status === "nuevo" ? "en_curso" : x.status,
      events: [...x.events, { at, text: "Respuesta enviada al cliente" }],
    }));
    setReply("");
    toast(`Respuesta enviada por ${CHANNELS[c.channel]?.label}`);
  };

  const derive = () => {
    const a = state.areas.find((x) => x.id === areaSel);
    if (!a) return;
    const at = Date.now();
    patch((x) => ({ ...x, areaId: a.id, status: "derivado", derivedAt: at, events: [...x.events, { at, text: `Derivado a ${a.name} (${a.email}) con link seguro` }] }));
    toast(`Aviso enviado a ${a.email}`);
  };

  const areaAnswers = () => {
    const at = Date.now();
    const msg = `Revisado por ${area?.name}. ${t.category === "pago" ? "Confirmamos el cobro duplicado; el reembolso sale hoy." : t.category === "reclamo_pedido" ? "Reenviamos el pedido completo, llega en 30 minutos." : "Ya contactamos al cliente y quedó solucionado."}`;
    patch((x) => ({ ...x, messages: [...x.messages, { id: uid("m"), from: "area", text: msg, at }], events: [...x.events, { at, text: `${area?.name} respondió desde el link seguro` }] }));
  };

  const setStatus = (status) => {
    const at = Date.now();
    patch((x) => ({ ...x, status, resolvedAt: status === "resuelto" ? at : null, events: [...x.events, { at, text: status === "resuelto" ? "Caso resuelto" : "Caso reabierto" }] }));
    toast(status === "resuelto" ? "Caso resuelto" : "Caso reabierto");
  };

  const who = { cliente: c.customer.name, agente: "Tú", ia: "IA de Suportly", area: area?.name || "Área" };

  return (
    <div className="card detail">
      <div className="detail-head">
        <button className="btn sm ghost back-btn" onClick={onBack} style={{ marginBottom: 8, paddingLeft: 4 }}><Icon name="back" size={14} />Volver</button>
        <div className="row between wrap" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 10 }}>
            <ChannelBadge channel={c.channel} size={36} />
            <div>
              <h2>{c.customer.name} {c.customer.repeat && <span className="badge" style={{ background: "var(--ok-bg)", color: "var(--ok)", verticalAlign: "middle" }}>Recurrente</span>}</h2>
              <p className="muted small">{c.code} · {CHANNELS[c.channel]?.label} · {ago(c.createdAt, now)}</p>
            </div>
          </div>
          <div className="row">
            <StatusBadge status={c.status} />
            {c.status === "resuelto"
              ? <button className="btn sm" onClick={() => setStatus("en_curso")}>Reabrir</button>
              : <button className="btn sm" onClick={() => setStatus("resuelto")}><Icon name="check" size={14} />Resolver</button>}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="label" style={{ margin: 0 }}>Análisis de la IA</div>
          <span className="badge" style={{ background: t.engine === "ia" ? "var(--brand-50)" : "var(--bg)", color: t.engine === "ia" ? "var(--brand-600)" : "var(--muted)" }}>
            <Icon name="spark" size={11} />{t.engine === "ia" ? "GPT-4o mini" : "Motor local"}
          </span>
        </div>
        <p style={{ marginBottom: 12 }}>{t.summary}</p>
        <div className="triage" style={{ marginBottom: 12 }}>
          <div className="stat"><div className="k">Tipo</div><div className="v">{t.categoryLabel}</div></div>
          <div className="stat"><div className="k">Prioridad</div><div className="v" style={{ color: PRIORITY[t.priority].color }}>{PRIORITY[t.priority].label}</div></div>
          <div className="stat"><div className="k">Sentimiento</div><div className="v" style={{ textTransform: "capitalize" }}>{t.sentiment}</div></div>
          <div className="stat"><div className="k">Plazo</div><div className="v" style={{ color: sla.color }}>{sla.text}</div></div>
        </div>
        <div className="row wrap" style={{ gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div className="row between small" style={{ marginBottom: 6 }}><b>Urgencia {t.score}/100</b></div>
            {parts.map(([k, v, max]) => (
              <div key={k} className="small" style={{ marginBottom: 6 }}>
                <div className="row between muted"><span>{k}</span><span>+{v}</span></div>
                <div className="bar"><i style={{ width: `${(v / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <b className="small">Por qué</b>
            <ul className="reasons" style={{ marginTop: 6 }}>{t.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        </div>
      </div>

      <div className="convo">
        {c.messages.map((m) => (
          <div key={m.id} className={`msg ${m.from === "agente" ? "out" : m.from === "ia" ? "ia" : ""}`} style={m.from === "area" ? { borderColor: "var(--warn)", background: "var(--warn-bg)" } : null}>
            <div>{m.text}</div>
            <div className="meta">{who[m.from]} · {ago(m.at, now)}</div>
          </div>
        ))}
      </div>

      {c.status !== "resuelto" && (
        <div className="section">
          <div className="row between" style={{ marginBottom: 8 }}>
            <div className="label" style={{ margin: 0 }}>Responder al cliente</div>
            <button className="btn sm ghost" onClick={() => setReply(t.suggestedReply)}><Icon name="spark" size={13} />Usar respuesta sugerida</button>
          </div>
          <textarea className="input" placeholder="Escribe tu respuesta…" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn primary" disabled={!reply.trim()} onClick={send}><Icon name="send" size={14} />Enviar por {CHANNELS[c.channel]?.label}</button>
          </div>
        </div>
      )}

      <div className="section">
        <div className="label">Derivación</div>
        {c.status === "derivado" && area ? (
          <div className="row between wrap" style={{ gap: 10 }}>
            <p className="small">Lo tiene <b>{area.name}</b> · aviso enviado a {area.email} con un link seguro (sin login).</p>
            <button className="btn sm" onClick={areaAnswers}>Simular respuesta del área</button>
          </div>
        ) : (
          <div className="row wrap" style={{ gap: 8 }}>
            <select className="input" style={{ flex: "1 1 180px", width: "auto" }} value={areaSel} onChange={(e) => setAreaSel(e.target.value)} aria-label="Área">
              {state.areas.map((a) => <option key={a.id} value={a.id}>{a.name}{a.id === t.areaId ? " (sugerida por IA)" : ""}</option>)}
            </select>
            <button className="btn" disabled={!areaSel || c.status === "resuelto"} onClick={derive}><Icon name="arrow" size={14} />Derivar al área</button>
          </div>
        )}
      </div>

      <div className="section">
        <div className="label">Historial</div>
        <div className="timeline">
          {[...c.events].reverse().map((e, i) => <div key={i}><span><b style={{ color: "var(--text)", fontWeight: 600 }}>{ago(e.at, now)}</b> · {e.text}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function SimulateModal({ state, onClose, onCreated }) {
  const samples = SAMPLE_MESSAGES[state.profile?.rubro] || [];
  const connected = Object.keys(CHANNELS).filter((k) => state.integrations[k]?.status === "conectada");
  const [channel, setChannel] = useState(connected[0] || "whatsapp");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const usable = samples.filter((s) => connected.includes(s.channel));
  const pick = (s) => { setChannel(s.channel); setName(s.name); setText(s.text); };

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const customerName = name.trim() || "Cliente";
    const isRepeat = state.cases.some((c) => c.customer.name.toLowerCase() === customerName.toLowerCase());
    const ctx = { areas: state.areas, businessName: state.businessName };
    const [tr] = await Promise.all([
      triage({ text, channel, customerName, isRepeat }, ctx),
      new Promise((r) => setTimeout(r, 900)), // deja ver el paso de análisis
    ]);
    const now = Date.now();
    const c = applyAutomation(makeCase({ channel, name: customerName, text, createdAt: now, isRepeat }, tr), state.settings, state.areas, now);
    onCreated(c);
  };

  return (
    <Modal onClose={busy ? undefined : onClose}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <h2>Simular caso entrante</h2>
        <button className="btn sm ghost" onClick={onClose} disabled={busy} aria-label="Cerrar"><Icon name="x" size={16} /></button>
      </div>
      <p className="muted small" style={{ marginBottom: 16 }}>Así llega un mensaje real: la IA lo clasifica, calcula la urgencia y aplica tus reglas de derivación.</p>

      {usable.length > 0 && (
        <>
          <div className="label">Ejemplos de tu rubro</div>
          <div className="stack" style={{ gap: 6, marginBottom: 16 }}>
            {usable.map((s, i) => (
              <button key={i} className="acct" style={{ padding: "8px 10px", alignItems: "flex-start" }} onClick={() => pick(s)} disabled={busy}>
                <ChannelBadge channel={s.channel} size={22} />
                <span className="small grow" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.text}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="row wrap" style={{ gap: 10, marginBottom: 10 }}>
        <label className="field" style={{ flex: "1 1 160px" }}>Canal
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)} disabled={busy}>
            {Object.entries(CHANNELS).map(([k, v]) => (
              <option key={k} value={k} disabled={!connected.includes(k)}>{v.label}{connected.includes(k) ? "" : " (no conectado)"}</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ flex: "1 1 160px" }}>Cliente
          <input className="input" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </label>
      </div>
      <label className="field">Mensaje
        <textarea className="input" placeholder="Escribe lo que enviaría el cliente…" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
      </label>

      <div className="row between" style={{ marginTop: 16 }}>
        <span className="small muted">
          Acuse automático {state.settings.autoAck ? "activado" : "apagado"} · derivación automática {state.settings.autoDerive ? "activada" : "apagada"}
        </span>
        <button className="btn primary" onClick={submit} disabled={!text.trim() || busy || !connected.includes(channel)}>
          {busy ? <><span className="spinner" />Analizando con IA…</> : <><Icon name="send" size={14} />Enviar mensaje</>}
        </button>
      </div>
    </Modal>
  );
}
