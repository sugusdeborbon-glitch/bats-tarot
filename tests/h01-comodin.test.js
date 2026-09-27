/**
 * BATS Tarot — H-01: Restauración del Comodín opt-in en PRO
 * Relaciona el diseño P-01 (H-01) y el commit DEV e2bdbe7:
 * elimina la maquinaria de test del Comodín (_BATS_TEST_COMODIN,
 * forzado a posición 0, testComodin) y restaura el opt-in doctrinal.
 *
 * deck.js y state.js son IIFE que leen/escriben `window` (no hay jsdom
 * en vitest.config.js). Se proporciona un stub manual de `window` antes
 * de evaluar los módulos (import dinámico), patrón compatible con la
 * infraestructura Vitest existente (fallback.test.js / migration.test.js).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ── Stub manual de window ─────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const stubWindow = { BATS: {} };
globalThis.window = stubWindow;

// Los módulos usan `window` en su IIFE; se evalúan tras el stub.
await import("../js/deck.js");
await import("../js/state.js");

const deck = stubWindow.BATS.deck;
const state = stubWindow.BATS.state;

function mazoBasico() {
  return [{ nombre: "El Mago", valor: 1, tipo: "arcano" }];
}

describe("H-01 — Comodín opt-in (añadirComodin)", () => {
  it("OFF: añadirComodin(mazo,false) no añade el Comodín", () => {
    const m = mazoBasico();
    const r = deck.añadirComodin(m, false);
    expect(r).toBe(m);
    expect(r.length).toBe(1);
    expect(deck.esComodin(r[0])).toBe(false);
  });

  it("ON: añadirComodin(mazo,true) añade exactamente un Comodín", () => {
    const m = mazoBasico();
    const r = deck.añadirComodin(m, true);
    expect(r).toBe(m);
    expect(r.length).toBe(2);
    expect(deck.esComodin(r[1])).toBe(true);
  });

  it("REGRESIÓN DEL FLAG: _BATS_TEST_COMODIN=A true no reactiva el Comodín sin opt-in", () => {
    stubWindow._BATS_TEST_COMODIN = true;
    try {
      const m = mazoBasico();
      const r = deck.añadirComodin(m, false);
      expect(r.length).toBe(1);
      expect(deck.esComodin(r[0])).toBe(false);
    } finally {
      delete stubWindow._BATS_TEST_COMODIN;
    }
  });
});

describe("H-01 — Ausencia de maquinaria de test", () => {
  it("state.js cargado: window._BATS_TEST_COMODIN === undefined", () => {
    expect(stubWindow._BATS_TEST_COMODIN).toBeUndefined();
  });

  it("state.js cargado: no existe state.testComodin", () => {
    expect(state.testComodin).toBeUndefined();
    expect("testComodin" in state).toBe(false);
  });

  it("deck.js barajar() no contiene forcing del Comodín a posición 0", () => {
    const src = readFileSync(join(__dirname, "..", "js", "deck.js"), "utf8");
    const idx = src.indexOf("function barajar(a)");
    expect(idx).toBeGreaterThan(-1);
    const block = src.slice(idx, idx + 400);
    expect(block).not.toMatch(/unshift|_BATS_TEST_COMODIN/);
  });

  it("código productivo sin referencias a la maquinaria de test", () => {
    const deckSrc = readFileSync(join(__dirname, "..", "js", "deck.js"), "utf8");
    const stateSrc = readFileSync(join(__dirname, "..", "js", "state.js"), "utf8");
    expect(deckSrc).not.toContain("_BATS_TEST_COMODIN");
    expect(stateSrc).not.toContain("_BATS_TEST_COMODIN");
    expect(stateSrc).not.toContain("testComodin");
  });
});

function mazoConComodinActivo() {
  const m = [
    { nombre: "A", valor: 1, tipo: "arcano" },
    { nombre: "B", valor: 2, tipo: "arcano" },
    { nombre: "C", valor: 3, tipo: "arcano" },
    { nombre: "D", valor: 4, tipo: "arcano" },
    { nombre: "E", valor: 5, tipo: "arcano" }
  ];
  return deck.añadirComodin(m, true);
}

describe("H-01 — barajar() comportamental (sin forcing)", () => {
  function barajarConRandom(constante) {
    const original = Math.random;
    try {
      Math.random = function () { return constante; };
      return deck.barajar(mazoConComodinActivo());
    } finally {
      Math.random = original;
    }
  }

  it("con Math.random controlada, el Comodín puede terminar fuera del índice 0", () => {
    const resultado = barajarConRandom(0);
    expect(resultado.length).toBe(6);
    const idx = resultado.findIndex(deck.esComodin);
    // Fisher-Yates determinista: con semilla 0 sobre [A,B,C,D,E,Comodín],
    // el Comodín acaba en índice 4. Si existiera forcing (unshift a 0),
    // esta misma barajada terminaría sistemáticamente en índice 0.
    expect(idx).toBe(4);
  });

  it("sin forcing, la posición del Comodín varía según la aleatoriedad", () => {
    const posiciones = [
      barajarConRandom(0).findIndex(deck.esComodin),
      barajarConRandom(0.25).findIndex(deck.esComodin),
      barajarConRandom(0.5).findIndex(deck.esComodin),
      barajarConRandom(0.9999).findIndex(deck.esComodin)
    ];
    // La posición NO es fija: al menos dos índices distintos se producen.
    expect(new Set(posiciones).size).toBeGreaterThan(1);
    // Y en al menos una barajada el Comodín NO queda en 0 (el forcing haría
    // que todas las barajadas terminasen con el Comodín en índice 0).
    expect(posiciones.some(function (p) { return p !== 0; })).toBe(true);
  });
});