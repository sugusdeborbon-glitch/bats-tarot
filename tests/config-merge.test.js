/**
 * BATS Tarot — PRO — Regresión del defecto N-10 (PUT /api/config destructivo).
 *
 * POR QUÉ EXISTE ESTE FICHERO
 * ---------------------------
 * El PUT original hacía `sanitizeConfig(body)` y escribía ESO en KV. Dos
 * consecuencias: (1) el panel envía un cuerpo PARCIAL (solo lo que edita), así
 * que guardar descartaba cualquier clave que el panel no gestiona; (2) el
 * panel recibió antes un cuerpo REDACTADO por el GET, de modo que el eco de un
 * "[redactado]" podía acabar sobrescribiendo el valor real.
 *
 * Nivel L3: ejecuta las funciones REALES de worker/provider-manager.js (y la
 * semántica NUEVA del worker: merge por defecto, reset solo con ?reset=true).
 * KV es una falsa en memoria, como en admin-config-ciclo.test.js.
 */

import { describe, it, expect } from "vitest";
import {
  mergeConfig,
  sanitizeConfig,
  redactConfig,
  CONFIG_VERSION
} from "../worker/provider-manager.js";

/* KV falsa con la semántica NUEVA del worker (worker.js, rama PUT). */
function makeKv(initial) {
  let raw = JSON.stringify(initial || {});
  return {
    get() { return raw; },
    put(_k, v) { raw = v; },
    readRaw() { return JSON.parse(raw); },
    apiPut(body) {
      const prev = JSON.parse(raw);
      const r = mergeConfig(prev, body);
      raw = JSON.stringify(r.merged);
      return { ok: true, config: redactConfig(r.merged) };
    },
    apiPutReset() {
      const r = mergeConfig({}, sanitizeConfig({}));
      raw = JSON.stringify(r.merged);
      return { ok: true, config: redactConfig(r.merged) };
    }
  };
}

/* Config viva típica de PRO: escalares + system* + bloques estructurales. */
function configViva() {
  return {
    temperature: 0.7,
    maxTokens: 8192,
    lenDefault: "media",
    useCorta: true,
    useLarga: true,
    systemDiaria: "PROMPT VIVO DE DIARIA",
    providerOrder: ["groq", "google"],
    providersOn: { groq: true, google: true },
    providers: { groq: { id: "groq", name: "Groq", model: "llama-3.3-70b-versatile", enabled: true, secretRef: "GROQ_API_KEY" } }
  };
}

/* Cuerpo típico que envía js/admin.js (adminGuardar): parcial, sin system*. */
function cuerpoPanel() {
  return {
    providerOrder: ["groq", "google"],
    providersOn: { groq: true, google: true },
    temperature: 0.8,
    maxTokens: 6144,
    lenDefault: "media",
    useCorta: true,
    useLarga: true
  };
}

describe("N-10 · el PUT de /api/config fusiona, no reemplaza", () => {
  it("el defecto era real: sanitizeConfig de un cuerpo parcial pierde las claves ausentes", () => {
    /* Comportamiento VIEJO, documentado: esto es lo que destruía la config. */
    const viejo = sanitizeConfig(cuerpoPanel());
    expect(viejo.systemDiaria).toBeUndefined();
    expect(viejo.maxTokens).toBe(6144); /* el único valor que traía el cuerpo */
  });

  it("un guardado del panel conserva lo que el panel no gestiona", () => {
    const r = mergeConfig(configViva(), cuerpoPanel());
    expect(r.merged.temperature).toBe(0.8);   /* editado por el panel */
    expect(r.merged.maxTokens).toBe(6144);    /* editado por el panel */
    expect(r.merged.systemDiaria).toBe("PROMPT VIVO DE DIARIA"); /* vivo */
    expect(r.merged.providerOrder).toEqual(["groq", "google"]);
    expect(r.merged.providers.groq.secretRef).toBe("GROQ_API_KEY");
  });

  it("una clave ausente en el cuerpo mantiene su valor anterior", () => {
    const body = cuerpoPanel();
    delete body.temperature; /* el panel no la envió en este guardado */
    const r = mergeConfig(configViva(), body);
    expect(r.merged.temperature).toBe(0.7); /* la de KV, intacta */
  });

  it("un centinela de redacción JAMÁS entra en KV (eco del GET redactado)", () => {
    const r = mergeConfig(configViva(), {
      maxTokens: "[redactado]",
      systemDiaria: "[redactado]",
      temperature: "[redactado]"
    });
    expect(r.merged.maxTokens).toBe(8192);
    expect(r.merged.systemDiaria).toBe("PROMPT VIVO DE DIARIA");
    expect(r.merged.temperature).toBe(0.7);
  });

  it("un PUT con cuerpo vacío ya no borra nada", () => {
    const r = mergeConfig(configViva(), {});
    expect(r.merged.systemDiaria).toBe("PROMPT VIVO DE DIARIA");
    expect(r.merged.maxTokens).toBe(8192);
    expect(r.merged.version).toBe(CONFIG_VERSION);
  });

  it("un cuerpo basura no rompe nada ni destruye la config", () => {
    for (const basura of [null, undefined, "texto", 42, [], ["x"]]) {
      const r = mergeConfig(configViva(), basura);
      expect(r.merged.systemDiaria).toBe("PROMPT VIVO DE DIARIA");
      expect(r.merged.version).toBe(CONFIG_VERSION);
    }
  });

  it("los secretos del cuerpo jamás llegan a KV (solo pasan metadatos)", () => {
    const r = mergeConfig(configViva(), {
      apiKey: "FILTRADA-POR-ALGUIEN",
      password: "también",
      providers: { groq: { id: "groq", secretRef: "GROQ_API_KEY" } }
    });
    expect(r.merged.apiKey).toBeUndefined();
    expect(r.merged.password).toBeUndefined();
    expect(r.merged.providers.groq.secretRef).toBe("GROQ_API_KEY");
    expect(JSON.stringify(r.merged)).not.toContain("FILTRADA");
  });

  it("los bloques estructurales son del PUT: definir el orden es intencional", () => {
    const r = mergeConfig(configViva(), { providerOrder: ["google"] });
    expect(r.merged.providerOrder).toEqual(["google"]);
  });

  it("ciclo completo sobre KV: guardar desde el panel NO corrompe nada", () => {
    const kv = makeKv(configViva());
    kv.apiPut(cuerpoPanel());
    const raw = kv.readRaw();
    expect(raw.temperature).toBe(0.8);
    expect(raw.maxTokens).toBe(6144);
    expect(raw.systemDiaria).toBe("PROMPT VIVO DE DIARIA");
    expect(raw.providers.groq.secretRef).toBe("GROQ_API_KEY");
    expect(JSON.stringify(raw)).not.toContain("[redactado]");
    /* y N guardados consecutivos no degradan nada (la corrupción era acumulativa) */
    for (let i = 0; i < 3; i++) kv.apiPut(cuerpoPanel());
    expect(kv.readRaw().systemDiaria).toBe("PROMPT VIVO DE DIARIA");
    expect(kv.readRaw().maxTokens).toBe(6144);
  });

  it("el reset a fábrica es explícito (?reset=true) y acotado", () => {
    const kv = makeKv(configViva());
    kv.apiPutReset();
    const raw = kv.readRaw();
    expect(raw.maxTokens).toBeUndefined();   /* escalares vaciados a propósito */
    expect(raw.systemDiaria).toBeUndefined();
    expect(raw.version).toBe(CONFIG_VERSION); /* y la config queda en forma válida */
  });

  it("un cuerpo vacío SIN ?reset=true se ignora (el worker no llega a escribir un reset accidental)", () => {
    /* Semántica del worker: sin ?reset=true, el cuerpo pasa por mergeConfig,
       y mergeConfig({}, {}) conserva la base. Simulado con la KV nueva. */
    const kv = makeKv(configViva());
    kv.apiPut({}); /* lo que habría pasado por el PUT sin query param */
    expect(kv.readRaw().systemDiaria).toBe("PROMPT VIVO DE DIARIA");
    expect(kv.readRaw().maxTokens).toBe(8192);
  });
});
