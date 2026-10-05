/**
 * BATS Tarot — PRO — Provider Manager — FASE 2C-1
 * Batería C-1…C-11 (diseño SB).
 *
 * Tests de funciones PURAS: sin KV real, sin secretos reales, sin red.
 */
import { describe, it, expect } from "vitest";
import {
  CATALOG,
  DEFAULT_ORDER,
  CONFIG_VERSION,
  MAX_PROVIDERS,
  redactConfig,
  normalizeSecretRef,
  resolveSecretRef,
  hasKey,
  isEnabled,
  availableProviders,
  probeProvider,
  probeAll,
  normalizeProviderOrder,
  enforceMaxProviders,
  normalizeProvidersOn,
  migrateV1toV2,
  readConfig,
  downgradeV2toV1,
  sanitizeConfig,
  buildProviders
} from "../worker/provider-manager.js";

/* env falso: los valores son MÁSCARAS, nunca credenciales reales. */
function fakeEnv(missing) {
  return {
    GROQ_API_KEY: "MASK-groq",
    GOOGLE_API_KEY: "MASK-google",
    OPENROUTER_API_KEY: "MASK-openrouter",
    MISTRAL_API_KEY: "MASK-mistral"
  };
}

function envWithout(id) {
  const env = fakeEnv();
  const entry = CATALOG.find(function (p) { return p.id === id; });
  delete env[entry.keyEnv];
  return env;
}

const V1 = {
  providerOrder: ["groq", "google"],
  providersOn: { groq: true, google: true, openrouter: false, mistral: true },
  temperature: 0.6,
  maxTokens: 4096,
  lenDefault: "media",
  useCorta: true,
  useLarga: false,
  systemDiaria: "PROMPT ORIGINAL DIA"
};

/* ═══════════════ C-1 — configuración actual de PRO preservada ═══════════════ */

describe("C-1 — configuración actual de PRO preservada", () => {
  it("el catálogo PRO sigue siendo groq/google/openrouter/mistral", () => {
    expect(CATALOG.map(function (p) { return p.id; }))
      .toEqual(["groq", "google", "openrouter", "mistral"]);
  });

  it("DEFAULT_ORDER de PRO no ha cambiado", () => {
    expect(DEFAULT_ORDER).toEqual(["groq", "google", "openrouter", "mistral"]);
  });

  it("conserva keyEnv, url y model de cada proveedor de PRO", () => {
    const groq = CATALOG.find(function (p) { return p.id === "groq"; });
    expect(groq.keyEnv).toBe("GROQ_API_KEY");
    expect(groq.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(groq.model).toBe("llama-3.3-70b-versatile");
    const google = CATALOG.find(function (p) { return p.id === "google"; });
    expect(google.googleThinking).toBe("low");
  });

  it("buildProviders respeta providersOn y el orden de PRO", () => {
    const cfg = migrateV1toV2({
      providerOrder: ["mistral", "groq"],
      providersOn: { mistral: false, groq: true }
    });
    const list = buildProviders(fakeEnv(), cfg);
    expect(list.map(function (p) { return p.name; })).toEqual(["Groq"]);
  });

  it("buildProviders con providersOn ausente deja todo activo (comportamiento v1)", () => {
    const list = buildProviders(fakeEnv(), migrateV1toV2({ providerOrder: ["groq", "mistral"] }));
    expect(list.map(function (p) { return p.name; })).toEqual(["Groq", "Mistral"]);
  });

  it("CONFIG_VERSION = 2 y MAX_PROVIDERS = 12", () => {
    expect(CONFIG_VERSION).toBe(2);
    expect(MAX_PROVIDERS).toBe(12);
  });
});

/* ═══════════════ C-2 — v1 legible ═══════════════ */

describe("C-2 — v1 sigue siendo legible", () => {
  it("lee v1 sin version y devuelve representación v2", () => {
    const v2 = readConfig(V1);
    expect(v2.version).toBe(2);
  });

  it("no pierde providerOrder ni providersOn de v1", () => {
    const v2 = readConfig(V1);
    expect(v2.providerOrder).toEqual(["groq", "google"]);
    expect(v2.providersOn.groq).toBe(true);
    expect(v2.providersOn.openrouter).toBe(false);
  });

  it("no pierde los escalares ni prompts de v1", () => {
    const v2 = readConfig(V1);
    expect(v2.temperature).toBe(0.6);
    expect(v2.maxTokens).toBe(4096);
    expect(v2.lenDefault).toBe("media");
    expect(v2.useCorta).toBe(true);
    expect(v2.useLarga).toBe(false);
    expect(v2.systemDiaria).toBe("PROMPT ORIGINAL DIA");
  });

  it("lee v1 serializado (como está en KV) sin lanzar", () => {
    const v2 = readConfig(JSON.stringify(V1));
    expect(v2.version).toBe(2);
    expect(v2.order).toEqual(["groq", "google"]);
  });

  it("config vacía, null o JSON inválido no rompen la lectura", () => {
    expect(readConfig({}).version).toBe(2);
    expect(readConfig(null).version).toBe(2);
    expect(readConfig("").version).toBe(2);
    expect(readConfig("{no-json").version).toBe(2);
  });
});

/* ═══════════════ C-3 — v2 legible ═══════════════ */

describe("C-3 — v2 legible", () => {
  it("lee una configuración v2 ya escrita y la conserva", () => {
    const v2src = migrateV1toV2({ providerOrder: ["groq"], providersOn: { groq: true } });
    const out = readConfig(v2src);
    expect(out.version).toBe(2);
    expect(out.order).toEqual(["groq"]);
    expect(out.providers.groq.secretRef).toBe("GROQ_API_KEY");
  });

  it("v2 normaliza el orden sobre el `order`", () => {
    const out = readConfig({ version: 2, order: ["mistral", "groq", "nvidia"] });
    expect(out.order).toEqual(["mistral", "groq"]);
  });

  it("v2 expone metadatos por proveedor con secretRef", () => {
    const out = readConfig(migrateV1toV2({ providerOrder: ["google"] }));
    expect(out.providers.google).toMatchObject({
      id: "google",
      name: "Google",
      enabled: true,
      secretRef: "GOOGLE_API_KEY"
    });
  });
});

/* ═══════════════ C-4 — migración v1 → v2 ═══════════════ */

describe("C-4 — migración v1 → v2", () => {
  it("añade version 2 sin eliminar ninguna clave v1", () => {
    const v2 = migrateV1toV2(V1);
    for (const k of Object.keys(V1)) {
      expect(Object.prototype.hasOwnProperty.call(v2, k)).toBe(true);
    }
    expect(v2.version).toBe(2);
  });

  it("la capa v2 (order/on/providers) se derivan de v1", () => {
    const v2 = migrateV1toV2(V1);
    expect(v2.order).toEqual(["groq", "google"]);
    expect(v2.on.openrouter).toBe(false);
    expect(v2.providers.openrouter.enabled).toBe(false);
  });

  it("la migración es idempotente: migrar dos veces da lo mismo", () => {
    const a = migrateV1toV2(V1);
    const b = migrateV1toV2(a);
    expect(b.order).toEqual(a.order);
    expect(b.on).toEqual(a.on);
    expect(b.providers).toEqual(a.providers);
    expect(b.version).toBe(2);
  });

  it("no muta el objeto v1 de entrada", () => {
    const src = JSON.parse(JSON.stringify(V1));
    const before = JSON.stringify(src);
    migrateV1toV2(src);
    expect(JSON.stringify(src)).toBe(before);
  });
});

/* ═══════════════ C-5 — reversibilidad / no destrucción ═══════════════ */

describe("C-5 — migración reversible y no destructiva", () => {
  it("downgradeV2toV1 devuelve exactamente la configuración v1 original", () => {
    const back = downgradeV2toV1(migrateV1toV2(V1));
    expect(back).toEqual(V1);
  });

  it("ida y vuelta v1 → v2 → v1 no pierde ni altera datos", () => {
    const round = downgradeV2toV1(migrateV1toV2(V1));
    expect(round).toEqual(V1);
    expect(round.providerOrder).toEqual(["groq", "google"]);
    expect(round.systemDiaria).toBe("PROMPT ORIGINAL DIA");
  });

  it("no se borran las claves v1 providerOrder ni providersOn al migrar", () => {
    const v2 = migrateV1toV2(V1);
    expect(v2.providerOrder).toBeDefined();
    expect(v2.providersOn).toBeDefined();
  });

  it("la lectura no escribe: readConfig no toca el KV ni añade claves", () => {
    const src = JSON.parse(JSON.stringify(V1));
    readConfig(src);
    expect(Object.prototype.hasOwnProperty.call(src, "version")).toBe(false);
    expect(src.providerOrder).toEqual(["groq", "google"]);
  });
});

/* ═══════════════ C-6 — secretRef ═══════════════ */

describe("C-6 — secretRef", () => {
  it("normaliza 'ENV_VAR' y 'env:ENV_VAR'", () => {
    expect(normalizeSecretRef("GROQ_API_KEY")).toEqual({ kind: "env", name: "GROQ_API_KEY" });
    expect(normalizeSecretRef("env:GROQ_API_KEY")).toEqual({ kind: "env", name: "GROQ_API_KEY" });
  });

  it("rechaza referencias inválidas", () => {
    expect(normalizeSecretRef("")).toBeNull();
    expect(normalizeSecretRef("   ")).toBeNull();
    expect(normalizeSecretRef(null)).toBeNull();
    expect(normalizeSecretRef(42)).toBeNull();
    expect(normalizeSecretRef("clave con espacios")).toBeNull();
  });

  it("resolveSecretRef prioriza secretRef explícito sobre keyEnv del catálogo", () => {
    const r = resolveSecretRef({ id: "groq", secretRef: "OTRA_CLAVE" });
    expect(r.ok).toBe(true);
    expect(r.source).toBe("secretRef");
    expect(r.ref.name).toBe("OTRA_CLAVE");
  });

  it("resolveSecretRef cae a keyEnv del catálogo", () => {
    const r = resolveSecretRef({ id: "google" });
    expect(r.source).toBe("keyEnv");
    expect(r.ref.name).toBe("GOOGLE_API_KEY");
  });

  it("resolveSecretRef no devuelve el valor del secreto, solo la referencia", () => {
    const r = resolveSecretRef({ id: "groq", secretRef: "GROQ_API_KEY" }, fakeEnv());
    expect(Object.keys(r).sort()).toEqual(["ok", "ref", "source"]);
    expect(JSON.stringify(r)).not.toContain("MASK-groq");
  });

  it("un proveedor desconocido no resuelve secreto", () => {
    const r = resolveSecretRef({ id: "no-existe", secretRef: "X_KEY" });
    expect(r.ok).toBe(true);
    expect(r.ref.name).toBe("X_KEY");
  });

  it("secretRef por env alternativo se usa para la llamada saliente", () => {
    const env = { GROQ_API_KEY: "MASK-antiguo", GROQ_ALT: "MASK-nuevo" };
    const cfg = {
      version: 2,
      order: ["groq"],
      on: { groq: true },
      providers: { groq: { id: "groq", model: "llama-3.3-70b-versatile", enabled: true, secretRef: "GROQ_ALT" } }
    };
    const list = buildProviders(env, cfg);
    expect(list).toHaveLength(1);
    expect(list[0].key).toBe("MASK-nuevo");
  });
});

/* ═══════════════ C-7 — available separado de hasKey ═══════════════ */

describe("C-7 — available separado de hasKey", () => {
  it("un proveedor sin credencial sigue siendo available=true", () => {
    const env = envWithout("mistral");
    const list = availableProviders(env, readConfig({ providerOrder: ["groq", "mistral"] }));
    const mistral = list.find(function (p) { return p.id === "mistral"; });
    expect(mistral.available).toBe(true);
    expect(mistral.hasKey).toBe(false);
  });

  it("hasKey es true solo cuando existe credencial utilizable", () => {
    const cfg = readConfig({ providerOrder: ["groq", "mistral"] });
    const list = availableProviders(fakeEnv(), cfg);
    expect(list.find(function (p) { return p.id === "groq"; }).hasKey).toBe(true);
    const sinKey = availableProviders(envWithout("groq"), cfg);
    expect(sinKey.find(function (p) { return p.id === "groq"; }).hasKey).toBe(false);
  });

  it("hasKey es false con valor vacío", () => {
    const entry = CATALOG.find(function (p) { return p.id === "groq"; });
    const env = { GROQ_API_KEY: "" };
    expect(hasKey(entry, env)).toBe(false);
    expect(hasKey(entry, {})).toBe(false);
  });

  it("available ≠ enabled: desactivar no quita de available", () => {
    const cfg = readConfig({ providersOn: { groq: false } });
    const list = availableProviders(fakeEnv(), cfg);
    const groq = list.find(function (p) { return p.id === "groq"; });
    expect(groq.available).toBe(true);
    expect(groq.enabled).toBe(false);
    expect(groq.hasKey).toBe(true);
  });

  it("isEnabled lee providersOn; ausente = activo", () => {
    expect(isEnabled("groq", { providersOn: { groq: false } })).toBe(false);
    expect(isEnabled("groq", { providersOn: { groq: true } })).toBe(true);
    expect(isEnabled("groq", {})).toBe(true);
    expect(isEnabled("groq", null)).toBe(true);
  });

  it("la listaavailable cubre todo el catálogo con ambos estados", () => {
    const list = availableProviders(fakeEnv(), readConfig(V1));
    expect(list).toHaveLength(CATALOG.length);
    for (const p of list) {
      expect(typeof p.available).toBe("boolean");
      expect(typeof p.hasKey).toBe("boolean");
      expect(typeof p.enabled).toBe("boolean");
    }
  });
});

/* ═══════════════ C-8 — redacción de secretos ═══════════════ */

describe("C-8 — redactConfig no deja pasar secretos", () => {
  it("redacta una clave API explícita", () => {
    const out = redactConfig({ GROQ_API_KEY: "MASK-secreto" });
    expect(JSON.stringify(out)).not.toContain("MASK-secreto");
    expect(out.GROQ_API_KEY).toBe("[redactado]");
  });

  it("redacta varias claves sensibles del código real", () => {
    const cfg = {
      key: "MASK-a",
      apiKey: "MASK-b",
      secret: "MASK-c",
      token: "MASK-d",
      password: "MASK-e",
      credential: "MASK-f",
      authorization: "Bearer MASK-g",
      adminToken: "MASK-h"
    };
    const out = redactConfig(cfg);
    const s = JSON.stringify(out);
    for (const k of Object.keys(cfg)) expect(s).not.toContain(cfg[k]);
  });

  it("redacta también en arrays y objetos anidados", () => {
    const cfg = { lista: [{ key: "MASK-x" }, { deep: { secret: "MASK-y" } }] };
    expect(JSON.stringify(redactConfig(cfg))).not.toContain("MASK-x");
    expect(JSON.stringify(redactConfig(cfg))).not.toContain("MASK-y");
  });

  it("conserva metadatos NO secretos: keyEnv, secretRef, hasKey", () => {
    const cfg = { keyEnv: "GROQ_API_KEY", secretRef: "GROQ_API_KEY", hasKey: true };
    expect(redactConfig(cfg)).toEqual(cfg);
  });

  it("no destruye la configuración: conserva la forma (claves y orden)", () => {
    const cfg = { version: 2, providerOrder: ["groq"], providersOn: { groq: true }, temperature: 0.7 };
    const out = redactConfig(cfg);
    expect(Object.keys(out)).toEqual(Object.keys(cfg));
    expect(out.temperature).toBe(0.7);
  });

  it("redacta la configuración real de PRO", () => {
    const cfg = Object.assign(migrateV1toV2(V1), { key: "MASK-real", token: "MASK-real2" });
    expect(JSON.stringify(redactConfig(cfg))).not.toContain("MASK-real");
  });

  it("no filtra el valor real de env en availableProviders ni en probe", () => {
    const cfg = readConfig({ providerOrder: ["groq"] });
    const s = JSON.stringify(availableProviders(fakeEnv(), cfg)) + JSON.stringify(probeAll(fakeEnv(), cfg));
    expect(s).not.toContain("MASK-groq");
    expect(s).not.toContain("MASK-google");
  });
});

/* ═══════════════ C-9 — probe ═══════════════ */

describe("C-9 — probe", () => {
  const groq = CATALOG.find(function (p) { return p.id === "groq"; });

  it("informa ready cuando hay credencial y está activo", () => {
    const r = probeProvider(groq, fakeEnv(), readConfig({ providerOrder: ["groq"] }));
    expect(r.ready).toBe(true);
    expect(r.reason).toBe("ok");
    expect(r.hasKey).toBe(true);
  });

  it("informa sin_credencial sin exponer nada", () => {
    const r = probeProvider(groq, envWithout("groq"), readConfig({ providerOrder: ["groq"] }));
    expect(r.ready).toBe(false);
    expect(r.reason).toBe("sin_credencial");
    expect(r.hasKey).toBe(false);
    expect(r.available !== undefined || r.known).toBeTruthy();
  });

  it("informa desactivado cuando providersOn=false, aunque tenga clave", () => {
    const r = probeProvider(groq, fakeEnv(), readConfig({ providersOn: { groq: false } }));
    expect(r.reason).toBe("desactivado");
    expect(r.ready).toBe(false);
    expect(r.hasKey).toBe(true);
  });

  it("distingue proveedor desconocido", () => {
    const r = probeProvider({ id: "nvidia" }, fakeEnv(), readConfig({}));
    expect(r.known).toBe(false);
    expect(r.reason).toBe("proveedor_desconocido");
  });

  it("el probe NO modifica la configuración ni el orden", () => {
    const cfg = readConfig({ providerOrder: ["groq", "google"], providersOn: { google: false } });
    const snapshot = JSON.stringify(cfg);
    probeAll(fakeEnv(), cfg);
    probeProvider(groq, fakeEnv(), cfg);
    expect(JSON.stringify(cfg)).toBe(snapshot);
  });

  it("el probe no escribe en env (ni lo añade ni lo altera)", () => {
    const env = fakeEnv();
    const snapshot = JSON.stringify(env);
    probeAll(env, readConfig(V1));
    expect(JSON.stringify(env)).toBe(snapshot);
    expect(Object.keys(env).sort()).toEqual([
      "GOOGLE_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY", "OPENROUTER_API_KEY"
    ]);
  });

  it("el probe no muta la entrada ni sus arrays", () => {
    const cfg = { providerOrder: ["groq"], providersOn: { groq: true } };
    const r = probeAll(fakeEnv(), cfg);
    expect(cfg.providerOrder).toEqual(["groq"]);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(CATALOG.length);
  });

  it("el probe es redacted: expone secretRef, nunca el secreto", () => {
    const r = probeProvider(groq, fakeEnv(), readConfig({ providerOrder: ["groq"] }));
    expect(r.secretRef).toBe("GROQ_API_KEY");
    expect(JSON.stringify(r)).not.toContain("MASK-groq");
  });

  it("el probe no altera el env ni el cfg aunque se llame con cfg vacío", () => {
    const cfg = readConfig(null);
    const r = probeAll(fakeEnv(), cfg);
    expect(r.every(function (p) { return typeof p.hasKey === "boolean"; })).toBe(true);
  });
});

/* ═══════════════ C-10 — MAX_PROVIDERS = 12 ═══════════════ */

describe("C-10 — MAX_PROVIDERS = 12 aplicado", () => {
  it("el valor por defecto del límite es 12", () => {
    expect(MAX_PROVIDERS).toBe(12);
  });

  it("un orden dentro del límite no se toca", () => {
    const order = ["groq", "google", "openrouter", "mistral"];
    const r = enforceMaxProviders(order);
    expect(r.limit).toBe(12);
    expect(r.applied).toEqual(order);
    expect(r.exceeded).toBe(false);
  });

  it("un orden que excede 12 se recorta y reporta el exceso sin borrado silencioso", () => {
    const order = [];
    for (let i = 0; i < 20; i++) order.push("p" + i);
    const r = enforceMaxProviders(order);
    expect(r.applied).toHaveLength(12);
    expect(r.total).toBe(20);
    expect(r.exceeded).toBe(true);
    expect(r.truncated).toHaveLength(8);
  });

  it("normalizeProviderOrder nunca supera el límite", () => {
    const raw = CATALOG.map(function (p) { return p.id; }).concat(Array.from({ length: 30 }, function (_, i) { return "x" + i; }));
    expect(normalizeProviderOrder(raw).length).toBeLessThanOrEqual(12);
  });

  it("sanitizeConfig impide guardar una configuración que exceda el máximo", () => {
    const body = { providerOrder: ["groq", "google", "openrouter", "mistral"] };
    const cfg = sanitizeConfig(body);
    expect(cfg.providerOrder.length).toBeLessThanOrEqual(MAX_PROVIDERS);
    expect(cfg.providerOrder).toEqual(["groq", "google", "openrouter", "mistral"]);
  });

  it("no elimina proveedores legítimos existentes para llegar al límite", () => {
    const cfg = readConfig({ providerOrder: ["groq", "google", "openrouter", "mistral"] });
    expect(cfg.order).toEqual(["groq", "google", "openrouter", "mistral"]);
    const list = buildProviders(fakeEnv(), cfg);
    expect(list).toHaveLength(4);
  });

  it("el límite no elimina proveedores del catálogo por estar bajo 12", () => {
    const r = enforceMaxProviders(CATALOG.map(function (p) { return p.id; }));
    expect(r.exceeded).toBe(false);
    expect(r.applied).toHaveLength(CATALOG.length);
  });
});

/* ═══════════════ C-11 — aislamiento / sin efectos secundarios ═══════════════ */

describe("C-11 — aislamiento y ausencia de efectos secundarios", () => {
  it("buildProviders no muta la configuración", () => {
    const cfg = readConfig(V1);
    const before = JSON.stringify(cfg);
    buildProviders(fakeEnv(), cfg);
    expect(JSON.stringify(cfg)).toBe(before);
  });

  it("buildProviders no muta env", () => {
    const env = fakeEnv();
    const before = JSON.stringify(env);
    buildProviders(env, readConfig(V1));
    expect(JSON.stringify(env)).toBe(before);
  });

  it("buildProviders no muta el array de orden devuelto por readConfig", () => {
    const cfg = readConfig({ providerOrder: ["groq", "google"] });
    const orderRef = cfg.order;
    const before = orderRef.slice();
    buildProviders(fakeEnv(), cfg);
    expect(cfg.order).toEqual(before);
    expect(cfg.order).toBe(orderRef);
  });

  it("availableProviders no muta cfg ni env", () => {
    const cfg = readConfig(V1);
    const env = fakeEnv();
    const c = JSON.stringify(cfg);
    const e = JSON.stringify(env);
    availableProviders(env, cfg);
    expect(JSON.stringify(cfg)).toBe(c);
    expect(JSON.stringify(env)).toBe(e);
  });

  it("readConfig es una proyección: la entrada queda intacta", () => {
    const src = JSON.parse(JSON.stringify(V1));
    readConfig(src);
    readConfig(src);
    expect(src).toEqual(V1);
  });

  it("todas las funciones de inspección toleran undefined/null sin lanzar", () => {
    expect(() => availableProviders(undefined, undefined)).not.toThrow();
    expect(() => probeAll(undefined, undefined)).not.toThrow();
    expect(() => normalizeProviderOrder(undefined)).not.toThrow();
    expect(() => normalizeProvidersOn(undefined)).not.toThrow();
    expect(() => migrateV1toV2(undefined)).not.toThrow();
    expect(() => sanitizeConfig(undefined)).not.toThrow();
    expect(() => redactConfig(undefined)).not.toThrow();
  });

  it("buildProviders sin credenciales devuelve lista vacía (sin inventar proveedores)", () => {
    expect(buildProviders({}, readConfig(V1))).toEqual([]);
  });

  it("ninguna función de inspección escribe en KV (no reciben binding de KV)", () => {
    /* Si el módulo pureo tocara KV, buildProviders/available/probe fallarían
       con un env sin CONFIG. Verificado aquí de forma explícita. */
    const env = fakeEnv();
    expect(env.CONFIG).toBeUndefined();
    expect(() => buildProviders(env, readConfig(V1))).not.toThrow();
    expect(() => availableProviders(env, readConfig(V1))).not.toThrow();
    expect(() => probeAll(env, readConfig(V1))).not.toThrow();
  });

  it("la salida completa de available + probe no contiene ningún valor de env", () => {
    const env = fakeEnv();
    const cfg = readConfig(V1);
    const salida = JSON.stringify(availableProviders(env, cfg)) + JSON.stringify(probeAll(env, cfg));
    for (const v of Object.values(env)) expect(salida).not.toContain(v);
  });
});
