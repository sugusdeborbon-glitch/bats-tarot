import {
  DEFAULT_ORDER,
  CONFIG_VERSION,
  MAX_PROVIDERS,
  redactConfig,
  probeAll,
  availableProviders as pmAvailableProviders,
  buildProviders as pmBuildProviders,
  sanitizeConfig as pmSanitizeConfig,
  readConfig as pmReadConfig,
  mergeConfig as pmMergeConfig
} from "./provider-manager.js";

const ALLOWED_ORIGINS = [
  "https://sugusdeborbon-glitch.github.io",
  "null"
];
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_TOKENS = 8192;
const ADMIN_ENDPOINT = "/api/config";
const CONFIG_KEY = "ai_config";
const TTS_ENDPOINT = "/api/tts";
const TTS_MAX_TEXT = 20000;
const TTS_GOOGLE = "https://translate.google.com/translate_tts";
const AI_FLAGS_ENDPOINT = "/api/ai-flags";
const DEFAULT_USE_CORTA = true;
const DEFAULT_USE_LARGA = true;

function _sistemaBase(nombre, estructura) {
  return "Eres el intérprete profesional BATS (Business Ashram Tarot System) para la tirada \u201c" + nombre + "\u201d, basada en el mazo Rider-Waite-Smith.\n"
    + "PRINCIPIO RECTOR (no negociable): el tarot diagnostica el patrón; la persona decide. Nunca predices el futuro, nunca ordenas una acción, nunca afirmas certezas sobre terceros que no participan en la tirada. Tu voz es la de un analista de patrones, no un oráculo: evita expresiones como \"el universo te indica\", \"pronto llegarás a\", \"debes\", \"tienes que\"; usa en su lugar \"la carta señala\", \"el patrón indica\", \"conviene observar\".\n"
    + "Recibirás la tirada con posiciones ya definidas, su quintaesencia ya calculada y, para cada carta, una \"Referencia BATS\": es la fuente de significado autorizada del sistema para esa carta en esa orientación. Interprétala y fíltrala por el sentido de la posición; no la sustituyas por el significado genérico de manual RWS ni la contradigas.\n"
    + "Estructura de la tirada:\n" + estructura + "\n"
    + "Para cada posición: antes de interpretar, nombra en pocas palabras un elemento visual concreto de la imagen de la carta (RWS); no reemplaces el símbolo por metalenguaje técnico.\n"
    + "Si el user content indica un COMOD\u00cdN RESUELTO, la extensi\u00f3n BATS reemplaza al Comod\u00edn en su posici\u00f3n. Interpreta La Salida como la carta de esa posici\u00f3n. Si indica COMOD\u00cdN INVERTIDO, no hay extensi\u00f3n: indica brevemente que el conocimiento no es apropiado en este momento.\n"
    + "Debes responder \u00dANICAMENTE con JSON v\u00e1lido y con esta forma exacta:\n"
    + "{\"posiciones\":[{\"i\":0,\"texto\":\"...\"},{\"i\":1,\"texto\":\"...\"},...],\"quintaesencia\":\"...\"}\n"
    + "Reglas:\n"
    + "- Una entrada por cada posición. El campo i es el índice de la carta (empieza en 0).\n"
    + "- Cada \"texto\" ancla primero un elemento visual y luego interpreta la carta filtrada por el sentido de esa posición y su Referencia BATS. Máximo 300 caracteres.\n"
    + "- Si se entrega una \"Referencia BATS de la quintaesencia\", úsala como base de la síntesis; no inventes un significado distinto. \"quintaesencia\" sintetiza el arquetipo de fondo de toda la tirada, nunca como mandato de acción ni predicción. Máximo 300 caracteres.\n"
    + "- Idioma: español, claro, directo, sin relleno místico ni tecnicismos innecesarios.\n"
    + "- No inventes datos biográficos ni asumas circunstancias no proporcionadas. Si falta información necesaria, indícalo brevemente dentro del texto de esa posición, nunca fuera del JSON.\n"
    + "- No escribas nada fuera del JSON: ni introducción, ni comentarios, ni comillas de código, ni etiquetas markdown.";
}

const AI_SISTEMA_AV = "Eres el intérprete profesional BATS (Business Ashram Tarot System) para el Arcano Visitante.\nPRINCIPIO RECTOR (no negociable): el tarot diagnostica el patrón; la persona decide. No predices el futuro ni ordenas una acción; tu voz es la de un analista de patrones, no un oráculo.\nRecibirás el Arcano Visitante del día (una carta calculada por numerología), sus Referencias BATS (lectura normal, sombra y ayuda — úsalas como base autorizada, no las sustituyas por significado genérico) y tres preguntas fijas.\nResponde ÚNICAMENTE con JSON válido de esta forma exacta:\n{\"q1\":\"...\",\"q2\":\"...\",\"q3\":\"...\"}\nReglas:\n- q1: ¿Qué vienes a mostrarme hoy? Máximo 300 caracteres.\n- q2: ¿Qué patrón conocido me estás ayudando a no repetir hoy? Máximo 300 caracteres.\n- q3: ¿Qué acción consciente me ayuda a escucharte? Máximo 300 caracteres.\n- Idioma: español, claro y directo. No predigas el futuro; muestra patrones y posibilidades.\n- No escribas nada fuera del JSON: ni introducción, ni comentarios, ni comillas de código.";

const AI_SISTEMA_LARGA = "Act\u00faa como el int\u00e9rprete experto del m\u00e9todo BATS (Business Ashram Tarot System).\nPRINCIPIO RECTOR (no negociable): el tarot diagnostica el patr\u00f3n; la persona decide. Nunca predices el futuro, nunca ordenas una acci\u00f3n, nunca afirmas certezas sobre terceros que no participan en la tirada. Tu voz es la de un analista de patrones, no un or\u00e1culo: evita \"el universo te indica\", \"pronto llegar\u00e1s a\", \"debes\", \"tienes que\"; usa en su lugar \"la carta se\u00f1ala\", \"el patr\u00f3n indica\", \"conviene observar\".\n\nVas a recibir una \u00fanica tirada del Tarot Rider-Waite-Smith. La tirada puede pertenecer a cualquier \u00e1mbito (diaria, laboral, relaci\u00f3n, aprendizaje, decisi\u00f3n, entrevista a un arcano, tirada libre, etc.). No presupongas su estructura; ded\u00facela a partir de los t\u00edtulos, posiciones y preguntas.\n\nCada carta llega con una \"Referencia BATS\": es la fuente de significado autorizada del sistema para esa carta en esa orientaci\u00f3n. \u00dasala como base de tu interpretaci\u00f3n; no la sustituyas por el significado gen\u00e9rico de manual RWS ni la contradigas. Si una carta no trae Referencia BATS, interp\u00e9tala desde el simbolismo RWS est\u00e1ndar e indica que no hay referencia propia para ella.\n\nPara cada posici\u00f3n:\n1. Lee primero la pregunta asociada a esa posici\u00f3n.\n2. Nombra brevemente un elemento visual concreto de la carta; no sustituyas el s\u00edmbolo por metalenguaje.\n3. Interpreta la carta desde la funci\u00f3n que cumple en esa posici\u00f3n, apoy\u00e1ndote en su Referencia BATS.\n4. Extrae el aprendizaje pr\u00e1ctico que aporta.\n\nSi existe una quintaesencia:\n- Si se entrega una \"Referencia BATS de la quintaesencia\", \u00fasala como base; no inventes un significado distinto.\n- Interpr\u00e9tala como el patr\u00f3n arquet\u00edpico que sintetiza toda la tirada.\n- Expl\u00edcala en relaci\u00f3n con el resto de las cartas, no de forma aislada.\n\nDespu\u00e9s realiza una lectura integrada de la tirada que incluya:\n- Arquitectura simb\u00f3lica de la tirada.\n- Relaciones, apoyos, tensiones y coherencias entre las cartas.\n- Repeticiones de n\u00fameros, palos, figuras o arcanos mayores cuando sean significativas.\n- Evoluci\u00f3n del mensaje desde la primera hasta la \u00faltima posici\u00f3n.\n- Ense\u00f1anza central de la tirada.\n\nFinaliza con:\n1. Una s\u00edntesis profunda de varios p\u00e1rrafos.\n2. Una \u00fanica frase que resuma el aprendizaje esencial del sistema.\n\nPrincipios metodol\u00f3gicos BATS:\n- El significado nace de la pregunta y de la posici\u00f3n, no de un significado fijo de la carta.\n- Cada carta modifica y es modificada por las dem\u00e1s.\n- La tirada constituye un \u00fanico sistema simb\u00f3lico.\n- La quintaesencia revela el patr\u00f3n profundo que organiza toda la lectura.\n- La interpretaci\u00f3n debe ser simb\u00f3lica, psicol\u00f3gica y arquet\u00edpica, orientada a la comprensi\u00f3n y a la toma de conciencia.\n- No utilices cartas invertidas salvo que se indique expresamente.\n- Evita cualquier enfoque predictivo, fatalista o determinista.\n\nSi el user content indica un COMOD\u00cdN RESUELTO, la extensi\u00f3n BATS reemplaza al Comod\u00edn en su posici\u00f3n. Interpreta La Salida como la carta de esa posici\u00f3n. Si indica COMOD\u00cdN INVERTIDO, no hay extensi\u00f3n: indica brevemente que el conocimiento no es apropiado en este momento.";

const SISTEMAS = {
  diaria: _sistemaBase("Cruz Diaria", "- Centro: la energía del día (el núcleo de la jornada).\n- Izquierda: qué frenar o minimizar.\n- Derecha: qué impulsar o hacer.\n- Arriba: ayuda disponible.\n- Abajo: posible salida o resultado."),
  rel: _sistemaBase("Tirada de la relación", "- Energía del momento de la relación.\n- Energía de la Persona 1.\n- Energía de la Persona 2.\n- Posible salida o dirección."),
  laboral: _sistemaBase("BATS Laboral", "- Centro: la energía laboral del momento.\n- Izquierda: qué frenar o minimizar en el trabajo.\n- Derecha: qué impulsar o hacer en el trabajo.\n- Arriba: ayuda disponible en el trabajo.\n- Abajo: posible salida o resultado laboral."),
  aprendizaje: _sistemaBase("El Aprendizaje", "- El Hecho: qué ha ocurrido realmente.\n- El Maestro: qué me está mostrando realmente esta experiencia.\n- El Punto Ciego: qué no estoy viendo o qué interpretación me impide aprender.\n- La Integración: qué comprensión quiere integrarse en mí.\n- El Don Transformador: qué capacidad o cambio nace al integrar la verdad.\n- El Resultado Posible: qué transformación ocurre si integro la lección."),
  pers: _sistemaBase("Tirada Personalizada", "- Cada posición lleva el título que la persona eligió; ese título define su función.\n- No asumas un significado fijo de la carta: interprétala desde la función que cumple en su posición."),
  av: AI_SISTEMA_AV,
  larga: AI_SISTEMA_LARGA,
  default: _sistemaBase("tirada BATS", "(estructura no especificada; interpreta cada posición por su título tal como llega)")
};

function sistemaPorTipo(tipo) {
  return SISTEMAS[tipo] || SISTEMAS.default;
}

/* ── Contrato temporal (FASE 2C-3 / H-04) ─────────────────────────────
 * El Worker es la autoridad temporal. El presupuesto es un reloj COMPARTIDO:
 * al pasar de proveedor no se reinicia. Cada intento se acota a
 * min(presupuesto del intento, restante, upstream máximo) y no se abre otro
 * intento cuando el restante cae por debajo de minSlice.
 * La aritmética vive en js/ai/contrato-temporal.js (módulo puro). */

import {
  contratoPara as ctContratoPara,
  timeoutEfectivo as ctTimeoutEfectivo,
  puedeIntentar as ctPuedeIntentar,
  restante as ctRestante,
  timeoutPropia as ctTimeoutPropia,
  crearReloj as ctCrearReloj
} from "../js/ai/contrato-temporal.js";

const RELOJ_CT = ctCrearReloj();

/** Devuelve true si `tipo` pide la interpretación larga. */
function esTipoLarga(tipo) {
  return tipo === "larga";
}

/**
 * Presupuesto por tipo para este request.
 * @param {string} tipo  tipo de interpretación.
 * @returns {object} contrato en ms.
 */
function presupuestoDe(tipo) {
  return ctContratoPara(esTipoLarga(tipo) ? "larga" : "corta");
}

/**
 * Mismo contrato que `presupuestoDe`, aislado para el modo propia, que NO
 * encadena proveedores y solo hereda el techo de upstream.
 * @param {string} tipo  tipo de interpretación.
 * @returns {object} contrato en ms.
 */
function presupuestoPropia(tipo) {
  return presupuestoDe(tipo);
}

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

/**
 * getConfig — Lee la configuración de KV SIN escribir nada.
 * Devuelve el valor tal cual (v1 o v2); la normalización a v2 se hace en
 * lectura, de forma no destructiva. Nunca se persiste una migración aquí.
 */
async function getConfig(env) {
  try {
    const raw = await env.CONFIG.get(CONFIG_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

/* Provider Manager PRO — la lógica pura vive en ./provider-manager.js */
function buildProviders(env, cfg) {
  return pmBuildProviders(env, cfg);
}

function availableProviders(env, cfg) {
  return pmAvailableProviders(env, cfg);
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
  const cfg = pmSanitizeConfig(body);
  if (LEN_LINES[cfg.lenDefault]) cfg.lenDefault = cfg.lenDefault;
  else delete cfg.lenDefault;
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
        return json({
          config: redactConfig(cfg),
          configVersion: CONFIG_VERSION,
          available: availableProviders(env, cfg),
          probe: probeAll(env, cfg),
          maxProviders: MAX_PROVIDERS,
          defaults: DEFAULT_ORDER,
          systemDefaults: SISTEMAS,
          aiFlags: { useCorta: typeof cfg.useCorta === "boolean" ? cfg.useCorta : DEFAULT_USE_CORTA, useLarga: typeof cfg.useLarga === "boolean" ? cfg.useLarga : DEFAULT_USE_LARGA }
        }, 200, req);
      }
      if (req.method === "PUT") {
        /* N-10: un PUT ya no reemplaza la config de KV. Por defecto FUSIONA:
           el cuerpo describe qué cambiar y el resto sobrevive. El reinicio a
           valores de fábrica es una acción explícita (?reset=true) y acotada,
           porque sanitizeConfig({}) vacía los escalares de propósito. */
        const esReset = new URL(req.url).searchParams.get("reset") === "true";
        let body = null;
        if (!esReset) {
          try {
            body = await req.json();
          } catch (e) {
            return json({ error: "Cuerpo JSON inválido" }, 400, req);
          }
        }
        const prev = esReset ? {} : await getConfig(env);
        const resultado = pmMergeConfig(prev, esReset ? sanitizeConfig({}) : body);
        const cfg = resultado.merged;
        await env.CONFIG.put(CONFIG_KEY, JSON.stringify(cfg));
        return json({ ok: true, config: redactConfig(cfg), configVersion: CONFIG_VERSION }, 200, req);
      }
      return json({ error: "Método no permitido" }, 405, req);
    }

    if (url.pathname === AI_FLAGS_ENDPOINT) {
      if (req.method !== "GET") {
        return json({ error: "Método no permitido" }, 405, req);
      }
      const cfg = await getConfig(env);
      return json({
        useCorta: typeof cfg.useCorta === "boolean" ? cfg.useCorta : DEFAULT_USE_CORTA,
        useLarga: typeof cfg.useLarga === "boolean" ? cfg.useLarga : DEFAULT_USE_LARGA
      }, 200, req);
    }

    if (url.pathname === TTS_ENDPOINT) {
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
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        return json({ error: "Falta el texto" }, 400, req);
      }
      if (text.length > TTS_MAX_TEXT) {
        return json({ error: "Texto demasiado largo" }, 413, req);
      }
      const lang = body.voice === "es-US" ? "es-US" : "es";
      const res = await ttsGoogle(text, lang);
      if (res.error) {
        return json({ error: res.error }, 502, req);
      }
      return new Response(res.data, {
        status: 200,
        headers: Object.assign({
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'attachment; filename="lectura-bats.mp3"',
          "Cache-Control": "no-store"
        }, corsHeaders(req))
      });
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

    const tipo = typeof body.tipo === "string" ? body.tipo : "";
    const cfg = await getConfig(env);

    let messages = body.messages;
    if (!Array.isArray(messages) || !messages.length) {
      if (typeof body.user === "string" && body.user) {
        messages = [
          { role: "system", content: sistemaPorTipo(tipo) },
          { role: "user", content: body.user }
        ];
      } else {
        return json({ error: "Faltan los mensajes" }, 400, req);
      }
    }
    const msgs = applyOverrides(messages, cfg, tipo);

    if (body.mode === "propia") {
      if (typeof body.base !== "string" || !/^https:\/\//i.test(body.base)) {
        return json({ error: "Endpoint de IA inválido" }, 400, req);
      }
      const pkey = String(req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (!pkey) {
        return json({ error: "Falta la clave del consultante" }, 401, req);
      }
      const p = await llamarEndpointPropio(
        body.base, body.model, msgs, cfg, pkey,
        ctTimeoutPropia(presupuestoPropia(tipo), presupuestoPropia(tipo).totalMs)
      );
      if (p.ok) {
        return json({ content: p.content, provider: "Mi IA", modelo: (typeof body.model === "string" && body.model) ? body.model : "gpt-4o-mini" }, 200, req, "propia");
      }
      const st = p.status && p.status >= 400 ? p.status : 502;
      return json({ error: p.err }, st, req);
    }

    let providers = buildProviders(env, pmReadConfig(cfg));
    if (!providers.length) {
      return json({ error: "Configuración del servidor incompleta" }, 500, req);
    }

    if (typeof body.provider === "string" && body.provider) {
      providers = providers.filter(function(p){ return p.name === body.provider; });
      /* N-16: el filtro puede dejar la lista vacía. Sin esta rama, el bucle
         no ejecuta ningún intento y se respondía "Error desconocido del
         proveedor" (502), que culpaba al proveedor en vez de anunciar que
         ese proveedor no existe aquí. */
      if (!providers.length) {
        return json({ error: "Proveedor no disponible en el servidor: " + body.provider }, 400, req);
      }
    }

    const payload = {
      temperature: cfg.temperature != null ? cfg.temperature : (body.temperature != null ? body.temperature : 0.7),
      max_tokens: cfg.maxTokens || body.max_tokens || MAX_TOKENS
    };

    let last = null;
    const errors = [];

    /* H-04: el deadline se calcula UNA vez y se comparte. El reloj no se
       reinicia al cambiar de proveedor: cada intento recibe lo que queda. */
    const presupuesto = presupuestoDe(tipo);
    const hasta = RELOJ_CT() + presupuesto.totalMs;

    for (let indice = 0; indice < providers.length; indice++) {
      const provider = providers[indice];
      const restante = ctRestante(hasta, RELOJ_CT);
      if (!ctPuedeIntentar(restante, presupuesto)) {
        errors.push("sin presupuesto: restante " + Math.round(restante / 1000) + "s < minSlice");
        break;
      }
      const timeoutMs = ctTimeoutEfectivo(restante, presupuesto, indice);
      if (timeoutMs === null) {
        errors.push("sin presupuesto: restante " + Math.round(restante / 1000) + "s < minSlice");
        break;
      }
      const res = await llamarProveedor(provider, msgs, payload, timeoutMs);
      if (res.ok) {
        return json({ content: res.content, provider: provider.name, modelo: provider.model }, 200, req, provider.name);
      }
      last = res;
      errors.push(provider.name + ": " + res.err + " [" + (res.category || "unknown") + "]");
    }
    if (last) {
      /* N-17: el status agregado NO es el del último proveedor. Devolver
         (404) cuando TODOS fallaron diagnostica mal: el fallo es del
         conjunto, no de un código concreto. El detalle de cada proveedor ya
         viaja en `errors` con su status y su categoría. */
      const summary = "Todos los proveedores fallaron (" + providers.length + "): " + errors.join(" | ");
      return json({ error: summary }, 502, req);
    }
    return json({ error: "Error desconocido del proveedor" }, 502, req);
  }
};

async function llamarEndpointPropio(base, model, messages, cfg, key, timeoutMs) {
  const ctrl = new AbortController();
  const budget = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 40000;
  const timer = setTimeout(function(){ ctrl.abort(); }, budget);
  const bodyObj = {
    model: (typeof model === "string" && model) ? model : "gpt-4o-mini",
    messages: messages,
    temperature: cfg.temperature != null ? cfg.temperature : 0.7,
    max_tokens: cfg.maxTokens || MAX_TOKENS
  };
  try {
    const upstream = await fetch(base.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key
      },
      body: JSON.stringify(bodyObj),
      signal: ctrl.signal
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      const detalle = data && data.error
        ? (data.error.message || data.error.status || JSON.stringify(data.error))
        : JSON.stringify(data).slice(0, 300);
      return { ok: false, status: upstream.status, err: upstream.status + ": " + detalle };
    }
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content || content.length < 80) {
      return { ok: false, status: 502, err: "Respuesta vacía o demasiado corta del proveedor propio" };
    }
    return { ok: true, status: upstream.status, content: content };
  } catch (e) {
    if (e && e.name === "AbortError") {
      return { ok: false, status: 504, err: "El proveedor propio tardó demasiado (" + Math.round(budget / 1000) + "s)." };
    }
    return { ok: false, status: 502, err: "Error de red con el proveedor propio" };
  } finally {
    clearTimeout(timer);
  }
}

/* Exportado para tests: el comportamiento de este adaptador es el que
   diagnostica los incidentes (N-13), así que se prueba REAL, no replicado. */
export async function llamarProveedor(provider, messages, payload, timeoutMs) {
  const ctrl = new AbortController();
  /* H-04: el timeout llega hasta la llamada real, desde el presupuesto
     compartido. Nunca se usa un fijo que ignore el presupuesto recibido. */
  const budget = typeof timeoutMs === "number" && timeoutMs > 0
    ? timeoutMs
    : (payload && payload.timeoutMs) || 40000;
  const timer = setTimeout(function(){ ctrl.abort(); }, budget);
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
    /* N-13: el cuerpo se lee COMO TEXTO antes de parsear. Antes, `.json()`
       consumía el stream y, si fallaba, se devolvía un error sin cuerpo ni
       Content-Type: la evidencia del incidente quedaba destruida. Además,
       un corte del presupuesto compartido (AbortError) se categorizaba como
       parse_error con status 200, ocultando que fue un timeout real. */
    let rawBody;
    try {
      rawBody = await upstream.text();
    } catch (readErr) {
      if (readErr && readErr.name === "AbortError") {
        return {
          ok: false,
          status: 504,
          err: provider.name + " (" + upstream.status + "): cuerpo interrumpido por el presupuesto de tiempo (" + Math.round(budget / 1000) + "s)",
          category: "timeout_budget"
        };
      }
      return {
        ok: false,
        status: upstream.status,
        err: provider.name + " (" + upstream.status + "): no se pudo leer el cuerpo del upstream — " + (readErr && readErr.message || "desconocido"),
        category: "parse_error"
      };
    }
    let data;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseErr) {
      const ctype = (upstream.headers && typeof upstream.headers.get === "function")
        ? (upstream.headers.get("content-type") || "sin content-type")
        : "sin content-type";
      const muestra = String(rawBody).replace(/\s+/g, " ").trim().slice(0, 300);
      return {
        ok: false,
        status: upstream.status,
        err: provider.name + " (" + upstream.status + "): respuesta no JSON del upstream [" + ctype + "] " + (muestra || "(cuerpo vacío)"),
        category: "parse_error"
      };
    }
    if (!upstream.ok) {
      const detalle = data && data.error
        ? (data.error.message || data.error.status || JSON.stringify(data.error))
        : (data && data.error_type ? data.error_type : JSON.stringify(data).slice(0, 300));
      let category = "provider_error";
      if (upstream.status === 429) category = "rate_limited";
      else if (upstream.status >= 500) category = "server_error";
      else if (upstream.status === 408) category = "timeout";
      return {
        ok: false,
        status: upstream.status,
        err: provider.name + " (" + upstream.status + "): " + detalle,
        category: category
      };
    }
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content || content.length < 80) {
      return { ok: false, status: 502, err: "Respuesta vacía o demasiado corta de " + provider.name, category: "empty_response" };
    }
    return { ok: true, status: upstream.status, content: content };
  } catch (e) {
    if (e && e.name === "AbortError") {
      return { ok: false, status: 504, err: provider.name + ": la petición excedió el tiempo de espera (" + Math.round(budget / 1000) + "s).", category: "timeout" };
    }
    return { ok: false, status: 502, err: provider.name + ": error de red — " + (e && e.message || "desconocido"), category: "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

function splitTTS(text, max) {
  max = max || 150;
  const s = String(text).replace(/\s+/g, " ").trim();
  if (!s) return [];
  const chunks = [];
  let rest = s;
  while (rest.length > max) {
    const slice = rest.substring(0, max);
    let cut = slice.lastIndexOf(". ");
    if (cut < max * 0.5) cut = slice.lastIndexOf("; ");
    if (cut < max * 0.5) cut = slice.lastIndexOf(", ");
    if (cut <= 0) cut = slice.lastIndexOf(" ");
    if (cut <= 0) cut = max;
    const piece = slice.substring(0, cut).trim();
    if (piece) chunks.push(piece);
    rest = rest.substring(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function ttsGoogle(text, lang) {
  const chunks = splitTTS(text, 150);
  if (!chunks.length) return { error: "Texto vacío" };
  const parts = [];
  for (const chunk of chunks) {
    const url = TTS_GOOGLE
      + "?ie=UTF-8&q=" + encodeURIComponent(chunk)
      + "&tl=" + encodeURIComponent(lang)
      + "&client=tw-ob";
    let upstream;
    try {
      upstream = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Referer": "https://translate.google.com/"
        }
      });
    } catch (e) {
      return { error: "No se pudo contactar con el proveedor de voz." };
    }
    if (!upstream.ok) {
      return { error: "El proveedor de voz respondió con estado " + upstream.status };
    }
    try {
      const buf = await upstream.arrayBuffer();
      parts.push(new Uint8Array(buf));
    } catch (e) {
      return { error: "No se pudo leer el audio del proveedor de voz." };
    }
  }
  const total = parts.reduce(function(a, b){ return a + b.length; }, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return { data: out };
}