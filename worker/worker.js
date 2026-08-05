const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GOOGLE_MODEL = "gemini-3.6-flash";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";
const SAMBANOVA_URL = "https://api.sambanova.ai/v1/chat/completions";
const SAMBANOVA_MODEL = "Meta-Llama-3.3-70B-Instruct";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openrouter/free";
const ALLOWED_ORIGINS = [
  "https://sugusdeborbon-glitch.github.io",
  "null"
];
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_TOKENS = 4096;
const ADMIN_ENDPOINT = "/api/config";
const CONFIG_KEY = "ai_config";

const PROVIDERS = [
  { id: "groq", name: "Groq", url: GROQ_URL, model: GROQ_MODEL, keyEnv: "GROQ_API_KEY" },
  { id: "sambanova", name: "SambaNova", url: SAMBANOVA_URL, model: SAMBANOVA_MODEL, keyEnv: "SAMBANOVA_API_KEY" },
  { id: "google", name: "Google", url: GOOGLE_URL, model: GOOGLE_MODEL, keyEnv: "GOOGLE_API_KEY", googleThinking: "low" },
  { id: "openrouter", name: "OpenRouter", url: OPENROUTER_URL, model: OPENROUTER_MODEL, keyEnv: "OPENROUTER_API_KEY" },
  { id: "nvidia", name: "NVIDIA", url: NVIDIA_URL, model: NVIDIA_MODEL, keyEnv: "NVIDIA_API_KEY" }
];
const DEFAULT_ORDER = ["groq", "sambanova", "google", "openrouter", "nvidia"];

const hits = new Map();

function corsHeaders(req) {
  const origin = req.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-BATS-Token, X-Admin-Token",
      "Vary": "Origin"
    };
  }
  return {};
}

function json(body, status, req, providerName) {
  const extra = providerName ? { "X-Provider": providerName } : {};
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }, extra, corsHeaders(req))
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

async function getConfig(env) {
  try {
    const raw = await env.CONFIG.get(CONFIG_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function buildProviders(env, cfg) {
  const order = Array.isArray(cfg.providerOrder) && cfg.providerOrder.length ? cfg.providerOrder : DEFAULT_ORDER;
  const on = cfg.providersOn || {};
  const list = [];
  for (const id of order) {
    const meta = PROVIDERS.find(function(p){ return p.id === id; });
    if (!meta) continue;
    if (on[id] === false) continue;
    const key = env[meta.keyEnv];
    if (!key) continue;
    list.push({ name: meta.name, url: meta.url, key: key, model: meta.model, googleThinking: meta.googleThinking });
  }
  return list;
}

function availableProviders(env) {
  return PROVIDERS.map(function(p){
    return { id: p.id, name: p.name, available: !!env[p.keyEnv] };
  });
}

const LEN_LINES = {
  corta: "Extensión: breve, alrededor de 500 caracteres (1 párrafo).",
  media: "Extensión: media, alrededor de 1500 caracteres (3-4 párrafos).",
  larga: "Extensión: extensa, alrededor de 3000 caracteres (5-7 párrafos)."
};

function applyOverrides(messages, cfg, tipo) {
  if (!Array.isArray(messages) || !messages.length) return messages;
  let msgs = messages;
  const keyMap = { diaria: "systemDiaria", rel: "systemRel", laboral: "systemLaboral", aprendizaje: "systemAprendizaje", pers: "systemPers", av: "systemAV", larga: "systemLarga" };
  const overKey = keyMap[tipo];
  if (overKey && cfg[overKey] && typeof cfg[overKey] === "string" && msgs[0] && msgs[0].role === "system") {
    msgs = msgs.slice();
    msgs[0] = Object.assign({}, msgs[0], { content: cfg[overKey] });
  }
  if (tipo === "larga" && cfg.lenDefault && LEN_LINES[cfg.lenDefault] && msgs[1] && msgs[1].role === "user") {
    const content = String(msgs[1].content || "");
    const replaced = content.replace(/Extensión: [^\n]*/, LEN_LINES[cfg.lenDefault]);
    if (replaced !== content) {
      msgs = msgs.slice();
      msgs[1] = Object.assign({}, msgs[1], { content: replaced });
    }
  }
  return msgs;
}

function sanitizeConfig(body) {
  const cfg = {};
  if (Array.isArray(body.providerOrder)) {
    const seen = {};
    const order = [];
    for (const id of body.providerOrder) {
      if (seen[id] || !PROVIDERS.some(function(p){ return p.id === id; })) continue;
      seen[id] = true;
      order.push(id);
    }
    if (order.length) cfg.providerOrder = order;
  }
  if (body.providersOn && typeof body.providersOn === "object") {
    const on = {};
    for (const p of PROVIDERS) {
      on[p.id] = body.providersOn[p.id] !== false;
    }
    cfg.providersOn = on;
  }
  for (const k of ["systemDiaria", "systemRel", "systemLaboral", "systemAprendizaje", "systemPers", "systemAV", "systemLarga"]) {
    if (typeof body[k] === "string") cfg[k] = body[k];
  }
  if (typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 2) {
    cfg.temperature = body.temperature;
  }
  if (Number.isInteger(body.maxTokens) && body.maxTokens >= 128 && body.maxTokens <= 8192) {
    cfg.maxTokens = body.maxTokens;
  }
  if (LEN_LINES[body.lenDefault]) cfg.lenDefault = body.lenDefault;
  return cfg;
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    const url = new URL(req.url);

    if (url.pathname === ADMIN_ENDPOINT) {
      if (req.headers.get("X-Admin-Token") !== env.ADMIN_TOKEN) {
        return json({ error: "No autorizado" }, 401, req);
      }
      if (req.method === "GET") {
        const cfg = await getConfig(env);
        return json({ config: cfg, available: availableProviders(env), defaults: DEFAULT_ORDER }, 200, req);
      }
      if (req.method === "PUT") {
        let body;
        try {
          body = await req.json();
        } catch (e) {
          return json({ error: "Cuerpo JSON inválido" }, 400, req);
        }
        const cfg = sanitizeConfig(body);
        await env.CONFIG.put(CONFIG_KEY, JSON.stringify(cfg));
        return json({ ok: true, config: cfg }, 200, req);
      }
      return json({ error: "Método no permitido" }, 405, req);
    }

    if (req.method !== "POST") {
      return json({ error: "Método no permitido" }, 405, req);
    }
    if (env.BATS_TOKEN && req.headers.get("X-BATS-Token") !== env.BATS_TOKEN) {
      return json({ error: "No autorizado" }, 401, req);
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

    const cfg = await getConfig(env);
    let providers = buildProviders(env, cfg);
    if (!providers.length) {
      return json({ error: "Configuración del servidor incompleta" }, 500, req);
    }

    if (typeof body.provider === "string" && body.provider) {
      providers = providers.filter(function(p){ return p.name === body.provider; });
    }

    const tipo = typeof body.tipo === "string" ? body.tipo : "";
    const msgs = applyOverrides(messages, cfg, tipo);

    const payload = {
      temperature: cfg.temperature != null ? cfg.temperature : (body.temperature != null ? body.temperature : 0.7),
      max_tokens: cfg.maxTokens || body.max_tokens || MAX_TOKENS
    };

    let last = null;
    for (const provider of providers) {
      const res = await llamarProveedor(provider, msgs, payload);
      if (res.ok) {
        return json({ content: res.content }, 200, req, provider.name);
      }
      last = res;
    }
    if (last) {
      const status = last.status && last.status >= 400 ? last.status : 502;
      return json({ error: last.err }, status, req);
    }
    return json({ error: "Error desconocido del proveedor" }, 502, req);
  }
};

async function llamarProveedor(provider, messages, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(function(){ ctrl.abort(); }, 25000);
  const bodyObj = {
    model: provider.model,
    messages: messages,
    temperature: payload.temperature,
    max_tokens: payload.max_tokens
  };
  if (provider.googleThinking) {
    bodyObj.extra_body = {
      google: {
        thinking_config: {
          thinking_level: provider.googleThinking,
          include_thoughts: false
        }
      }
    };
  }
  try {
    const upstream = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + provider.key
      },
      body: JSON.stringify(bodyObj),
      signal: ctrl.signal
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const detalle = data && data.error
        ? (data.error.message || data.error.status || JSON.stringify(data.error))
        : (data && data.error_type ? data.error_type : JSON.stringify(data).slice(0, 300));
      return {
        ok: false,
        status: upstream.status,
        err: provider.name + " (" + upstream.status + "): " + detalle
      };
    }
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content || content.length < 80) {
      return { ok: false, status: 502, err: "Respuesta vacía o demasiado corta de " + provider.name };
    }
    return { ok: true, status: upstream.status, content: content };
  } catch (e) {
    return { ok: false, status: 0, err: provider.name + ": la petición tardó demasiado o falló la conexión." };
  } finally {
    clearTimeout(timer);
  }
}
