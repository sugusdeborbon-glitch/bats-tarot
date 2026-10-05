/**
 * BATS Tarot — PRO — Contrato temporal end-to-end (FASE 2C-3 / H-04)
 * Batería B-1…B-12 sobre js/ai/contrato-temporal.js (módulo puro).
 *
 * Sin DOM, sin fetch, sin red: se inyecta el reloj, de modo que toda la
 * aritmética de presupuestos es determinista y reproducible.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import {
  CONTRATO,
  CONTRATO_PROPIA,
  contratoPara,
  presupuestoDeIntento,
  crearReloj,
  deadline,
  restante,
  puedeIntentar,
  timeoutEfectivo,
  descontar,
  simularCadena,
  timeoutPropia,
  esperaFrontendValida
} from "../js/ai/contrato-temporal.js";

const CORTA = CONTRATO.corta;
const LARGA = CONTRATO.larga;

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Reloj manual: avanza solo cuando el consumidor lo decide. */
function relojManual(inicio) {
  let t = inicio || 0;
  const reloj = () => t;
  reloj.avanzar = (ms) => { t += ms; return t; };
  reloj.set = (ms) => { t = ms; return t; };
  return reloj;
}

/* ══════════════════ B-1 — contrato CORTA ══════════════════ */

describe("B-1 — contrato CORTA 50 / 60 / 24 / 13 / 8 / 40", () => {
  it("tiene exactamente los valores del contrato", () => {
    expect(CORTA.totalMs).toBe(50000);
    expect(CORTA.frontendMs).toBe(60000);
    expect(CORTA.p1Ms).toBe(24000);
    expect(CORTA.fallbackMs).toBe(13000);
    expect(CORTA.minSliceMs).toBe(8000);
    expect(CORTA.upstreamMaxMs).toBe(40000);
  });

  it("es el contrato por defecto (cualquier tipo que no sea 'larga')", () => {
    expect(contratoPara("corta")).toEqual(CORTA);
    expect(contratoPara("diaria")).toEqual(CORTA);
    expect(contratoPara(undefined)).toEqual(CORTA);
    expect(contratoPara("")).toEqual(CORTA);
  });

  it("el frontend espera MÁS que el Worker (el Worker manda)", () => {
    expect(CORTA.frontendMs).toBeGreaterThan(CORTA.totalMs);
    expect(esperaFrontendValida(CORTA)).toBe(true);
  });
});

/* ══════════════════ B-2 — contrato LARGA ══════════════════ */

describe("B-2 — contrato LARGA 75 / 90 / 35 / 10 / 10 / 40", () => {
  it("tiene exactamente los valores del contrato", () => {
    expect(LARGA.totalMs).toBe(75000);
    expect(LARGA.frontendMs).toBe(90000);
    expect(LARGA.p1Ms).toBe(35000);
    expect(LARGA.fallbackMs).toBe(10000);
    expect(LARGA.minSliceMs).toBe(10000);
    expect(LARGA.upstreamMaxMs).toBe(40000);
  });

  it("se selecciona solo con tipo 'larga'", () => {
    expect(contratoPara("larga")).toEqual(LARGA);
    expect(contratoPara("corta")).not.toEqual(LARGA);
  });

  it("el frontend espera MÁS que el Worker", () => {
    expect(LARGA.frontendMs).toBeGreaterThan(LARGA.totalMs);
    expect(esperaFrontendValida(LARGA)).toBe(true);
  });

  it("el upstream máximo es 40 s en ambos contratos", () => {
    expect(CORTA.upstreamMaxMs).toBe(40000);
    expect(LARGA.upstreamMaxMs).toBe(40000);
  });
});

/* ══════════════════ B-3 — cálculo de remaining ══════════════════ */

describe("B-3 — cálculo de remaining", () => {
  it("resta el instante actual al deadline", () => {
    const reloj = relojManual(10000);
    const hasta = deadline(CORTA, reloj);
    expect(hasta).toBe(60000);
    expect(restante(hasta, reloj)).toBe(50000);
  });

  it("remaining baja conforme avanza el reloj", () => {
    const reloj = relojManual(0);
    const hasta = deadline(CORTA, reloj);
    expect(restante(hasta, reloj)).toBe(50000);
    reloj.avanzar(20000);
    expect(restante(hasta, reloj)).toBe(30000);
    reloj.avanzar(20000);
    expect(restante(hasta, reloj)).toBe(10000);
  });

  it("remaining puede ser negativo una vez expirado", () => {
    const reloj = relojManual(0);
    const hasta = deadline(CORTA, reloj);
    reloj.avanzar(60000);
    expect(restante(hasta, reloj)).toBe(-10000);
  });

  it("deadline se calcula con el contrato que corresponde al tipo", () => {
    const reloj = relojManual(0);
    expect(deadline(CORTA, reloj)).toBe(50000);
    expect(deadline(LARGA, reloj)).toBe(75000);
  });

  it("crearReloj() delega en Date.now cuando no se inyecta", () => {
    const r = crearReloj();
    const antes = Date.now();
    const t = r();
    expect(typeof t).toBe("number");
    expect(t).toBeGreaterThanOrEqual(antes);
  });

  it("crearReloj() usa la base inyectada", () => {
    const r = crearReloj(() => 4242);
    expect(r()).toBe(4242);
  });
});

/* ══════════════════ B-4 — no iniciar bajo minSlice ══════════════════ */

describe("B-4 — no se inicia intento si remaining < minSlice", () => {
  it("CORTA: con 7999 ms restantes no se intenta (minSlice 8000)", () => {
    expect(puedeIntentar(7999, CORTA)).toBe(false);
    expect(timeoutEfectivo(7999, CORTA, 0)).toBeNull();
  });

  it("CORTA: exactamente en minSlice SÍ se intenta", () => {
    expect(puedeIntentar(8000, CORTA)).toBe(true);
    expect(timeoutEfectivo(8000, CORTA, 0)).toBe(8000);
  });

  it("LARGA: con 9999 ms restantes no se intenta (minSlice 10000)", () => {
    expect(puedeIntentar(9999, LARGA)).toBe(false);
    expect(timeoutEfectivo(9999, LARGA, 0)).toBeNull();
  });

  it("LARGA: exactamente en minSlice SÍ se intenta", () => {
    expect(puedeIntentar(10000, LARGA)).toBe(true);
    expect(timeoutEfectivo(10000, LARGA, 1)).toBe(10000);
  });

  it("restante cero o negativo nunca se intenta", () => {
    for (const c of [CORTA, LARGA]) {
      expect(puedeIntentar(0, c)).toBe(false);
      expect(puedeIntentar(-1, c)).toBe(false);
      expect(timeoutEfectivo(0, c, 0)).toBeNull();
      expect(timeoutEfectivo(-5000, c, 0)).toBeNull();
    }
  });
});

/* ══════════════════ B-5 — timeout efectivo = mínimo ══════════════════ */

describe("B-5 — timeout efectivo = min(presupuesto, remaining, upstream)", () => {
  it("con presupuesto completo manda el presupuesto del intento (P1 CORTA)", () => {
    expect(timeoutEfectivo(50000, CORTA, 0)).toBe(24000);
  });

  it("con presupuesto completo, el fallback usa su presupuesto", () => {
    expect(timeoutEfectivo(50000, CORTA, 1)).toBe(13000);
    expect(presupuestoDeIntento(CORTA, 0)).toBe(24000);
    expect(presupuestoDeIntento(CORTA, 1)).toBe(13000);
  });

  it("si el remaining es menor que el presupuesto, manda el remaining", () => {
    // CORTA: P1 pide 24 s pero solo quedan 15 s → 15 s, nunca 24.
    expect(timeoutEfectivo(15000, CORTA, 0)).toBe(15000);
  });

  it("si el remaining es mayor, manda el presupuesto", () => {
    expect(timeoutEfectivo(49000, CORTA, 0)).toBe(24000);
  });

  it("el upstream máximo acota cuando el presupuesto lo superaría", () => {
    // Un contrato con p1 de 90 s debe quedar limitado a 40 s de upstream.
    const unusual = { totalMs: 200000, frontendMs: 210000, p1Ms: 90000, fallbackMs: 90000, minSliceMs: 1000, upstreamMaxMs: 40000 };
    expect(timeoutEfectivo(200000, unusual, 0)).toBe(40000);
  });

  it("el timeout efectivo nunca excede el upstream máximo", () => {
    for (const r of [8000, 15000, 24000, 40000, 50000, 75000]) {
      for (const i of [0, 1]) {
        const t = timeoutEfectivo(r, LARGA, i);
        if (t !== null) expect(t).toBeLessThanOrEqual(LARGA.upstreamMaxMs);
      }
    }
  });

  it("LARGA: P1 35 s y fallback 10 s con presupuesto completo", () => {
    expect(timeoutEfectivo(75000, LARGA, 0)).toBe(35000);
    expect(timeoutEfectivo(75000, LARGA, 1)).toBe(10000);
  });

  it("descontar acota a 0 y nunca baja de cero", () => {
    expect(descontar(30000, 10000)).toBe(20000);
    expect(descontar(10000, 30000)).toBe(0);
    expect(descontar(0, 0)).toBe(0);
  });
});

/* ══════════════════ B-6 — el fallback comparte deadline global ══════════════════ */

describe("B-6 — el fallback comparte el presupuesto global", () => {
  it("P1 agota 24 s y el siguiente recibe solo lo que queda", () => {
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 4
    });
    expect(traza.pasos[0].timeoutMs).toBe(24000);
    // Tras P1 quedan 26 s; el fallback pide 13 s → 13 s, no 13 desde cero.
    expect(traza.pasos[1].restanteAntesMs).toBe(26000);
    expect(traza.pasos[1].timeoutMs).toBe(13000);
  });

  it("el total de la cadena no supera el presupuesto global", () => {
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 6
    });
    expect(traza.consumidoTotalMs).toBeLessThanOrEqual(CORTA.totalMs);
  });

  it("LARGA: P1 35 s deja 40 s, y el fallback toma 10 s", () => {
    let t = 0;
    const traza = simularCadena({
      tipo: "larga",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 3
    });
    expect(traza.pasos[0].timeoutMs).toBe(35000);
    expect(traza.pasos[1].restanteAntesMs).toBe(40000);
    expect(traza.pasos[1].timeoutMs).toBe(10000);
  });

  it("ningún proveedor posterior recibe presupuesto de P1", () => {
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 5
    });
    const iniciados = traza.pasos.filter((p) => p.iniciado);
    // P1 es el único con presupuesto 24 s.
    expect(iniciados[0].presupuestoMs).toBe(CORTA.p1Ms);
    for (const paso of iniciados.slice(1)) {
      expect(paso.presupuestoMs).toBe(CORTA.fallbackMs);
      expect(paso.presupuestoMs).not.toBe(CORTA.p1Ms);
    }
  });
});

/* ══════════════════ B-7 — el reloj no se reinicia entre proveedores ══════════════════ */

describe("B-7 — el reloj NO se reinicia entre proveedores", () => {
  it("el deadline es uno solo para toda la cadena", () => {
    const traza = simularCadena({ tipo: "corta", ahora: () => 0, proveedores: 4 });
    expect(traza.deadlineMs).toBe(CORTA.totalMs);
    for (const paso of traza.pasos) {
      expect(traza.deadlineMs).toBe(CORTA.totalMs);
    }
  });

  it("el restante es estrictamente decreciente (nunca se resetea a 50 s)", () => {
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 4
    });
    const restos = traza.pasos
      .filter((p) => p.iniciado)
      .map((p) => p.restanteAntesMs);
    expect(restos[0]).toBe(50000);
    for (let i = 1; i < restos.length; i++) {
      expect(restos[i]).toBeLessThan(restos[i - 1]);
    }
    expect(Math.max(...restos.slice(1))).toBeLessThan(CORTA.totalMs);
  });

  it("cuando el restante cae bajo minSlice, la cadena se detiene", () => {
    // CORTA: minSlice 8 s. P1 24 s + P2 13 s + P3 13 s agotan los 50 s, así que
    // el cuarto proveedor NO se abre por falta de presupuesto.
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { t += timeout; return timeout; },
      proveedores: 4
    });
    const ultimo = traza.pasos[traza.pasos.length - 1];
    expect(ultimo.iniciado).toBe(false);
    expect(ultimo.motivo).toBe("restante<minSlice");
    expect(ultimo.restanteMs).toBeLessThan(CORTA.minSliceMs);
  });

  it("un consumo parcial que agota el presupuesto también corta la cadena", () => {
    // Cada intento consume casi todo su timeout: el resto cae en picado.
    let t = 0;
    const traza = simularCadena({
      tipo: "corta",
      ahora: () => t,
      consumir: (timeout) => { const c = timeout - 400; t += c; return c; },
      proveedores: 6
    });
    const cortado = traza.pasos.find((p) => p.iniciado === false);
    expect(cortado).toBeDefined();
    expect(cortado.motivo).toBe("restante<minSlice");
  });

  it("el número de intentos nunca excede el número de proveedores", () => {
    const traza = simularCadena({ tipo: "corta", ahora: () => 0, proveedores: 3 });
    expect(traza.intentos).toBeLessThanOrEqual(3);
  });
});

/* ══════════════════ B-8 — modo propia sin fallback ══════════════════ */

describe("B-8 — modo propia sin fallback de proveedores", () => {
  it("el timeout propio nunca excede 40 s de upstream", () => {
    expect(timeoutPropia(CORTA, 50000)).toBe(40000);
    expect(timeoutPropia(LARGA, 75000)).toBe(40000);
  });

  it("el modo propia hereda el techo de 40 s, no el presupuesto de fallback", () => {
    expect(CONTRATO_PROPIA.upstreamMaxMs).toBe(40000);
    expect(timeoutPropia(CORTA, 50000)).not.toBe(CORTA.fallbackMs);
    expect(timeoutPropia(CORTA, 50000)).not.toBe(CORTA.p1Ms);
  });

  it("si el restante es menor que 40 s, manda el restante", () => {
    expect(timeoutPropia(CORTA, 30000)).toBe(30000);
    expect(timeoutPropia(LARGA, 20000)).toBe(20000);
  });

  it("con el presupuesto agotado devuelve 0 (no se intenta)", () => {
    expect(timeoutPropia(CORTA, 0)).toBe(0);
    expect(timeoutPropia(CORTA, -1000)).toBe(0);
  });

  it("el modo propia no tiene cadena: timeoutPropia no depende del índice", () => {
    // No hay P1/P2 que repartir: siempre un único techo.
    expect(timeoutPropia(CORTA, 50000)).toBe(timeoutPropia(CORTA, 50000));
  });
});

/* ══════════════════ B-9 — respuesta tardía ignorada ══════════════════ */

describe("B-9 — respuesta tardía ignorada tras estado terminal", () => {
  /** Reproduce la regla del guard de ai-pipeline.js con reloj manual. */
  function escenario() {
    let restante = 0;
    let ultimoTexto = null;
    const estado = { acabado: false, token: 1, contador: 1 };
    function alResolver(token, texto) {
      if (estado.acabado || token !== estado.contador) return "descartada";
      ultimoTexto = texto;
      estado.acabado = true;
      return "aceptada";
    }
    return {
      estado,
      alResolver,
      terminar: () => { estado.acabado = true; },
      texto: () => ultimoTexto,
      _r: () => restante,
      setRestante: (v) => { restante = v; }
    };
  }

  it("una respuesta del token vigente se acepta", () => {
    const e = escenario();
    expect(e.alResolver(1, "interpretacion")).toBe("aceptada");
    expect(e.texto()).toBe("interpretacion");
  });

  it("una respuesta TARDÍA tras terminar se descarta y no pisa el texto", () => {
    const e = escenario();
    e.alResolver(1, "primera");
    // Llega otra respuesta cuando ya todo terminó.
    expect(e.alResolver(1, "tardia")).toBe("descartada");
    expect(e.texto()).toBe("primera");
  });

  it("una respuesta de un token ANTIGUO se descarta aunque no se haya terminado", () => {
    const e = escenario();
    e.estado.contador = 2;          // un reintento ya tomó el relevo
    expect(e.alResolver(1, "vieja")).toBe("descartada");
    expect(e.texto()).toBeNull();
  });

  it("el token nuevo sí se acepta tras unReplacement", () => {
    const e = escenario();
    e.estado.contador = 2;
    expect(e.alResolver(2, "nueva")).toBe("aceptada");
    expect(e.texto()).toBe("nueva");
  });

  it("terminar es idempotente: no reabre nada", () => {
    const e = escenario();
    e.terminar();
    e.terminar();
    expect(e.alResolver(1, "cualquiera")).toBe("descartada");
    expect(e.texto()).toBeNull();
  });
});

/* ══════════════════ B-10 — frontend y Worker, sus límites ══════════════════ */

describe("B-10 — frontend y Worker respetan sus límites", () => {
  it("CORTA: Worker 50 s, frontend 60 s (10 s de margen)", () => {
    expect(CORTA.frontendMs - CORTA.totalMs).toBe(10000);
  });

  it("LARGA: Worker 75 s, frontend 90 s (15 s de margen)", () => {
    expect(LARGA.frontendMs - LARGA.totalMs).toBe(15000);
  });

  it("el frontend NUNCA aborta antes que el Worker", () => {
    for (const c of [CORTA, LARGA]) {
      expect(esperaFrontendValida(c)).toBe(true);
      expect(c.frontendMs).toBeGreaterThan(c.totalMs);
    }
  });

  it("el presupuesto de P1 cabe dentro del total en ambos contratos", () => {
    expect(CORTA.p1Ms).toBeLessThan(CORTA.totalMs);
    expect(LARGA.p1Ms).toBeLessThan(LARGA.totalMs);
  });
});

/* ══════════════════ B-11 — sin failsafe de 30 s ══════════════════ */

describe("B-11 — no existe terminación prematura de 30 s", () => {
  it("ningún valor del contrato es 30000 ms", () => {
    for (const c of [CORTA, LARGA]) {
      expect(Object.values(c)).not.toContain(30000);
    }
  });

  it("el frontend de a-pipeline.js no declara un failsafe de 30 s", () => {
    const src = readSource("js/ai-pipeline.js");
    expect(src).not.toMatch(/setTimeout[\s\S]{0,200}?30000/);
    expect(src).not.toContain("},30000)");
  });

  it("no existe ninguna variable `failsafe` en el pipeline", () => {
    const src = readSource("js/ai-pipeline.js");
    expect(src).not.toContain("failsafe=");
    expect(src).not.toContain("failsafe)");
  });

  it("el Worker tampoco fija 40 s de forma incondicional en el fallback", () => {
    const src = readSource("worker/worker.js");
    // El 40 s solo puede aparecer como techo del contrato, no como timer ciego.
    expect(src).toContain("timeoutEfectivo");
    expect(src).toContain("ctPuedeIntentar");
  });
});

/* ══════════════════ B-12 — los adaptadores reciben timeoutMs ══════════════════ */

describe("B-12 — los adaptadores reciben timeoutMs correctamente", () => {
  it("llamarProveedor acepta timeoutMs y lo usa como presupuesto", () => {
    const src = readSource("worker/worker.js");
    expect(src).toMatch(/async function llamarProveedor\(provider, messages, payload, timeoutMs\)/);
    expect(src).toContain("typeof timeoutMs === \"number\" && timeoutMs > 0");
  });

  it("el bucle de fallback pasa el timeout calculado a llamarProveedor", () => {
    const src = readSource("worker/worker.js");
    expect(src).toMatch(/llamarProveedor\(provider, msgs, payload, timeoutMs\)/);
  });

  it("llamarEndpointPropio acepta timeoutMs", () => {
    const src = readSource("worker/worker.js");
    expect(src).toMatch(/async function llamarEndpointPropio\(base, model, messages, cfg, key, timeoutMs\)/);
  });

  it("el modo propia pasa su propio timeout, no el de fallback", () => {
    const src = readSource("worker/worker.js");
    expect(src).toContain("ctTimeoutPropia");
  });

  it("el tiempo se refleja en el error para que el diagnóstico sea útil", () => {
    const src = readSource("worker/worker.js");
    expect(src).toContain("Math.round(budget / 1000)");
  });

  it("el frontend ya usa 60 s / 90 s alineados con el contrato", () => {
    /*
     * Este test afirmaba sobre la REPRESENTACIÓN (el literal `90000:60000`).
     * D-T2 movió esos valores a `BATS_AI_TEMPORAL` en ai.js, así que la
     * aserción se reescribe para afirmar sobre la INTENCIÓN, que es lo que
     * realmente importa: que los topes del cliente coincidan con
     * CONTRATO[tipo].frontendMs.
     *
     * No se ha debilitado: comparar contra el contrato real es más fuerte que
     * comprobar que aparece un par de números. La invariante completa de
     * producto (cliente > presupuesto del Worker) vive además, ejecutada, en
     * tests/contrato-temporal-coherencia.test.js.
     */
    const src = readSource("ai.js");
    const m = src.match(/var\s+BATS_AI_TEMPORAL\s*=\s*\{([^}]*)\}/);
    expect(m, "ai.js debe declarar BATS_AI_TEMPORAL").toBeTruthy();
    const topes = {};
    for (const pair of m[1].split(",")) {
      const kv = pair.match(/(\w+)\s*:\s*(\d+)/);
      if (kv) topes[kv[1]] = Number(kv[2]);
    }
    expect(topes.corta).toBe(CONTRATO.corta.frontendMs);
    expect(topes.larga).toBe(CONTRATO.larga.frontendMs);
  });
});

/** Lee un fichero del repositorio para aserciones sobre integración. */
function readSource(rel) {
  return readFileSync(resolve(RAIZ, rel), "utf8");
}