/**
 * BATS Tarot — PRO — Regresión del defecto N-11 (bundle mixto tras deploy).
 *
 * POR QUÉ EXISTE ESTE FICHERO
 * ---------------------------
 * N-11: tras un deploy, un usuario podía acabar ejecutando una mezcla de
 * versiones. El service worker servía index.html network-first PERO sin tope
 * de tiempo: con la red lenta, el fetch() pelado puede colgar minutos y el
 * usuario sigue con el HTML viejo junto a assets nuevos (?v=).
 *
 * Fix: network-first CON presupuesto (HTML_TIMEOUT_MS). Si la red no contesta
 * a tiempo, se sirve la caché AL INSTANTE y la revalidación sigue en marcha
 * para la siguiente visita.
 *
 * El service-worker.js REAL se ejecuta en un sandbox: caches/fetch/timers son
 * controlados; no hay red ni temporales reales.
 */

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";

const SW_SRC = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");

/** Response HTML reutilizable (clone() para cada match). */
function respHTML(texto) {
  return () => new Response(texto || "<html>1.11.1</html>", { status: 200 });
}

/**
 * Ejecuta el SW real en un sandbox.
 * - fetchImpl: implementación de fetch inyectada (colgada, rápida, etc.).
 * - conCache: si la caché tiene respuesta previa.
 */
function cargarSW({ fetchImpl, conCache }) {
  const factory = respHTML();
  const offlineFactory = respHTML("<html>offline</html>");
  const cache = {
    match: vi.fn(() => Promise.resolve(conCache ? factory() : undefined)),
    put: vi.fn(() => Promise.resolve())
  };
  const caches = {
    open: vi.fn(() => Promise.resolve(cache)),
    match: vi.fn((req) => {
      const url = typeof req === "string" ? req : req.url;
      if (String(url).indexOf("offline.html") !== -1) {
        return Promise.resolve(conCache ? undefined : offlineFactory());
      }
      return cache.match(req);
    })
  };
  const timers = [];
  const tSet = vi.fn((fn, ms) => { timers.push({ fn, ms }); return timers.length; });
  const tClear = vi.fn((id) => { if (timers[id - 1]) timers[id - 1].fn = null; });

  /* El cuerpo del SW solo puede referenciar sus parámetros, así que los
     listeners se exponen a través de self._listeners. */
  const listeners = {};
  const self = {
    _listeners: listeners,
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() }
  };

  const fn = new Function(
    "self", "caches", "fetch", "setTimeout", "clearTimeout",
    SW_SRC + "\n;return { listeners: self._listeners, HTML_TIMEOUT_MS: HTML_TIMEOUT_MS };"
  );
  const devuelto = fn(self, caches, fetchImpl, tSet, tClear);
  return { listeners, timers, tSet, tClear, cache, caches, devuelto };
}

/** self de recarga: mismo almacén de listeners, otra ejecución del SW. */
function recargar(sandbox, fetchImpl) {
  const fn = new Function(
    "self", "caches", "fetch", "setTimeout", "clearTimeout",
    SW_SRC + "\n;return { listeners: self._listeners };"
  );
  const self = {
    _listeners: sandbox.listeners,
    addEventListener(ev, fn2) { this._listeners[ev] = fn2; },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() }
  };
  fn(self, sandbox.caches, fetchImpl, sandbox.tSet, sandbox.tClear);
}

/** fetch que nunca responde (red colgada). */
function fetchColgado() {
  let resolver = null;
  const promesa = new Promise((res) => { resolver = res; });
  const impl = vi.fn(() => promesa);
  return { impl, resolver };
}

/** fetch que responde 200 con el HTML "de red". */
function fetchRapido() {
  return vi.fn(() => Promise.resolve(new Response("<html>RED</html>", { status: 200 })));
}

function peticionHTML() {
  return {
    method: "GET",
    url: "https://sugusdeborbon-glitch.github.io/bats-tarot/index.html",
    headers: { get: (h) => (h.toLowerCase() === "accept" ? "text/html" : null) }
  };
}

function peticionAsset() {
  return {
    method: "GET",
    url: "https://sugusdeborbon-glitch.github.io/bats-tarot/app.js?v=1.11.1",
    headers: { get: (h) => (h.toLowerCase() === "accept" ? "*/*" : null) }
  };
}

/** Captura la promesa de Response que el SW entrega para esta petición. */
function responder(sandbox, req) {
  let capturada = null;
  sandbox.listeners.fetch({
    request: req,
    respondWith: (p) => { capturada = p; }
  });
  if (!capturada) throw new Error("el SW no respondió a esta petición");
  return capturada;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("N-11 · el HTML tiene presupuesto de red en el service worker", () => {
  it("el SW declara el presupuesto acordado (3000 ms) y lo aplica en networkFirst", () => {
    const sb = cargarSW({ fetchImpl: fetchRapido(), conCache: true });
    expect(sb.devuelto.HTML_TIMEOUT_MS).toBe(3000);
    expect(typeof sb.listeners.fetch).toBe("function");
  });

  it("red rápida: sirve la red y revalida la caché (comportamiento previo intacto)", async () => {
    const red = fetchRapido();
    const sb = cargarSW({ fetchImpl: red, conCache: true });
    const resp = await responder(sb, peticionHTML());
    expect(resp.status).toBe(200);
    expect(await resp.text()).toContain("RED");
    expect(red).toHaveBeenCalledTimes(1);
    await flush();
    expect(sb.cache.put).toHaveBeenCalledTimes(1); /* revalidada */
  });

  it("red colgada + caché: responde desde la caché al agotar el presupuesto, sin congelarse", async () => {
    const sb = cargarSW({ fetchImpl: vi.fn(() => new Promise(() => {})), conCache: true });

    const p = responder(sb, peticionHTML());
    await flush();
    /* sin presupuesto, esta promesa seguiría colgada esperando la red */
    let resuelta = false;
    p.then(() => { resuelta = true; });
    await flush();
    expect(resuelta).toBe(false);

    /* el SW registró exactamente UN temporizador de red (el presupuesto) */
    expect(sb.tSet).toHaveBeenCalledTimes(1);
    expect(sb.timers[0].ms).toBe(3000);

    /* se agota el presupuesto -> responde desde caché */
    sb.timers[0].fn();
    const resp = await p;
    expect(resp.status).toBe(200);
    /* el temporizador queda limpiado (no congela nada) */
    expect(sb.tClear).toHaveBeenCalled();
    /* la revalida sigue en marcha: todavía no hay put en la caché */
    expect(sb.cache.put).not.toHaveBeenCalled();
  });

  it("red colgada sin caché: sirve offline.html en lugar de colgarse", async () => {
    const sb = cargarSW({ fetchImpl: vi.fn(() => new Promise(() => {})), conCache: false });
    const p = responder(sb, peticionHTML());
    sb.timers[0].fn();
    const resp = await p;
    expect(resp.status).toBe(200);
    expect(await resp.text()).toContain("offline");
  });

  it("los assets versionados siguen cache-first: ni red ni presupuesto", async () => {
    const red = fetchColgado();
    const sb = cargarSW({ fetchImpl: red.impl, conCache: true });
    const resp = await responder(sb, peticionAsset());
    expect(resp.status).toBe(200);
    expect(red.impl).not.toHaveBeenCalled(); /* cache-first: la red ni se toca */
    expect(sb.tSet).not.toHaveBeenCalled();  /* sin temporizador de presupuesto */
  });

  it("el presupuesto también protege al HTML revalidado en segundo plano (recarga del SW)", async () => {
    const sb = cargarSW({ fetchImpl: vi.fn(() => new Promise(() => {})), conCache: true });
    recargar(sb, vi.fn(() => new Promise(() => {})));
    const p = responder(sb, peticionHTML());
    await flush();
    expect(sb.tSet).toHaveBeenCalledTimes(1);
    expect(sb.timers[0].ms).toBe(3000);
    sb.timers[0].fn();
    const resp = await p;
    expect(resp.status).toBe(200);
  });
});
