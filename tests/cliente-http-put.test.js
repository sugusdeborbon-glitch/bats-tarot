/**
 * BATS Tarot — Cliente HTTP: metodo como parametro y disponibilidad de `put`.
 *
 * POR QUE EXISTE ESTE FICHERO
 * ---------------------------
 * El panel de administracion era de solo lectura: pulsar "Guardar cambios"
 * devolvia 405 "Metodo no permitido".
 *
 * Causa: `ai.js:adminFetch` pedia `PUT` al Worker de `/api/config`, pero como
 * `window.BATS.http` solo exponia `get` y `post`, caia en la rama `else` y
 * mandaba POST para todo lo que no fuera GET. El Worker solo acepta GET y PUT
 * (`worker/worker.js:229`), asi que respondia 405 y el cambio se perdia.
 *
 * El origen fue `048e3d6` ("Capacitor HTTP nativo bypass CORS"), que introdujo
 * `clienteHttp.js` con el metodo POST escrito a fuego en las dos rutas
 * (nativa y web).
 *
 * POR QUE NO LO DETECTO `admin-config-ciclo.test.js`
 * ---------------------------------------------------
 * Ese test recorre el ciclo panel -> worker -> KV, pero SIMULA la capa de
 * HTTP: llama a `sanitizeConfig`/`mergeConfig` directamente. El bug vivia
 * justo en el transporte, que el test se saltaba. Estos tests lo ejecutan.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../js/clienteHttp.js", import.meta.url), "utf8");
const AI_SRC = readFileSync(new URL("../ai.js", import.meta.url), "utf8");
const WORKER_SRC = readFileSync(new URL("../worker/worker.js", import.meta.url), "utf8");

const URL_WEB = "https://servidor.test/api";

/** Mantiene `fetch` global spiado durante la prueba y lo restaura al final. */
const originalFetch = globalThis.fetch;
let restaurarFetch = null;
afterEach(() => {
  if (restaurarFetch) { restaurarFetch(); restaurarFetch = null; }
});

/**
 * Carga `clienteHttp.js` en un window falso y devuelve su API.
 * El modulo referencia `Capacitor` y `fetch` como identificadores libres (no
 * como `window.Capacitor` / `window.fetch`), asi que se declaran en el ambito
 * global durante la prueba y se restauran despues. No usa `document`.
 */
function cargarClienteHttp(ventana) {
  const previoCapacitor = globalThis.Capacitor;
  globalThis.Capacitor = ventana.Capacitor;
  // `fetch` debe seguir spiado durante las llamadas, no solo en la carga:
  // el AFTER de cada prueba lo restaura.
  globalThis.fetch = ventana.fetch;
  restaurarFetch = () => {
    if (previoCapacitor === undefined) delete globalThis.Capacitor;
    else globalThis.Capacitor = previoCapacitor;
    globalThis.fetch = originalFetch;
  };
  new Function("window", SRC).call(ventana, ventana);
  return ventana.BATS.http;
}

/** Window falso. Con `nativo: true` simula el puente de Android. */
function ventanaDePrueba(opciones) {
  const o = opciones || {};
  const llamadas = [];
  const respuesta = {
    ok: true,
    status: 200,
    headers: { forEach: () => {} },
    json: () => Promise.resolve({ ok: true }),
    text: () => Promise.resolve("ok")
  };
  const ventana = {
    fetch: vi.fn((url, opts) => {
      llamadas.push({ via: "fetch", url, method: (opts && opts.method) || "GET" });
      return Promise.resolve({ ...respuesta, url });
    })
  };
  if (o.nativo) {
    ventana.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Http: {
          request: (req) => {
            llamadas.push({ via: "nativo", url: req.url, method: req.method });
            return Promise.resolve({ status: 200, headers: {}, data: { ok: true } });
          }
        }
      }
    };
  }
  return { ventana, llamadas };
}

/* ══════════ Exposición de la API ══════════ */

describe("clienteHttp — expone put", () => {
  it("window.BATS.http tiene post, put, get e isNative", () => {
    const { ventana } = ventanaDePrueba();
    const http = cargarClienteHttp(ventana);
    expect(typeof http.post).toBe("function");
    expect(typeof http.put).toBe("function");
    expect(typeof http.get).toBe("function");
    expect(typeof http.isNative).toBe("function");
  });
});

/* ══════════ El metodo es parametro, no literal (web) ══════════ */

describe("clienteHttp — el metodo se respeta (ruta web)", () => {
  it("sin opts.method sigue usando POST (no rompe lo existente)", async () => {
    const { ventana, llamadas } = ventanaDePrueba();
    const http = cargarClienteHttp(ventana);
    await http.post(URL_WEB, { a: 1 });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].method).toBe("POST");
  });

  it("http.put sale con metodo PUT", async () => {
    const { ventana, llamadas } = ventanaDePrueba();
    const http = cargarClienteHttp(ventana);
    await http.put(URL_WEB, { a: 1 });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].method).toBe("PUT");
  });

  it("http.post con opts.method explicito lo respeta", async () => {
    const { ventana, llamadas } = ventanaDePrueba();
    const http = cargarClienteHttp(ventana);
    await http.post(URL_WEB, {}, { method: "PUT" });
    expect(llamadas[0].method).toBe("PUT");
  });

  it("http.put no muta las opciones que recibe el llamador", async () => {
    const { ventana, llamadas } = ventanaDePrueba();
    const http = cargarClienteHttp(ventana);
    const opts = { timeoutMs: 5000 };
    await http.put(URL_WEB, {}, opts);
    expect(opts.method).toBe("PUT");
    expect(llamadas[0].method).toBe("PUT");
  });
});

/* ══════════ La ruta nativa tambien lo respeta ══════════ */

describe("clienteHttp — el metodo se respeta (ruta nativa Android)", () => {
  it("en nativo, http.put sale por el plugin con PUT", async () => {
    const { ventana, llamadas } = ventanaDePrueba({ nativo: true });
    const http = cargarClienteHttp(ventana);
    expect(http.isNative()).toBe(true);
    await http.put(URL_WEB, { a: 1 });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].via).toBe("nativo");
    expect(llamadas[0].method).toBe("PUT");
  });

  it("en nativo, http.post sigue saliendo por POST", async () => {
    const { ventana, llamadas } = ventanaDePrueba({ nativo: true });
    const http = cargarClienteHttp(ventana);
    await http.post(URL_WEB, { a: 1 });
    expect(llamadas[0].method).toBe("POST");
  });

  it("en nativo no se usa fetch en absoluto", async () => {
    const { ventana, llamadas } = ventanaDePrueba({ nativo: true });
    const http = cargarClienteHttp(ventana);
    await http.put(URL_WEB, {});
    expect(llamadas.every((c) => c.via === "nativo")).toBe(true);
    expect(ventana.fetch).not.toHaveBeenCalled();
  });
});

/* ══════════ El hueco que existia en el codigo ══════════ */

describe("clienteHttp — no quedan literales POST a fuego", () => {
  it("el codigo no fuerza method POST dentro de las rutas de envio", () => {
    // Se ignoran los comentarios: la documentacion puede nombrar el valor por defecto.
    const codigo = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(codigo.match(/method:\s*"POST"/g) || []).toHaveLength(0);
  });

  it("httpPut fija explicitamente el metodo PUT", () => {
    expect(SRC).toMatch(/function httpPut[\s\S]*?o\.method\s*=\s*"PUT"/);
  });
});

/* ══════════ adminFetch usa put, no post ══════════ */

describe("ai.js — adminFetch envia PUT al Worker", () => {
  it("tiene una rama explicita para PUT que usa http.put", () => {
    expect(AI_SRC).toMatch(/method==="PUT"\s*&&\s*typeof http\.put==="function"/);
  });

  it("adminSaveConfig sigue pidiendo PUT", () => {
    expect(AI_SRC).toMatch(/function adminSaveConfig\(token,cfg,opts\)\{return adminFetch\("PUT"/);
  });

  it("si http.put no existe, cae a la rama fetch (que si usa method)", () => {
    expect(AI_SRC).toMatch(/p=null/);
    expect(AI_SRC).toMatch(/p=fetch\(url,\{[\s\S]{0,80}?method:method/);
  });

  it("la rama fetch pura conserva el metodo original de la peticion", () => {
    // Guarantee de que el fallback no degrada PUT a POST.
    const ramaFetch = AI_SRC.slice(AI_SRC.indexOf("p=fetch(url,{"));
    expect(ramaFetch.slice(0, 200)).toMatch(/method:method/);
  });
});

/* ══════════ Coherencia con el Worker ══════════ */

describe("Coherencia con el Worker /api/config", () => {
  it("el Worker acepta GET y PUT", () => {
    expect(WORKER_SRC).toMatch(/req\.method === "GET"/);
    expect(WORKER_SRC).toMatch(/req\.method === "PUT"/);
  });

  it("el Worker devuelve 405 para cualquier otro metodo de /api/config", () => {
    // Se comprueba el codigo, no el literal con acento: el texto puede venir
    // en distintas codificaciones y no es lo que se quiere fijar aqui.
    const rechazos = WORKER_SRC.match(/}, 405, req\)/g) || [];
    expect(rechazos.length).toBeGreaterThanOrEqual(1);
  });

  it("POST no esta entre los metodos admitidos por /api/config", () => {
    // Se recorta el BLOQUE DEL MANEJADOR, no las constantes de arriba: el
    // endpoint TTS (POST) es otro y no debe confundir a esta comprobacion.
    const ini = WORKER_SRC.indexOf("url.pathname === ADMIN_ENDPOINT");
    const fin = WORKER_SRC.indexOf("url.pathname === AI_FLAGS_ENDPOINT", ini);
    expect(ini).toBeGreaterThan(-1);
    expect(fin).toBeGreaterThan(ini);
    const seccion = WORKER_SRC.slice(ini, fin);
    expect(seccion).toMatch(/req\.method === "GET"/);
    expect(seccion).toMatch(/req\.method === "PUT"/);
    expect(seccion).not.toMatch(/req\.method === "POST"/);
  });
});