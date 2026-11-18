# Suportly — demo de clase

Mini panel de atención centralizada: diagnóstico que recomienda integraciones, conexión guiada,
bandeja única con triaje por IA (prioridad, sentimiento, urgencia explicable, resumen, respuesta sugerida),
derivación automática a áreas y métricas de SLA.

## Cuentas de la demo
Contraseña de todas: `demo2026`

| Cuenta | Para mostrar |
|---|---|
| Bruma | Tienda online de ropa con el plan ya aplicado, casos de ejemplo y áreas |
| Mi negocio | Cuenta vacía: empieza por el diagnóstico |

Los datos se guardan en el navegador (localStorage). "Reiniciar" vuelve a los datos iniciales.

## Correr en tu PC
```powershell
npm install
npm run dev
```

## Desplegar en Vercel
1. Sube esta carpeta a un repositorio de GitHub (puede ser una carpeta dentro de tu repo actual).
2. En Vercel: **Add New → Project**, importa el repo. Si está en una subcarpeta, ponla en **Root Directory**.
3. Framework: **Vite** (se detecta solo). Build: `npm run build`. Output: `dist`.
4. Opcional, para IA real: en **Settings → Environment Variables** agrega `OPENAI_API_KEY`
   (y si quieres `OPENAI_MODEL`, por defecto `gpt-4o-mini`). Vuelve a desplegar.
5. Opcional: dominio propio (CNAME a `cname.vercel-dns.com`).

Sin `OPENAI_API_KEY` la demo funciona igual con el motor local; cada caso indica si lo clasificó
"GPT-4o mini" o el "Motor local".

## Estructura
- `src/engine.js` — triaje, puntaje de urgencia, derivación, recomendación de integraciones
- `src/data.js` — canales, integraciones, áreas por rubro, mensajes de ejemplo, cuentas demo
- `src/components/` — Bandeja, Integraciones (diagnóstico + conexión), Derivación, Métricas
- `api/triage.js` — función serverless de Vercel que llama a OpenAI (con límite por IP)

## Qué es simulado
Las conexiones (Meta, Google, Mercado Pago), el envío de respuestas y los avisos por correo a las áreas
se simulan. En producción se conectan con el proveedor de mensajería, el servicio de correo y el backend.
