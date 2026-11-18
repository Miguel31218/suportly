import { CHANNELS } from "../data.js";
import { slaInfo, useNow } from "./ui.jsx";

const fmtMin = (m) => (m == null ? "—" : m < 1 ? "< 1 min" : m < 60 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`);

export default function Metrics({ state }) {
  const now = useNow();
  const cs = state.cases;
  const open = cs.filter((c) => c.status !== "resuelto");
  const breached = open.filter((c) => slaInfo(c, now).breached).length;
  const responded = cs.filter((c) => c.firstResponseAt);
  const avgFirst = responded.length ? responded.reduce((s, c) => s + (c.firstResponseAt - c.createdAt), 0) / responded.length / 60_000 : null;
  const resolved = cs.filter((c) => c.status === "resuelto");
  const inSla = resolved.filter((c) => c.resolvedAt <= c.slaDueAt).length;
  const byAI = cs.filter((c) => c.events.some((e) => /IA respondió sola|automáticamente/.test(e.text))).length;

  const count = (key) => {
    const m = {};
    cs.forEach((c) => { const k = key(c); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const byChannel = count((c) => CHANNELS[c.channel]?.label);
  const byArea = count((c) => state.areas.find((a) => a.id === c.areaId)?.name);
  const byType = count((c) => c.triage.categoryLabel);

  const kpis = [
    ["Casos abiertos", open.length, breached ? `${breached} con plazo vencido` : "Todos dentro del plazo", breached ? "var(--bad)" : "var(--ok)"],
    ["Primera respuesta", fmtMin(avgFirst), "Promedio", "var(--muted)"],
    ["Resueltos a tiempo", resolved.length ? `${Math.round((inSla / resolved.length) * 100)}%` : "—", `${resolved.length} resueltos`, "var(--muted)"],
    ["Automatizados", cs.length ? `${Math.round((byAI / cs.length) * 100)}%` : "—", "Resueltos o derivados sin intervención", "var(--muted)"],
  ];

  return (
    <>
      <div className="page-head">
        <div><h1>Métricas</h1><p className="muted">Cómo va la atención de {state.businessName}</p></div>
      </div>
      {cs.length === 0 ? (
        <div className="card empty">Aún no hay casos. Simula uno desde la bandeja.</div>
      ) : (
        <>
          <div className="kpis">
            {kpis.map(([k, v, sub, col]) => (
              <div key={k} className="card kpi">
                <div className="muted small" style={{ fontWeight: 600 }}>{k}</div>
                <div className="v">{v}</div>
                <div className="small" style={{ color: col, fontWeight: 600 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div className="charts">
            <Bars title="Casos por canal" rows={byChannel} />
            <Bars title="Casos por área" rows={byArea} />
            <Bars title="Tipos de caso" rows={byType} />
          </div>
        </>
      )}
    </>
  );
}

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="card pad">
      <h3 style={{ marginBottom: 14 }}>{title}</h3>
      {rows.map(([k, v]) => (
        <div key={k} className="hbar">
          <span className="truncate muted">{k}</span>
          <span className="track"><i style={{ width: `${(v / max) * 100}%` }} /></span>
          <b style={{ textAlign: "right" }}>{v}</b>
        </div>
      ))}
    </div>
  );
}
