// Motor de la demo: triaje de casos, recomendación de integraciones y estado inicial.
// Todo es determinista para que la demo funcione sin clave de IA; /api/triage lo mejora si hay clave.
import { AREA_PRESETS, CHANNELS, DEMO_ACCOUNTS, INTEGRATIONS, SAMPLE_MESSAGES } from "./data.js";

// ───────────────────────────── Triaje ─────────────────────────────

export const CATEGORIES = {
  legal:             { label: "Riesgo legal o fraude", priority: "urgente", hints: ["administración", "admin"] },
  pago:              { label: "Problema de pago",      priority: "alta",    hints: ["pago", "caja"] },
  reclamo_pedido:    { label: "Reclamo de pedido",     priority: "alta",    hints: ["delivery", "logística", "logistica", "cocina"] },
  cambio_devolucion: { label: "Cambio o garantía",     priority: "normal",  hints: ["cambio", "garantía"] },
  atencion:          { label: "Queja de atención",     priority: "alta",    hints: ["atención", "atencion", "administración"] },
  agenda:            { label: "Cita o reserva",        priority: "normal",  hints: ["agenda"] },
  venta:             { label: "Consulta de compra",    priority: "normal",  hints: ["ventas"] },
  consulta:          { label: "Consulta general",      priority: "baja",    hints: [] },
};

const CATEGORY_RULES = [
  ["legal",             ["estafa", "denuncia", "indecopi", "libro de reclamaciones", "abogado", "fraude", "robo"]],
  ["pago",              ["cobraron", "cobro", "doble", "reembolso", "yape", "plin", "tarjeta", "devuelvan mi dinero", "boleta"]],
  ["reclamo_pedido",    ["no llega", "no llegó", "no llego", "nunca me llegó", "demora", "frío", "frio", "incompleto", "equivocado", "mal estado", "sin las", "medio pollo", "nunca enviaron", "repartidor"]],
  ["cambio_devolucion", ["cambio", "cambiarlo", "devolución", "devolucion", "no me queda", "garantía", "garantia", "despegó", "defectuoso", "roto"]],
  ["atencion",          ["me trataron", "mala atención", "mala atencion", "nadie atiende", "esperé", "espere", "trato"]],
  ["agenda",            ["cita", "reprogramar", "turno", "reserva"]],
  ["venta",             ["cuánto", "cuanto", "precio", "stock", "disponible", "cotización", "cotizacion", "por mayor", "delivery a", "envíos a", "envios a", "combo"]],
];

const NEGATIVE = ["pésimo", "pesimo", "fatal", "horrible", "decepción", "decepcion", "nunca", "no vuelvo", "estafa", "exijo", "molesto", "indignado", "1 estrella", "2 estrellas", "frío", "frio", "todavía no", "ya van"];
const POSITIVE = ["gracias", "excelente", "genial", "me encantó", "me encanto", "buenísimo"];

export const PRIORITY = {
  urgente: { label: "Urgente", base: 60, slaHours: 1,  color: "#DC2626" },
  alta:    { label: "Alta",    base: 45, slaHours: 4,  color: "#EA580C" },
  normal:  { label: "Normal",  base: 25, slaHours: 24, color: "#7558FE" },
  baja:    { label: "Baja",    base: 10, slaHours: 72, color: "#64748B" },
};

const norm = (s) => String(s || "").toLowerCase();
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";

function pickArea(areas, text, category) {
  const t = norm(text);
  // 0) un riesgo legal o fraude siempre va al área responsable, aunque el mensaje mencione pagos o pedidos
  if (category === "legal") {
    const a = areas.find((x) => CATEGORIES.legal.hints.some((h) => norm(x.name).includes(h)));
    if (a) return { area: a, why: `Riesgo legal → siempre a ${a.name}` };
  }
  // 1) palabra clave configurada en el área (la regla del negocio manda)
  for (const a of areas) {
    const kw = (a.keywords || []).find((k) => k && t.includes(norm(k)));
    if (kw) return { area: a, why: `Palabra "${kw}" → área ${a.name}` };
  }
  // 2) área sugerida por la categoría
  const hints = CATEGORIES[category]?.hints || [];
  for (const h of hints) {
    const a = areas.find((x) => norm(x.name).includes(h));
    if (a) return { area: a, why: `${CATEGORIES[category].label} → área ${a.name}` };
  }
  // 3) área por defecto (la primera)
  return { area: areas[0] || null, why: areas[0] ? `Sin coincidencias → área por defecto ${areas[0].name}` : "Sin áreas configuradas" };
}

const REPLIES = {
  legal:             (n, b) => `Hola ${n}, lamentamos mucho lo ocurrido. Tu caso ya está con el equipo de administración de ${b} y lo revisamos con prioridad. Te escribimos en menos de una hora con una solución.`,
  pago:              (n, b) => `Hola ${n}, gracias por avisarnos. Ya derivamos tu caso al área de pagos de ${b} para verificar el cobro. Si se confirma un cobro de más, te devolvemos el monto y te enviamos el comprobante.`,
  reclamo_pedido:    (n, b) => `Hola ${n}, disculpa el inconveniente con tu pedido. Ya lo estamos revisando con el equipo de ${b} y te confirmamos en unos minutos cómo lo solucionamos.`,
  cambio_devolucion: (n, b) => `Hola ${n}, claro que te ayudamos. Para gestionar el cambio o la garantía, envíanos tu número de pedido y una foto del producto. El área encargada de ${b} te responde hoy.`,
  atencion:          (n, b) => `Hola ${n}, sentimos mucho tu experiencia. No es la atención que queremos dar en ${b}; el responsable ya tiene tu caso y te contactará hoy.`,
  agenda:            (n, b) => `Hola ${n}, con gusto te ayudamos con tu cita. Ya pasamos tu solicitud a agenda de ${b} y te confirmamos el nuevo horario en breve.`,
  venta:             (n, b) => `Hola ${n}, gracias por escribir a ${b}. Te paso la información que necesitas en un momento; si deseas, también te comparto el catálogo con precios y disponibilidad.`,
  consulta:          (n, b) => `Hola ${n}, gracias por escribir a ${b}. Ya revisamos tu mensaje y te respondemos en breve.`,
};

/** Triaje local: categoría, prioridad, sentimiento, puntaje explicable, área, resumen y respuesta sugerida. */
export function triageLocal({ text, channel, customerName, isRepeat }, ctx) {
  const t = norm(text);
  const reasons = [];

  let category = "consulta";
  let matched = null;
  for (const [cat, words] of CATEGORY_RULES) {
    const w = words.find((x) => t.includes(x));
    if (w) { category = cat; matched = w; break; }
  }
  if (matched) reasons.push(`Detectó "${matched}" → ${CATEGORIES[category].label}`);

  const negHits = NEGATIVE.filter((w) => t.includes(w)).length;
  const posHits = POSITIVE.filter((w) => t.includes(w)).length;
  const shouting = /!!+/.test(text || "") || /[A-ZÁÉÍÓÚ]{6,}/.test(text || "");
  const sentiment = negHits + (shouting ? 1 : 0) >= 1 && negHits >= posHits ? "negativo" : posHits > 0 ? "positivo" : "neutral";

  let priority = CATEGORIES[category].priority;
  // Un enojo fuerte en un caso "normal" sube a "alta".
  if (priority === "normal" && sentiment === "negativo" && negHits >= 2) {
    priority = "alta";
    reasons.push("Cliente muy molesto → sube a prioridad alta");
  }

  const ch = CHANNELS[channel] || {};
  const score = {
    prioridad: PRIORITY[priority].base,
    sentimiento: sentiment === "negativo" ? 15 : sentiment === "neutral" ? 5 : 0,
    cliente: isRepeat ? 10 : 0,
    publico: ch.public ? 10 : 0,
  };
  if (ch.public) reasons.push(`${ch.label} es público → +10 por riesgo de reputación`);
  if (isRepeat) reasons.push("Cliente recurrente → +10");
  const total = Math.min(100, Object.values(score).reduce((a, b) => a + b, 0));

  const { area, why } = pickArea(ctx.areas || [], text, category);
  reasons.push(why);

  const snippet = String(text || "").replace(/\s+/g, " ").trim();
  const summary = `${CATEGORIES[category].label}${sentiment === "negativo" ? " (cliente molesto)" : ""}: ${snippet.length > 110 ? snippet.slice(0, 107) + "…" : snippet}`;

  return {
    engine: "local",
    category,
    categoryLabel: CATEGORIES[category].label,
    priority,
    sentiment,
    score: total,
    scoreParts: score,
    areaId: area?.id || null,
    summary,
    suggestedReply: REPLIES[category](firstName(customerName) || "", ctx.businessName || "nuestro equipo"),
    reasons,
    automatable: ["venta", "consulta", "agenda"].includes(category),
  };
}

/** Intenta la IA real (función de Vercel). Si no hay clave o falla, usa el motor local. */
export async function triage(input, ctx) {
  const local = triageLocal(input, ctx);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        text: input.text, channel: input.channel, customerName: input.customerName,
        business: ctx.businessName, areas: (ctx.areas || []).map((a) => ({ id: a.id, name: a.name })),
      }),
    });
    clearTimeout(timer);
    if (!r.ok) return local;
    const ai = await r.json();
    if (!ai || !CATEGORIES[ai.category] || !PRIORITY[ai.priority]) return local;
    const area = (ctx.areas || []).find((a) => a.id === ai.area_id);
    // Mantiene el puntaje explicable del motor local, recalculado con la prioridad que dio la IA.
    const parts = { ...local.scoreParts, prioridad: PRIORITY[ai.priority].base, sentimiento: ai.sentiment === "negativo" ? 15 : ai.sentiment === "neutral" ? 5 : 0 };
    return {
      ...local,
      engine: "ia",
      category: ai.category,
      categoryLabel: CATEGORIES[ai.category].label,
      priority: ai.priority,
      sentiment: ["negativo", "neutral", "positivo"].includes(ai.sentiment) ? ai.sentiment : local.sentiment,
      scoreParts: parts,
      score: Math.min(100, Object.values(parts).reduce((a, b) => a + b, 0)),
      areaId: area ? area.id : local.areaId,
      summary: String(ai.summary || local.summary).slice(0, 240),
      suggestedReply: String(ai.suggested_reply || local.suggestedReply).slice(0, 600),
      reasons: Array.isArray(ai.reasons) && ai.reasons.length ? ai.reasons.slice(0, 3).map(String) : local.reasons,
      automatable: ["venta", "consulta", "agenda"].includes(ai.category),
    };
  } catch {
    return local;
  }
}

// ──────────────────────── Recomendación de integraciones ────────────────────────

/**
 * Según el perfil del negocio decide qué conectar (y en qué orden), qué no hace falta,
 * y qué conviene automatizar o dejar a una persona.
 */
export function recommend(profile) {
  const { rubro, canales = [], volumen, web, cobraOnline, local } = profile;
  const uses = (c) => canales.includes(c);
  const out = [];
  const add = (id, level, reason) => out.push({ id, level, reason });
  const skip = [];

  if (uses("whatsapp") || rubro === "restaurante") add("whatsapp", "esencial", "Es por donde más te escriben; sin esto la mayoría de casos no entra a la bandeja.");
  else skip.push({ id: "whatsapp", reason: "No lo usas como canal de atención." });

  if (uses("instagram")) add("instagram", volumen === "bajo" ? "recomendada" : "esencial", "Tus clientes también preguntan por DM; así no se pierden entre dos apps.");
  else skip.push({ id: "instagram", reason: "No atiendes por DM de Instagram." });

  if (uses("comments")) add("comments", "esencial", "Un reclamo público sin respuesta daña la marca; la IA lo detecta y le sube la prioridad.");
  else add("comments", "opcional", "Si publicas en redes, te avisa cuando alguien se queja en un post.");

  if (uses("email") || rubro === "ecommerce" || volumen === "alto") add("email", rubro === "ecommerce" || uses("email") ? "esencial" : "recomendada", "Reclamos formales, comprobantes y pagos suelen llegar por correo.");
  else skip.push({ id: "email", reason: "Con tu volumen, el correo no aporta casos nuevos por ahora." });

  if (web || uses("web")) add("web", "recomendada", "Atiende a quien visita tu web sin que salga a buscar tu WhatsApp.");
  else skip.push({ id: "web", reason: "No tienes web; conéctalo cuando la tengas." });

  if (local || uses("reviews")) add("reviews", uses("reviews") ? "esencial" : "recomendada", "Las reseñas de 1–2 estrellas deciden si alguien nuevo te visita; responderlas rápido las neutraliza.");
  else skip.push({ id: "reviews", reason: "Sin local físico, las reseñas de Google pesan poco." });

  if (cobraOnline) add("payments", "recomendada", "Los reclamos de cobro se verifican solos contra el pago real.");
  else skip.push({ id: "payments", reason: "No cobras en línea; los pagos se revisan en caja." });

  if (rubro === "ecommerce" || rubro === "restaurante") add("orders", "esencial", "La pregunta más repetida es \"¿dónde está mi pedido?\"; con esto la IA la responde sola.");
  else add("orders", "opcional", "Útil si vendes con pedidos y entregas.");

  add("area_mail", "esencial", "Es lo que permite derivar: cada área recibe su caso sin crear cuenta.");

  const rank = { esencial: 0, recomendada: 1, opcional: 2 };
  out.sort((a, b) => rank[a.level] - rank[b.level]);

  const automate = [
    { what: "Precios, stock, horarios y zonas de reparto", how: "La IA responde sola con tu catálogo.", auto: true },
    { what: "¿Dónde está mi pedido?", how: rubro === "servicios" ? "No aplica a tu rubro." : "Responde sola con el estado del pedido.", auto: rubro !== "servicios" },
    { what: "Acuse de recibo de cualquier reclamo", how: "Respuesta inmediata y el caso pasa a una persona.", auto: true },
    { what: rubro === "servicios" ? "Reprogramar citas" : "Cambios de talla o producto", how: "La IA pide los datos y deja el caso listo para el área.", auto: true },
    { what: "Cobros dobles y reembolsos", how: "Siempre una persona: hay dinero de por medio.", auto: false },
    { what: "Amenazas legales, Indecopi o fraude", how: "Siempre una persona y en menos de 1 hora.", auto: false },
    { what: "Clientes muy molestos en público", how: "La IA redacta, pero una persona aprueba antes de publicar.", auto: false },
  ];

  return { integrations: out, skip, automate };
}

// ───────────────────────────── Estado inicial ─────────────────────────────

let seq = 0;
export const uid = (p = "id") => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function buildAreas(rubro, accountId) {
  const domain = `${accountId || "negocio"}.pe`;
  return (AREA_PRESETS[rubro] || AREA_PRESETS.retail).map((a) => ({
    id: uid("area"), name: a.name, email: `${a.email}${domain}`, keywords: [...a.keywords],
  }));
}

export function makeCase({ channel, name, text, createdAt, isRepeat }, triageResult) {
  const pri = PRIORITY[triageResult.priority];
  return {
    id: uid("case"),
    code: `C-${Math.floor(1000 + Math.random() * 9000)}`,
    channel,
    customer: { name, repeat: !!isRepeat },
    messages: [{ id: uid("m"), from: "cliente", text, at: createdAt }],
    createdAt,
    slaDueAt: createdAt + pri.slaHours * 3600_000,
    status: "nuevo",
    triage: triageResult,
    areaId: triageResult.areaId,
    events: [{ at: createdAt, text: `Caso creado desde ${CHANNELS[channel]?.label || channel}` }],
    firstResponseAt: null,
    resolvedAt: null,
    derivedAt: null,
  };
}

/** Aplica las reglas automáticas: acuse inmediato y derivación de urgentes/altas. */
export function applyAutomation(c, settings, areas, now = Date.now()) {
  const next = { ...c, messages: [...c.messages], events: [...c.events] };
  if (settings.autoAck) {
    const ack = c.triage.automatable ? c.triage.suggestedReply : `Recibimos tu mensaje. Ya lo tiene una persona de nuestro equipo y te respondemos pronto (caso ${c.code}).`;
    next.messages.push({ id: uid("m"), from: "ia", text: ack, at: now + 2000 });
    next.firstResponseAt = now + 2000;
    next.events.push({ at: now + 2000, text: c.triage.automatable ? "La IA respondió sola (consulta automatizable)" : "Acuse automático enviado al cliente" });
    next.status = c.triage.automatable ? "resuelto" : "en_curso";
    if (c.triage.automatable) next.resolvedAt = now + 2000;
  }
  const shouldDerive = settings.autoDerive && ["urgente", "alta"].includes(c.triage.priority) && c.areaId;
  if (shouldDerive && next.status !== "resuelto") {
    const area = areas.find((a) => a.id === c.areaId);
    next.status = "derivado";
    next.derivedAt = now + 3000;
    next.events.push({ at: now + 3000, text: `Derivado automáticamente a ${area?.name} (${area?.email}) con link seguro` });
  }
  return next;
}

/** Estado completo de una cuenta demo. "nuevo" arranca vacío hasta hacer el diagnóstico. */
export function seedAccount(accountId) {
  const acc = DEMO_ACCOUNTS.find((a) => a.id === accountId);
  const base = {
    accountId,
    businessName: acc?.name || "Mi negocio",
    profile: null,
    plan: null,
    integrations: {},
    areas: [],
    cases: [],
    settings: { autoAck: true, autoDerive: true },
  };
  if (!acc?.preset) return base;

  const profile = acc.preset;
  const plan = recommend(profile);
  const areas = buildAreas(profile.rubro, accountId);
  const integrations = {};
  plan.integrations.forEach((r, i) => {
    integrations[r.id] = { status: r.level === "opcional" ? "sugerida" : i < 4 ? "conectada" : "pendiente" };
  });
  const ctx = { areas, businessName: acc.name };
  const now = Date.now();
  const samples = SAMPLE_MESSAGES[profile.rubro] || [];
  const ages = [25, 70, 140, 300, 900]; // minutos atrás
  const cases = samples
    .filter((s) => integrations[s.channel]?.status === "conectada" || s.channel === "whatsapp")
    .map((s, i) => {
      const createdAt = now - ages[i % ages.length] * 60_000;
      const tr = triageLocal({ text: s.text, channel: s.channel, customerName: s.name, isRepeat: i === 1 }, ctx);
      let c = makeCase({ channel: s.channel, name: s.name, text: s.text, createdAt, isRepeat: i === 1 }, tr);
      if (i % 2 === 0) c = applyAutomation(c, { autoAck: true, autoDerive: true }, areas, createdAt);
      return c;
    });
  return { ...base, profile, plan, areas, integrations, cases };
}
