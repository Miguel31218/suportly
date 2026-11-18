// Función serverless de Vercel: clasifica un caso con GPT-4o mini.
// Si OPENAI_API_KEY no está configurada responde 503 y el panel usa su motor local.

const CATEGORIES = ["legal", "pago", "reclamo_pedido", "cambio_devolucion", "atencion", "agenda", "venta", "consulta"];
const PRIORITIES = ["urgente", "alta", "normal", "baja"];

// Límite simple por IP (por instancia) para que la demo pública no gaste tu clave.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 12;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: "ai_not_configured" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "anon";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const { text, channel, customerName, business, areas } = req.body || {};
  if (typeof text !== "string" || !text.trim() || text.length > 2000) return res.status(400).json({ error: "bad_text" });
  const areaList = (Array.isArray(areas) ? areas : []).slice(0, 12).map((a) => ({ id: String(a.id).slice(0, 60), name: String(a.name).slice(0, 60) }));

  const system = [
    `Eres el clasificador de casos de atención al cliente de "${String(business || "el negocio").slice(0, 80)}", una pyme en Perú.`,
    "Analiza el mensaje del cliente y devuelve SOLO un objeto JSON con estas claves:",
    `- category: una de ${JSON.stringify(CATEGORIES)}`,
    `- priority: una de ${JSON.stringify(PRIORITIES)} (urgente = amenaza legal, fraude o Indecopi; alta = dinero o pedido fallido; normal = cambios, citas, compras; baja = dudas generales)`,
    '- sentiment: "negativo", "neutral" o "positivo"',
    "- summary: resumen en español de máximo 25 palabras, empezando por el tipo de caso",
    `- area_id: el id del área que debe atenderlo, elegido de ${JSON.stringify(areaList)}`,
    "- suggested_reply: respuesta cordial en español peruano, máximo 60 palabras, tutea al cliente, no prometas reembolsos ni plazos que no conoces",
    "- reasons: lista de 1 a 3 frases cortas que expliquen la clasificación",
  ].join("\n");

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Canal: ${String(channel || "").slice(0, 30)}\nCliente: ${String(customerName || "").slice(0, 60)}\nMensaje: ${text}` },
        ],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "ai_upstream", status: r.status });
    const data = await r.json();
    const out = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    if (!CATEGORIES.includes(out.category) || !PRIORITIES.includes(out.priority)) return res.status(502).json({ error: "ai_bad_output" });
    return res.status(200).json(out);
  } catch {
    return res.status(502).json({ error: "ai_failed" });
  }
}
