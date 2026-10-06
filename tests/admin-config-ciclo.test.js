/**
 * BATS Tarot — PRO — Ciclo funcional de configuración del panel de admin (D-T1).
 *
 * POR QUÉ EXISTE ESTE FICHERO
 * --------------------------
 * El defecto D-T1 (FASE 2C-1, finding H-1) NO era visible para los 67 tests de
 * `provider-manager.test.js`. Esos tests verificaban (L1) que `redactConfig`
 * redacta claves sensibles. El defecto estaba en elCICLO: el panel de admin
 * recibía un valor redactado, lo pintaba en un input, y al guardar hacía
 *
 *     parseInt("[redactado]", 10) || 4096
 *
 * es decir, SOBRESCRIBÍA en KV el valor real. Un test unitario de
 * `redactConfig` no puede ver eso. Solo un test que recorra el ciclo completo
 * panel -> worker -> KV lo detecta.
 *
 * Este fichero es un test de NIVEL L3 (prueba funcional). No reimplementa la
 * lógica: ejecuta el `js/admin.js` real y las funciones reales de
 * `worker/provider-manager.js`. El unico elemento simulado es KV (que en PRO es
 * un binding de Cloudflare) y el DOM (minimo, suficiente para el panel).
 *
 * Lo que NO hace: verifica redaccion de secretos. Eso ya lo cubre
 * `tests/provider-manager.test.js`. Aqui se verifica que un valor de
 * configuracion NO sensible sobrevive a un viaje completo de ida y vuelta.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { redactConfig, sanitizeConfig, mergeConfig } from "../worker/provider-manager.js";

const ADMIN_SRC = readFileSync(new URL("../js/admin.js", import.meta.url), "utf8");

const CONFIG_KEY = "ai_config";

/* ───────────────────────── DOM mínimo ───────────────────────── */

function makeEl(id) {
  const el = {
    id,
    value: "",
    checked: false,
    disabled: false,
    textContent: "",
    type: "",
    style: {},
    className: "",
    children: [],
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild(child) { el.children.push(child); return child; },
    removeChild(child) {
      const i = el.children.indexOf(child);
      if (i >= 0) el.children.splice(i, 1);
      return child;
    },
    get firstChild() { return el.children[0] || null; },
    click() {},
    set onclick(fn) { el._onclick = fn; },
    get onclick() { return el._onclick; },
    set onchange(fn) { el._onchange = fn; },
    get onchange() { return el._onchange; }
  };
  return el;
}

/**
 * Crea un DOM con los ids que `js/admin.js` busca. Cualquier id no
 * declarado devuelve null, que es justo lo que hace el panel real cuando un
 * elemento opcional no existe.
 */
function makeDom() {
  const REQUIRED = [
    "admin-box", "admin-pass", "admin-panel", "admin-msg", "admin-proveedores",
    "admin-temp", "admin-temp-val", "admin-len", "admin-maxtok",
    "admin-use-corta", "admin-use-larga",
    "admin-tab-basico", "admin-tab-avanzado", "admin-tab-btn-basico", "admin-tab-btn-avanzado"
  ];
  const registry = {};
  for (const id of REQUIRED) registry[id] = makeEl(id);
  /* ids de sistemas que admin.js busca en un bucle */
  for (const g of ["diaria", "rel", "laboral", "aprendizaje", "pers", "av", "larga"]) {
    registry["admin-sys-" + g] = makeEl("admin-sys-" + g);
  }
  /* un checkbox por proveedor del catálogo, como crea adminPoblar */
  return {
    registry,
    document: {
      getElementById(id) { return registry[id] || null; },
      createElement() { return makeEl(""); }
    }
  };
}

/* ───────────────────────── KV falsa + worker real ───────────────────────── */

/**
 * Reproduce el comportamiento del worker REAL en /api/config:
 *   GET -> env.CONFIG.get(CONFIG_KEY) -> redactConfig(cfg)
 *   PUT -> sanitizeConfig(body) -> env.CONFIG.put(CONFIG_KEY, ...)
 */
function makeKv(initial) {
  let raw = JSON.stringify(initial);
  return {
    get raw() { return raw; },
    get() { return raw; },
    put(_k, v) { raw = v; },
    /** GET /api/config */
    apiGet() {
      return { config: redactConfig(JSON.parse(raw)) };
    },
    /** PUT /api/config — semántica N-10 del worker real: FUSIONA. */
    apiPut(body) {
      const r = mergeConfig(JSON.parse(raw), body);
      raw = JSON.stringify(r.merged);
      return { ok: true, config: redactConfig(r.merged) };
    },
    /** lectura cruda, como la haría un operador inspeccionando KV */
    readRaw() { return JSON.parse(raw); }
  };
}

/* ───────────────────────── Carga real de js/admin.js ───────────────────────── */

/**
 * Ejecuta el `js/admin.js` real en un sandbox con el DOM mínimo, exponiendo sus
 * funciones para poder conducirlas. `_clear` (deck.js), `toast` (app.js) y las
 * llamadas de red son los unicos puntos inyectados; el resto del archivo —incluida
 * `adminPoblar` y `adminGuardar`, donde vive el defecto— es el codigo de
 * produccion sin tocar.
 */
function loadAdminPanel(dom, kv) {
  const sandbox = {
    window: { Capacitor: null, BATS: { crypto: null } },
    document: dom.document,
    location: { search: "" },
    URLSearchParams,
    console,
    JSON,
    Date,
    parseFloat,
    parseInt,
    Promise,
    _clear(cont) { while (cont.firstChild) cont.removeChild(cont.firstChild); },
    toast() {},
    setAIFlagsLocal() {},
    adminGetToken() { return "TOKEN-DE-PRUEBA"; },
    adminSetToken() {},
    adminClearToken() {},
    adminGetConfig() { return Promise.resolve(kv.apiGet()); },
    adminSaveConfig(_tok, body) { return Promise.resolve(kv.apiPut(body)); }
  };
  sandbox.window.document = dom.document;

  const fn = new Function(
    "window", "document", "location", "URLSearchParams", "_clear", "toast",
    "adminGetToken", "adminSetToken", "adminClearToken",
    "adminGetConfig", "adminSaveConfig", "setAIFlagsLocal",
    ADMIN_SRC + "\n;return {adminEntrar,adminPoblar,adminGuardar,_adminState,adminGuardar};"
  );
  return fn(
    sandbox.window, dom.document, sandbox.location, URLSearchParams,
    sandbox._clear, sandbox.toast, sandbox.adminGetToken, sandbox.adminSetToken,
    sandbox.adminClearToken, sandbox.adminGetConfig, sandbox.adminSaveConfig,
    sandbox.setAIFlagsLocal
  );
}

/** Deja correr las promesas pendientes del panel. */
function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

/** Escenario completo: entrar -> poblar -> guardar -> releer KV. */
async function roundTrip(kv) {
  const dom = makeDom();
  const panel = loadAdminPanel(dom, kv);
  await panel.adminEntrar("TOKEN-DE-PRUEBA");
  await flush();
  return { dom, panel };
}

/* ═══════════════════════ Tests ═══════════════════════ */

describe("D-T1 · ciclo funcional de configuración del panel de admin", () => {
  it("el patrón de colisión es real: 'maxTokens' casa con el detector de secretos", () => {
    /*
     * Este es el hecho que hace que la allowlist sea NECESARIA y no decorativa.
     * Si alguien "simplifica" el detector y quita la allowlist, este test sigue
     * verde — por eso existe junto al test del ciclo completo, que sí falla.
     */
    const re = /(key|secret|token|password|passwd|credential|authorization|auth)/i;
    expect(re.test("maxTokens")).toBe(true);
    expect(re.test("maxToken")).toBe(true);
    /* y no colisiona con el resto de escalares reales de la configuración */
    for (const k of ["temperature", "lenDefault", "useCorta", "useLarga", "providerOrder", "providersOn", "version"]) {
      expect(re.test(k)).toBe(false);
    }
  });

  it("redactConfig conserva maxTokens y sigue redactando las credenciales", () => {
    const red = redactConfig({
      maxTokens: 6144,
      temperature: 0.7,
      providers: { groq: { id: "groq", name: "Groq", apiKey: "SECRETO", secretRef: "GROQ_API_KEY", keyEnv: "GROQ_API_KEY", hasKey: true } }
    });
    expect(red.maxTokens).toBe(6144);
    expect(red.temperature).toBe(0.7);
    /* la credencial sigue sin salir */
    expect(red.providers.groq.apiKey).toBe("[redactado]");
    /* y los metadatos siguen visibles para el panel */
    expect(red.providers.groq.secretRef).toBe("GROQ_API_KEY");
    expect(red.providers.groq.keyEnv).toBe("GROQ_API_KEY");
    expect(red.providers.groq.hasKey).toBe(true);
  });

  it("el panel pinta el valor real de maxTokens, no el centinela de redacción", async () => {
    const kv = makeKv({ maxTokens: 6144, temperature: 0.7, providerOrder: ["groq", "google"] });
    const { dom } = await roundTrip(kv);
    expect(dom.registry["admin-maxtok"].value).toBe(6144);
  });

  it("guardar desde el panel NO destruye maxTokens en KV (el defecto D-T1)", async () => {
    const kv = makeKv({ maxTokens: 6144, temperature: 0.7, providerOrder: ["groq", "google"] });
    const { panel } = await roundTrip(kv);

    panel.adminGuardar();
    await flush();

    expect(kv.readRaw().maxTokens).toBe(6144);
  });

  it("el valor sobrevive a N guardados consecutivos sin degradarse", async () => {
    /*
     * La corrupción del defecto D-T1 es ACUMULATIVA: el admin que abre y guarda
     * por rutina baja el valor al fallback (4096) sin ningún aviso. Repetir el
     * ciclo varias veces es lo que hace visible el defecto.
     */
    const kv = makeKv({ maxTokens: 6144, temperature: 0.7, providerOrder: ["groq", "google"] });
    const { panel, dom } = await roundTrip(kv);

    for (let i = 0; i < 5; i++) {
      panel.adminGuardar();
      await flush();
      expect(kv.readRaw().maxTokens).toBe(6144);
      expect(dom.registry["admin-maxtok"].value).toBe(6144);
    }
  });

  it("un valor que la administradora cambia a mano es el que se persiste", async () => {
    const kv = makeKv({ maxTokens: 6144, providerOrder: ["groq", "google"] });
    const { dom, panel } = await roundTrip(kv);

    dom.registry["admin-maxtok"].value = "2048";
    panel.adminGuardar();
    await flush();

    expect(kv.readRaw().maxTokens).toBe(2048);
  });

  it("un maxTokens ausente usa el fallback del panel y no se pierde el resto de la config", async () => {
    const kv = makeKv({ temperature: 0.9, providerOrder: ["groq"] });
    const { dom, panel } = await roundTrip(kv);

    expect(dom.registry["admin-maxtok"].value).toBe(4096);
    panel.adminGuardar();
    await flush();

    const raw = kv.readRaw();
    expect(raw.maxTokens).toBe(4096);
    expect(raw.temperature).toBe(0.9);
    expect(raw.providerOrder).toEqual(["groq"]);
  });

  it("los secretos nunca viajan al panel ni salen hacia KV desde el panel", async () => {
    const kv = makeKv({
      maxTokens: 6144,
      providers: { groq: { id: "groq", name: "Groq", secretRef: "GROQ_API_KEY", keyEnv: "GROQ_API_KEY", hasKey: true } }
    });
    const { dom, panel } = await roundTrip(kv);

    /* lo que ve el panel */
    expect(dom.registry["admin-maxtok"].value).toBe(6144);
    panel.adminGuardar();
    await flush();

    /* lo que queda en KV no contiene ningun valor de credencial */
    const raw = JSON.stringify(kv.readRaw());
    expect(raw).not.toContain("[redactado]");
    expect(raw).toContain("6144");
  });
});
