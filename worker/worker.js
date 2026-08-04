const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GOOGLE_MODEL = "gemini-3.6-flash";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "gpt-oss-120b";
const SAMBANOVA_URL = "https://api.sambanova.ai/v1/chat/completions";
const SAMBANOVA_MODEL = "Meta-Llama-3.3-70B-Instruct";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openrouter/free";
const ALLOWED_ORIGINS = [
  "https://sugusdeborbon-glitch.github.io",
  "null"
];
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_TOKENS = 4096;

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
    const providers = [];
    if (env.GOOGLE_API_KEY) providers.push({ name: "Google", url: GOOGLE_URL, key: env.GOOGLE_API_KEY, model: GOOGLE_MODEL, googleThinking: "low" });
    if (env.GROQ_API_KEY) providers.push({ name: "Groq", url: GROQ_URL, key: env.GROQ_API_KEY, model: GROQ_MODEL });
    if (env.NVIDIA_API_KEY) providers.push({ name: "NVIDIA", url: NVIDIA_URL, key: env.NVIDIA_API_KEY, model: NVIDIA_MODEL });
    if (env.CEREBRAS_API_KEY) providers.push({ name: "Cerebras", url: CEREBRAS_URL, key: env.CEREBRAS_API_KEY, model: CEREBRAS_MODEL });
    if (env.SAMBANOVA_API_KEY) providers.push({ name: "SambaNova", url: SAMBANOVA_URL, key: env.SAMBANOVA_API_KEY, model: SAMBANOVA_MODEL });
    if (env.OPENROUTER_API_KEY) providers.push({ name: "OpenRouter", url: OPENROUTER_URL, key: env.OPENROUTER_API_KEY, model: OPENROUTER_MODEL });
    if (!providers.length) {
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

    const payload = {
      temperature: body.temperature != null ? body.temperature : 0.7,
      max_tokens: body.max_tokens || MAX_TOKENS
    };

    let last = null;
    for (const provider of providers) {
      const res = await llamarProveedor(provider, messages, payload);
      if (res.ok) {
        return json({ content: res.content }, 200, req);
      }
      last = res;
      const es4xx = res.status >= 400 && res.status < 500;
      if (es4xx && res.status !== 429) break;
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
  const timer = setTimeout(function(){ ctrl.abort(); }, 60000);
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
    if (!content) {
      return { ok: false, status: 502, err: "Respuesta vacía de " + provider.name };
    }
    return { ok: true, status: upstream.status, content: content };
  } catch (e) {
    return { ok: false, status: 0, err: provider.name + ": la petición tardó demasiado o falló la conexión." };
  } finally {
    clearTimeout(timer);
  }
}
