import { useEffect, useState } from "react";
import { CHANNELS } from "../data.js";
import { PRIORITY } from "../engine.js";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const ICONS = {
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  plug: <><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" /></>,
  route: <><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  spark: <><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  back: <><path d="m15 18-6-6 6-6" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
};
export function Icon({ name, size = 18, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...P} style={style} aria-hidden="true">{ICONS[name]}</svg>;
}

export function ChannelBadge({ channel, size = 30 }) {
  const c = CHANNELS[channel] || { short: "?", color: "#94A3B8", label: channel };
  return <span className="ch" title={c.label} style={{ background: c.color, width: size, height: size, fontSize: size < 28 ? 10 : 11 }}>{c.short}</span>;
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.normal;
  return <span className="badge" style={{ background: `${p.color}14`, color: p.color }}>{p.label}</span>;
}

const STATUS = {
  nuevo:    { label: "Nuevo",     bg: "var(--info-bg)", fg: "var(--info)" },
  en_curso: { label: "En curso",  bg: "var(--warn-bg)", fg: "var(--warn)" },
  derivado: { label: "Derivado",  bg: "var(--brand-50)", fg: "var(--brand-600)" },
  resuelto: { label: "Resuelto",  bg: "var(--ok-bg)", fg: "var(--ok)" },
};
export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.nuevo;
  return <span className="badge" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}
export const STATUS_LABELS = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]));

export function scoreColors(score) {
  if (score >= 70) return { bg: "var(--bad-bg)", fg: "var(--bad)" };
  if (score >= 45) return { bg: "var(--warn-bg)", fg: "var(--warn)" };
  return { bg: "var(--brand-50)", fg: "var(--brand-600)" };
}

/** Re-render cada `ms` para que los contadores de SLA avancen solos. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export function ago(ts, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60_000));
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export function slaInfo(c, now = Date.now()) {
  if (c.status === "resuelto") return { text: "Resuelto", color: "var(--ok)" };
  const left = c.slaDueAt - now;
  const total = c.slaDueAt - c.createdAt;
  if (left <= 0) {
    const m = Math.round(-left / 60_000);
    return { text: `Vencido hace ${m < 60 ? `${m} min` : `${Math.round(m / 60)} h`}`, color: "var(--bad)", breached: true };
  }
  const m = Math.round(left / 60_000);
  const text = m < 60 ? `${m} min para responder` : `${Math.round(m / 60)} h para responder`;
  return { text, color: left / total < 0.25 ? "var(--warn)" : "var(--muted)" };
}

export function Modal({ onClose, children, width }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { maxWidth: width } : null}>{children}</div>
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return <button type="button" className={`toggle ${on ? "on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function LogoMark({ size = 30 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" aria-hidden="true"><path d="M12 4.2C11.2 3 9.9 2.4 8.2 2.4 5.9 2.4 4.3 3.6 4.3 5.4c0 1.9 1.5 2.5 3.6 3l.9.2c1.4.3 2 .7 2 1.5 0 .9-.9 1.5-2.3 1.5-1.4 0-2.5-.6-3.1-1.6L3.6 11.2c.9 1.5 2.6 2.4 4.8 2.4 2.6 0 4.3-1.3 4.3-3.3 0-1.8-1.3-2.6-3.6-3.1l-.9-.2c-1.3-.3-1.9-.6-1.9-1.4 0-.8.8-1.3 2-1.3 1.1 0 1.9.4 2.4 1.2z" fill="#fff" /></svg>
    </span>
  );
}
