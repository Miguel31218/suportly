// Catálogos fijos de la demo: canales, integraciones, rubros y cuentas de ejemplo.

export const CHANNELS = {
  whatsapp:  { label: "WhatsApp",          short: "WA", color: "#16A34A" },
  instagram: { label: "Instagram DM",      short: "IG", color: "#DB2777" },
  comments:  { label: "Comentarios FB/IG", short: "CM", color: "#2563EB", public: true },
  email:     { label: "Correo",            short: "@",  color: "#7558FE" },
  web:       { label: "Chat web",          short: "WB", color: "#0891B2" },
  reviews:   { label: "Reseñas Google",    short: "G",  color: "#D97706", public: true },
};

// Cada integración: qué canal abre, qué aporta y pasos guiados de conexión.
export const INTEGRATIONS = [
  {
    id: "whatsapp", name: "WhatsApp Business", channel: "whatsapp", kind: "Canal",
    brings: "Los chats de clientes entran como casos y la IA responde en segundos.",
    minutes: 5,
    steps: ["Inicia sesión con Meta", "Elige el número de WhatsApp Business", "Envía un mensaje de prueba"],
  },
  {
    id: "instagram", name: "Instagram DM", channel: "instagram", kind: "Canal",
    brings: "Los mensajes directos llegan a la misma bandeja que WhatsApp.",
    minutes: 3,
    steps: ["Inicia sesión con Meta", "Elige la cuenta de Instagram profesional", "Autoriza mensajes"],
  },
  {
    id: "comments", name: "Comentarios de Facebook e Instagram", channel: "comments", kind: "Canal",
    brings: "Un reclamo público en un post se vuelve caso con prioridad extra, antes de que escale.",
    minutes: 3,
    steps: ["Inicia sesión con Meta", "Elige las páginas a vigilar", "Activa la detección de reclamos"],
  },
  {
    id: "email", name: "Correo de soporte", channel: "email", kind: "Canal",
    brings: "Recibes un correo propio del negocio; cada correo abre o actualiza un caso.",
    minutes: 2,
    steps: ["Confirma el alias del negocio", "Reenvía tu correo actual (opcional)", "Envía un correo de prueba"],
  },
  {
    id: "web", name: "Chat en tu web", channel: "web", kind: "Canal",
    brings: "Un widget en tu web conversa con la IA y abre casos cuando hace falta una persona.",
    minutes: 4,
    steps: ["Copia el código del widget", "Pégalo en tu web", "Abre tu web y escribe una prueba"],
  },
  {
    id: "reviews", name: "Reseñas de Google", channel: "reviews", kind: "Canal",
    brings: "Las reseñas de 1–2 estrellas se convierten en casos para responder rápido.",
    minutes: 3,
    steps: ["Inicia sesión con Google", "Elige tu ficha de negocio", "Define desde qué estrellas abrir caso"],
  },
  {
    id: "payments", name: "Pagos (Mercado Pago)", channel: null, kind: "Contexto",
    brings: "El caso muestra si el pago del cliente existe; los reclamos de cobro se resuelven sin preguntar.",
    minutes: 3,
    steps: ["Inicia sesión en Mercado Pago", "Autoriza lectura de pagos", "Verifica un pago reciente"],
  },
  {
    id: "orders", name: "Pedidos y catálogo", channel: null, kind: "Contexto",
    brings: "La IA ve el estado del pedido del cliente y responde \"¿dónde está mi pedido?\" sola.",
    minutes: 2,
    steps: ["Conecta tu catálogo o Shopify", "Elige qué estados de pedido mostrar", "Prueba con un pedido"],
  },
  {
    id: "area_mail", name: "Avisos a áreas por correo", channel: null, kind: "Derivación",
    brings: "Cada área recibe el caso con un link seguro y responde sin crear cuenta.",
    minutes: 2,
    steps: ["Revisa los correos de cada área", "Envía un aviso de prueba", "Confirma que el área lo abrió"],
  },
];

export const RUBROS = [
  { id: "restaurante", label: "Restaurante o pollería" },
  { id: "retail",      label: "Tienda física" },
  { id: "ecommerce",   label: "Tienda online" },
  { id: "servicios",   label: "Servicios (clínica, academia, taller)" },
];

export const VOLUMES = [
  { id: "bajo",  label: "Menos de 20 mensajes al día" },
  { id: "medio", label: "Entre 20 y 100" },
  { id: "alto",  label: "Más de 100" },
];

// Áreas sugeridas por rubro, con palabras clave para la derivación automática.
export const AREA_PRESETS = {
  restaurante: [
    { name: "Delivery",        email: "delivery@",  keywords: ["no llegó", "no llego", "demora", "motorizado", "repartidor", "tarde"] },
    { name: "Cocina",          email: "cocina@",    keywords: ["frío", "frio", "crudo", "mal estado", "incompleto", "equivocado", "sabor"] },
    { name: "Caja y pagos",    email: "caja@",      keywords: ["cobro", "cobraron", "yape", "plin", "pago", "vuelto", "reembolso"] },
    { name: "Administración",  email: "admin@",     keywords: ["estafa", "denuncia", "indecopi", "libro de reclamaciones", "abogado"] },
  ],
  retail: [
    { name: "Ventas",              email: "ventas@",    keywords: ["precio", "stock", "disponible", "por mayor", "cotización", "cotizacion"] },
    { name: "Cambios y garantías", email: "cambios@",   keywords: ["cambio", "devolución", "devolucion", "talla", "garantía", "garantia", "defectuoso", "roto"] },
    { name: "Caja y pagos",        email: "caja@",      keywords: ["cobro", "cobraron", "pago", "tarjeta", "reembolso"] },
    { name: "Administración",      email: "admin@",     keywords: ["estafa", "denuncia", "indecopi", "libro de reclamaciones", "abogado"] },
  ],
  ecommerce: [
    { name: "Logística",           email: "envios@",    keywords: ["no llegó", "no llego", "envío", "envio", "courier", "demora", "tracking"] },
    { name: "Cambios y devoluciones", email: "cambios@", keywords: ["cambio", "devolución", "devolucion", "talla", "no me queda", "defectuoso", "roto"] },
    { name: "Pagos",               email: "pagos@",     keywords: ["cobro", "cobraron", "doble", "pago", "tarjeta", "reembolso", "yape"] },
    { name: "Ventas",              email: "ventas@",    keywords: ["precio", "stock", "disponible", "por mayor", "talla disponible"] },
    { name: "Administración",      email: "admin@",     keywords: ["estafa", "denuncia", "indecopi", "libro de reclamaciones", "abogado"] },
  ],
  servicios: [
    { name: "Agenda",          email: "agenda@",    keywords: ["cita", "reprogramar", "horario", "turno", "cancelar"] },
    { name: "Atención",        email: "atencion@",  keywords: ["mala atención", "mala atencion", "esperé", "espere", "trato"] },
    { name: "Caja y pagos",    email: "caja@",      keywords: ["cobro", "cobraron", "pago", "boleta", "factura", "reembolso"] },
    { name: "Administración",  email: "admin@",     keywords: ["estafa", "denuncia", "indecopi", "libro de reclamaciones", "abogado"] },
  ],
};

// Mensajes de ejemplo para simular casos entrantes.
export const SAMPLE_MESSAGES = {
  restaurante: [
    { channel: "whatsapp",  name: "Rosa Quispe",   text: "Hace una hora pedí un pollo entero y todavía no llega, el repartidor no contesta. ¿Qué pasó?" },
    { channel: "comments",  name: "Jorge Ramírez", text: "Pésimo servicio!!! me llegó el pollo frío y sin las papas. No vuelvo a pedir." },
    { channel: "whatsapp",  name: "Lucía Torres",  text: "Hola, ¿cuánto cuesta el combo familiar y hacen delivery a Surco?" },
    { channel: "email",     name: "Carlos Mendoza", text: "Me cobraron dos veces por Yape el pedido de ayer, adjunto las capturas. Necesito el reembolso." },
    { channel: "reviews",   name: "Ana Salazar",   text: "1 estrella. Esto es una estafa, pagué por un pollo entero y me mandaron medio. Voy a ir a Indecopi." },
  ],
  retail: [
    { channel: "instagram", name: "Valeria Rojas", text: "Hola! ¿Tienen la casaca negra en talla M disponible en tienda?" },
    { channel: "whatsapp",  name: "Diego Paredes", text: "Compré unas zapatillas la semana pasada y ya se despegó la suela. Quiero hacer válida la garantía." },
    { channel: "comments",  name: "Marco Silva",   text: "En la tienda de Miraflores me trataron fatal, nadie atiende. Qué decepción." },
    { channel: "email",     name: "Paula Gómez",   text: "Quisiera una cotización por mayor de 50 polos para mi empresa." },
  ],
  ecommerce: [
    { channel: "whatsapp",  name: "Camila Ruiz",   text: "Mi pedido #4821 dice entregado pero nunca me llegó. Ya van 3 días!!" },
    { channel: "instagram", name: "Andrea León",   text: "El vestido no me queda, ¿puedo cambiarlo por una talla S?" },
    { channel: "email",     name: "Renzo Castillo", text: "Me hicieron doble cobro en la tarjeta por la compra de ayer. Exijo el reembolso inmediato o pongo una denuncia." },
    { channel: "web",       name: "Visitante web", text: "¿Hacen envíos a Arequipa y cuánto demora?" },
    { channel: "comments",  name: "Kevin Huamán",  text: "No compren aquí, es una estafa, pagué y nunca enviaron nada." },
  ],
  servicios: [
    { channel: "whatsapp",  name: "María Flores",  text: "Necesito reprogramar mi cita de mañana a las 10, ¿hay turno el jueves?" },
    { channel: "reviews",   name: "Luis Vega",     text: "2 estrellas. Esperé 40 minutos aunque tenía cita. Mala atención." },
    { channel: "email",     name: "Sofía Campos",  text: "Me cobraron la consulta completa pero no me atendieron. Necesito la boleta y el reembolso." },
  ],
};

// Cuentas de la demo. "nuevo" arranca vacío para mostrar el diagnóstico desde cero.
export const DEMO_ACCOUNTS = [
  {
    id: "bruma", name: "Bruma", email: "bruma@demo.suportly.com", initials: "B",
    tagline: "Tienda online de Cosmetica · plan ya aplicado",
    preset: { rubro: "ecommerce", canales: ["whatsapp", "instagram", "comments", "email", "web"], volumen: "alto", web: true, cobraOnline: true, local: false },
  },
  {
    id: "nuevo", name: "Mi negocio", email: "nuevo@demo.suportly.com", initials: "MN",
    tagline: "Cuenta vacía · empieza por el diagnóstico",
    preset: null,
  },
];

export const DEMO_PASSWORD = "demo2026";
