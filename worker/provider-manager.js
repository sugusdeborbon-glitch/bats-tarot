/**
 * BATS Tarot — PRO — Provider Manager (FASE 2C-1)
 *
 * Módulo puro: no accede a KV, ni a env, ni a red. Toda la lógica de
 * Provider Manager vive aquí como funciones puras para poder testearla
 * (batería C-1…C-11) sin secretos ni KV reales.
 *
 * worker/worker.js conserva la arquitectura existente (catalog, keyEnv,
 * DEFAULT_ORDER, buildProviders, providerOrder, providersOn, sanitizeConfig,
 * availableProviders, CONFIG, CONFIG_KEY) y delega aquí la lógica nueva.
 */

export const CONFIG_VERSION = 2;
export const MAX_PROVIDERS = 12;

/* Claves cuyo VALOR nunca debe salir del ámbito secreto. */
const SENSITIVE_KEY_RE = /(key|secret|token|password|passwd|credential|authorization|auth)/i;

/* Claves de configuración que nunca son sensibles aunque su nombre case con
 * SENSITIVE_KEY_RE.
 *
 * `keyEnv` / `hasKey` / `secretRef` son metadatos: apuntan al secreto, no lo son.
 *
 * `maxTokens` es un falso positivo por subcadena: contiene "token" pero es un
 * límite de tokens de la respuesta, NO una credencial. Sin esta entrada,
 * redactConfig lo devolvía como "[redactado]", el panel de admin lo pintaba, y
 * adminGuardar hacía parseInt("[redactado]")||4096 — sobreescribiendo en KV el
 * valor real. Es la ÚNICA clave de configuración real que colisiona; el resto
 * de escalares (temperature, lenDefault, useCorta, useLarga, system*, version,
 * providerOrder, providersOn, providers{...}) no contienen ningún patrón.
 */
const SENSITIVE_ALLOWLIST = {
  keyEnv: true,
  hasKey: true,
  secretRef: true,
  maxTokens: true
};

export const CATALOG = [
  {
    id: "groq",
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-120b",
    keyEnv: "GROQ_API_KEY"
  },
  {
    id: "google",
    name: "Google",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-3.6-flash",
    keyEnv: "GOOGLE_API_KEY",
    googleThinking: "low"
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "openrouter/free",
    keyEnv: "OPENROUTER_API_KEY"
  },
  {
    id: "mistral",
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    keyEnv: "MISTRAL_API_KEY"
  }
];

export const DEFAULT_ORDER = ["groq", "google", "openrouter", "mistral"];

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function catalogEntry(id) {
  return CATALOG.find(function (p) { return p.id === id; }) || null;
}

function knownIds() {
  return CATALOG.map(function (p) { return p.id; });
}

/* ───────────────────────── REDACCIÓN ───────────────────────── */

/**
 * redactConfig — SanEA cualquier configuración devuelta fuera del ámbito
 * estrictamente secreto. Nunca devuelve el valor de una credencial.
 * Conserva la FORMA de la configuración (claves presentes) para que la UI
 * siga funcionando; sustituye únicamente el valor.
 */
export function redactConfig(value, depth) {
  depth = depth || 0;
  if (depth > 8) return "[profundo]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(function (v) { return redactConfig(v, depth + 1); });
  }
  if (typeof value !== "object") return value;
  const out = {};
  for (const k of Object.keys(value)) {
    const v = value[k];
    if (SENSITIVE_ALLOWLIST[k] === true) {
      /* Referencia/metadato: se conserva tal cual (no es el secreto). */
      out[k] = redactConfig(v, depth + 1);
      continue;
    }
    if (SENSITIVE_KEY_RE.test(k) && !isReferenceKey(k)) {
      out[k] = redactValue(v);
      continue;
    }
    out[k] = redactConfig(v, depth + 1);
  }
  return out;
}

function isReferenceKey(k) {
  return k === "keyEnv" || k === "secretRef" || k === "hasKey";
}

function redactValue(v) {
  if (v === null || v === undefined) return v;
  if (typeof v === "string") return v ? "[redactado]" : "";
  if (typeof v === "number" || typeof v === "boolean") return "[redactado]";
  return "[redactado]";
}

/* ─────────────────── SECRETREF / RESOLUCIÓN ─────────────────── */

/**
 * normalizeSecretRef — Valida y normaliza una referencia a secreto.
 * Formatos admitidos: "<ENV_VAR>", "env:<ENV_VAR>".
 * Nunca acepta ni devuelve el valor del secreto.
 */
export function normalizeSecretRef(ref) {
  if (typeof ref !== "string") return null;
  const raw = ref.trim();
  if (!raw) return null;
  const v = raw.indexOf("env:") === 0 ? raw.slice(4).trim() : raw;
  if (!v) return null;
  if (!/^[A-Z0-9_]+$/i.test(v)) return null;
  return { kind: "env", name: v };
}

/**
 * resolveSecretRef — Resuelve la REFERENCIA al secreto (no el secreto).
 * Orden de fuentes: secretRef → keyEnv (catálogo) → CONFIG_KEY (config).
 * Devuelve { ok, source, ref } — jamás el valor de la credencial.
 */
export function resolveSecretRef(providerCfg, cfg) {
  const id = providerCfg && providerCfg.id;
  const entry = id ? catalogEntry(id) : null;

  const explicit = normalizeSecretRef(providerCfg && providerCfg.secretRef);
  if (explicit) return { ok: true, source: "secretRef", ref: explicit };

  if (providerCfg && typeof providerCfg.keyEnv === "string" && providerCfg.keyEnv.trim()) {
    const n = normalizeSecretRef(providerCfg.keyEnv);
    if (n) return { ok: true, source: "keyEnv", ref: n };
  }

  if (entry && entry.keyEnv) {
    return { ok: true, source: "keyEnv", ref: { kind: "env", name: entry.keyEnv } };
  }

  return { ok: false, source: null, ref: null };
}

/* ───────────────── DISPONIBILIDAD / hasKey ───────────────── */

/**
 * hasKey — ¿Existe una credencial utilizable para este proveedor?
 * Separate de "available": un proveedor puede estar configurado y no tener clave.
 */
export function hasKey(providerCfg, env) {
  const r = resolveSecretRef(providerCfg, env);
  if (!r.ok || !r.ref || r.ref.kind !== "env") return false;
  const v = env ? env[r.ref.name] : null;
  return typeof v === "string" && v.length > 0;
}

/**
 * isEnabled — ¿El proveedor está activo según providersOn?
 */
export function isEnabled(id, cfg) {
  const on = cfg && isPlainObject(cfg.providersOn) ? cfg.providersOn : {};
  return on[id] !== false;
}

/**
 * availableProviders — Estado de CADA proveedor del catálogo, separando
 * "configurado/available" de "tiene credencial (hasKey)".
 * Incluye probe (configuración efectiva), redactado y sin efectos secundarios.
 */
export function availableProviders(env, cfg) {
  return CATALOG.map(function (p) {
    const enabled = isEnabled(p.id, cfg);
    const key = hasKey(p, env);
    return {
      id: p.id,
      name: p.name,
      model: p.model,
      keyEnv: p.keyEnv,
      available: true,
      enabled: enabled,
      hasKey: key,
      secretRef: (normalizeSecretRef(p.keyEnv) || {}).name || p.keyEnv,
      probe: probeProvider(p, env, cfg)
    };
  });
}

/* ───────────────────────── PROBE ───────────────────────── */

/**
 * probeProvider — Comprobación de estado/configuración de UN proveedor.
 * Puro y aislado: no modifica cfg, no modifica el orden, no escribe secretos,
 * no llama a la red. Su salida está redactada.
 */
export function probeProvider(providerCfg, env, cfg) {
  const id = providerCfg && providerCfg.id;
  const entry = id ? catalogEntry(id) : null;
  const ref = resolveSecretRef(providerCfg, cfg);
  const key = hasKey(providerCfg, env);
  const enabled = id ? isEnabled(id, cfg) : false;
  const order = normalizeProviderOrder(cfg && cfg.providerOrder);
  const position = id ? order.indexOf(id) : -1;

  return {
    id: id || null,
    known: !!entry,
    name: entry ? entry.name : null,
    url: entry ? entry.url : null,
    model: entry ? entry.model : null,
    enabled: enabled,
    inOrder: position !== -1,
    position: position,
    secretConfigured: ref.ok,
    secretSource: ref.source,
    secretRef: ref.ref ? ref.ref.name : null,
    hasKey: key,
    ready: !!(entry && enabled && key),
    reason: !entry ? "proveedor_desconocido"
      : !enabled ? "desactivado"
      : !key ? "sin_credencial"
      : "ok"
  };
}

/**
 * probeAll — Probe de todo el catálogo. No muta su entrada.
 */
export function probeAll(env, cfg) {
  return CATALOG.map(function (p) { return probeProvider(p, env, cfg); });
}

/* ───────────────── NORMALIZACIÓN / LÍMITE ───────────────── */

/**
 * normalizeProviderOrder — V1 y v2 legibles. Deduplica, descarta ids
 * desconocidos y garantiza que ningún proveedor legítimo existente se
 * pierda por el límite. Aplica MAX_PROVIDERS.
 */
export function normalizeProviderOrder(raw, max) {
  const limit = Number.isInteger(max) && max > 0 ? max : MAX_PROVIDERS;
  const out = [];
  const seen = {};
  const src = Array.isArray(raw) ? raw : [];
  for (const id of src) {
    if (typeof id !== "string" || !id) continue;
    if (seen[id] === true) continue;
    if (!catalogEntry(id)) continue;
    if (out.length >= limit) continue;
    seen[id] = true;
    out.push(id);
  }
  /* Preservar proveedores legítimos ya configurados: los del catálogo que
     falten en el orden y estén activos se añaden al final (nunca se borra). */
  const on = {};
  for (const id of out) on[id] = true;
  if (src.length && Array.isArray(raw)) {
    for (const p of CATALOG) {
      if (out.length >= limit) break;
      if (on[p.id] === true) continue;
      if (src.indexOf(p.id) === -1) continue;
      on[p.id] = true;
      out.push(p.id);
    }
  }
  return out;
}

/**
 * enforceMaxProviders — Impedir configuraciones que excedan el máximo.
 * Nunca elimina proveedores legítimos: si el orden excede el límite, se
 * conserva el orden y se marca el exceso (no se borra nada en silencio).
 */
export function enforceMaxProviders(order, max) {
  const limit = Number.isInteger(max) && max > 0 ? max : MAX_PROVIDERS;
  const arr = Array.isArray(order) ? order.slice() : [];
  const applied = arr.slice(0, limit);
  return {
    limit: limit,
    applied: applied,
    total: arr.length,
    exceeded: arr.length > limit,
    truncated: arr.slice(limit)
  };
}

/**
 * normalizeProvidersOn — Objeto de activación completo sobre el catálogo.
 */
export function normalizeProvidersOn(raw) {
  const on = {};
  const src = isPlainObject(raw) ? raw : {};
  for (const p of CATALOG) on[p.id] = src[p.id] !== false;
  return on;
}

/* ───────────────────── CONFIG v1 → v2 ───────────────────── */

function pickLegacyScalars(cfg) {
  const out = {};
  const keys = [
    "systemDiaria", "systemRel", "systemLaboral", "systemAprendizaje",
    "systemPers", "systemAV", "systemLarga"
  ];
  for (const k of keys) {
    if (typeof cfg[k] === "string") out[k] = cfg[k];
  }
  if (typeof cfg.temperature === "number" && cfg.temperature >= 0 && cfg.temperature <= 2) {
    out.temperature = cfg.temperature;
  }
  if (Number.isInteger(cfg.maxTokens) && cfg.maxTokens >= 128 && cfg.maxTokens <= 8192) {
    out.maxTokens = cfg.maxTokens;
  }
  if (typeof cfg.lenDefault === "string") out.lenDefault = cfg.lenDefault;
  if (typeof cfg.useCorta === "boolean") out.useCorta = cfg.useCorta;
  if (typeof cfg.useLarga === "boolean") out.useLarga = cfg.useLarga;
  return out;
}

/**
 * migrateV1toV2 — v1 (sin `version`) → representación v2.
 * REVERSIBLE y NO DESTRUCTIVA:
 *  - conserva providerOrder y providersOn (claves v1) tal cual;
 *  - no borra ninguna clave existente;
 *  - añade `version: 2` y `providers` (metadatos + secretRef).
 */
export function migrateV1toV2(v1) {
  const src = isPlainObject(v1) ? v1 : {};
  /* v1 usa providerOrder/providersOn; v2 puede traer ya order/on/providers.
     Se leen ambos para que la migración sea idempotente y no destruya la
     capa v2 existente (p. ej. un secretRef explícito). */
  const rawOrder = Array.isArray(src.order) && src.order.length ? src.order : src.providerOrder;
  const rawOn = isPlainObject(src.on) && Object.keys(src.on).length ? src.on : src.providersOn;
  const order = normalizeProviderOrder(rawOrder);
  const on = normalizeProvidersOn(rawOn);

  const prev = isPlainObject(src.providers) ? src.providers : {};
  const providers = {};
  for (const p of CATALOG) {
    const pc = isPlainObject(prev[p.id]) ? prev[p.id] : {};
    const ref = normalizeSecretRef(pc.secretRef) || normalizeSecretRef(p.keyEnv);
    providers[p.id] = {
      id: p.id,
      name: p.name,
      model: typeof pc.model === "string" && pc.model ? pc.model : p.model,
      enabled: pc.enabled !== undefined ? pc.enabled !== false : on[p.id] !== false,
      secretRef: ref ? ref.name : p.keyEnv
    };
  }

  const out = {};
  /* 1) Copia íntegra de la entrada: nada se destruye. */
  for (const k of Object.keys(src)) out[k] = src[k];
  /* 2) v1 normalizado: se conservan tal cual si existían (compatibilidad). */
  if (src.providerOrder !== undefined) out.providerOrder = src.providerOrder;
  if (src.providersOn !== undefined) out.providersOn = src.providersOn;
  /* 3) Capa v2. */
  out.version = CONFIG_VERSION;
  out.providers = providers;
  out.order = order;
  out.on = on;
  return out;
}

/**
 * readConfig — Lectura compatible. Acepta v1 (sin version) y v2 y devuelve
 * siempre la representación v2 normalizada. No escribe nada.
 */
export function readConfig(raw) {
  let parsed = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return migrateV1toV2({});
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return migrateV1toV2({});
    }
  }
  if (!isPlainObject(parsed)) return migrateV1toV2({});
  if (parsed.version === CONFIG_VERSION) {
    const out = migrateV1toV2(parsed);
    return out;
  }
  return migrateV1toV2(parsed);
}

/**
 * downgradeV2toV1 — Revertir a v1 sin pérdida. Permite deshacer la
 * migración (reversibilidad) eliminando solo la capa v2 añadida.
 */
export function downgradeV2toV1(v2) {
  const src = isPlainObject(v2) ? v2 : {};
  const out = {};
  for (const k of Object.keys(src)) {
    if (k === "version" || k === "providers" || k === "order" || k === "on") continue;
    out[k] = src[k];
  }
  return out;
}

/* ─────────────────── SANITIZE / BUILD (v1+v2) ─────────────────── */

/**
 * sanitizeConfig — Validación de entrada (PUT /api/config). Conserva el
 * comportamiento v1 y añade la capa v2. Rechaza órdenes > MAX_PROVIDERS.
 */
export function sanitizeConfig(body) {
  const src = isPlainObject(body) ? body : {};
  const cfg = {};

  const limit = enforceMaxProviders(
    normalizeProviderOrder(src.providerOrder || src.order),
    MAX_PROVIDERS
  );
  if (limit.applied.length) cfg.providerOrder = limit.applied;

  if (src.providersOn !== undefined || src.on !== undefined) {
    cfg.providersOn = normalizeProvidersOn(src.providersOn || src.on);
  }

  /* secretRef explícito por proveedor (metadato, nunca el secreto). */
  if (isPlainObject(src.providers)) {
    const providers = {};
    let any = false;
    for (const p of CATALOG) {
      const pc = isPlainObject(src.providers[p.id]) ? src.providers[p.id] : {};
      const ref = normalizeSecretRef(pc.secretRef) || normalizeSecretRef(p.keyEnv);
      if (!ref) continue;
      providers[p.id] = {
        id: p.id,
        name: p.name,
        model: typeof pc.model === "string" && pc.model ? pc.model : p.model,
        enabled: pc.enabled !== false,
        secretRef: ref.name
      };
      any = true;
    }
    if (any) cfg.providers = providers;
  }

  const legacy = pickLegacyScalars(src);
  for (const k of Object.keys(legacy)) cfg[k] = legacy[k];

  cfg.version = CONFIG_VERSION;
  return cfg;
}

/* ───────────────────────── MERGE (PUT seguro) ───────────────────────── */

/**
 * mergeConfig — Fusión segura para PUT /api/config (defecto N-10).
 *
 * POR QUÉ EXISTE: el PUT reemplazaba la config de KV con sanitizeConfig(body).
 * El panel envía un cuerpo PARCIAL y además recibió antes un cuerpo
 * REDACTADO (GET), de modo que un guardado normal podía destruir claves
 * vivas de la configuración (temperature, maxTokens, system*, providers).
 * Con merge, el cuerpo del PUT describe QUÉ cambiar; el resto sobrevive.
 *
 * Reglas:
 *  - Bloques estructurales (providers/order/on/providerOrder/providersOn):
 *    el cuerpo del PUT manda — son bloques que la UI edita como conjunto.
 *  - Resto de claves (escalares y system*): solo se cambian si vienen
 *    explícitas en el cuerpo; si no, se conserva el valor existente.
 *  - Un centinela de redacción ("[redactado]") JAMÁS entra: se descarta y
 *    se conserva el valor existente. Es el cinturón contra el eco del GET.
 *  - Devuelve { base, patch, merged } para auditar la operación.
 */
export function mergeConfig(existing, body) {
  const base = isPlainObject(existing) ? existing : {};
  const src = isPlainObject(body) ? body : {};
  const patch = sanitizeConfig(src);
  const REDACTADO = "[redactado]";
  const STRUCTURAL = {
    order: true,
    on: true,
    providerOrder: true,
    providersOn: true,
    providers: true
  };

  /* 1) Punto de partida: todo lo existente. */
  const merged = {};
  for (const k of Object.keys(base)) merged[k] = base[k];

  /* 2) Bloques estructurales: el PUT los define por completo. */
  for (const k of Object.keys(patch)) {
    if (STRUCTURAL[k]) merged[k] = patch[k];
  }

  /* 3) Escalares y system*: solo lo que vino explícito y no redactado. */
  for (const k of Object.keys(patch)) {
    if (STRUCTURAL[k] || k === "version") continue;
    if (src[k] === undefined) continue;
    if (patch[k] === REDACTADO) continue;
    merged[k] = patch[k];
  }

  merged.version = CONFIG_VERSION;
  return { base: base, patch: patch, merged: merged };
}

/**
 * buildProviders — Preservado de PRO. Devuelve los proveedores ACTIVOS y con
 * credencial, en orden, para la llamada saliente. Es el único punto donde se
 * toca el valor real de la credencial (y nunca se devuelve fuera).
 */
export function buildProviders(env, cfg) {
  const v2 = readConfig(cfg);
  const order = v2.order && v2.order.length ? v2.order : normalizeProviderOrder(DEFAULT_ORDER);
  const list = [];
  for (const id of order) {
    const meta = catalogEntry(id);
    if (!meta) continue;
    if (v2.on && v2.on[id] === false) continue;
    const resolved = v2.providers && v2.providers[id]
      ? v2.providers[id]
      : meta;
    const ref = resolveSecretRef(resolved, env);
    if (!ref.ok) continue;
    const key = env[ref.ref.name];
    if (!key) continue;
    list.push({
      name: meta.name,
      url: meta.url,
      key: key,
      model: resolved.model || meta.model,
      googleThinking: meta.googleThinking
    });
  }
  return list;
}
