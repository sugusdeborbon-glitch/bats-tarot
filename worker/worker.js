const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const ALLOWED_ORIGINS = [
  "https://sugusdeborbon-glitch.github.io",
  "null"
];
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

const hits = new Map();

function corsHeaders(req) {
  const origin = req.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
  }
  return {};
}

function json(body, status, req) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }, corsHeaders(req))
  });
}

function rateLimited(req) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(function(t){ return now - t < RATE_LIMIT_WINDOW_MS; });
  if (arr.length >= RATE_LIMIT_MAX) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    if (req.method !== "POST") {
      return json({ error: "Método no permitido" }, 405, req);
    }
    if (!env.DEEPSEEK_API_KEY) {
      return json({ error: "Configuración del servidor incompleta" }, 500, req);
    }
    if (rateLimited(req)) {
      return json({ error: "Demasiadas peticiones. Inténtalo en un momento." }, 429, req);
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "Cuerpo JSON inválido" }, 400, req);
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || !messages.length) {
      return json({ error: "Faltan los mensajes" }, 400, req);
    }

    const upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + env.DEEPSEEK_API_KEY
      },
      body: JSON.stringify({
        model: body.model || MODEL,
        messages: messages,
        temperature: body.temperature != null ? body.temperature : 0.7,
        max_tokens: body.max_tokens || 1600
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return json({ error: "DeepSeek: " + (data.error && data.error.message || "error") }, 502, req);
    }

    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
      return json({ error: "Respuesta vacía de DeepSeek" }, 502, req);
    }
    return json({ content: content }, 200, req);
  }
};
