/**
 * BATS Tarot — coherencia del contrato temporal entre cliente y Worker (D-T2).
 *
 * EL PROBLEMA QUE ESTE FICHERO CIERRA
 * -----------------------------------
 * `js/ai/contrato-temporal.js` es la autoridad temporal del Worker y declara
 * `CONTRATO.corta.frontendMs = 60000` y `CONTRATO.larga.frontendMs = 90000`.
 * Esos mismos dos números estaban escritos a mano en `ai.js`, sin ninguna
 * relación declarada entre ambos. Nadie changing uno se acordaba del otro.
 *
 * La consecuencia no era cosmética: si el tope del cliente llegara a ser menor
 * que el presupuesto del Worker, el navegador abortaría antes de que el Worker
 * terminara, y el usuario vería un error de red opaco en lugar del error
 * estructurado que el Worker sí sabe explicar. Es un fallo de producto
 * invisible en una prueba unitaria.
 *
 * LO QUE ESTE TEST HACE Y LO QUE NO
 * ---------------------------------
 * Importa y EJECUTA el módulo real del Worker, y compara sus valores con los
 * que `ai.js` declara. La comparación del lado de `ai.js` es de nivel L2
 * (verificación de código): `ai.js` es un script clásico de 600 líneas con
 * dependencias de navegador, así que no se carga en Node sin un andamiaje que
 * no aporta nada a esta comprobación. Se declara explícitamente para que nadie
 * lo confunda con una prueba funcional.
 *
 * Para que la otra mitad sea fuerte, los valores de CONTRATO están cubiertos
 * por tests ejecutados reales en `tests/h04-contrato-temporal.test.js`.
 * Juntos, los dos ficheros cubren las dos fuentes.
 *
 * Deuda restante (Fase 2): unificar de verdad exigiría convertir el frontend a
 * módulos ES, lo que toca 15 etiquetas <script> y todo el sistema de globales.
 * Eso es una intervención mayor con riesgo de producto, y no está justificado
 * mientras la invariante esté verificada mecánicamente.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTRATO, contratoPara } from "../js/ai/contrato-temporal.js";

const AI_SRC = readFileSync(new URL("../ai.js", import.meta.url), "utf8");

/** Extrae BATS_AI_TEMPORAL de ai.js. L2: lectura del fuente, no ejecución. */
function topesCliente() {
  const m = AI_SRC.match(/var\s+BATS_AI_TEMPORAL\s*=\s*\{([^}]*)\}/);
  expect(m, "ai.js debe declarar BATS_AI_TEMPORAL").toBeTruthy();
  const out = {};
  for (const pair of m[1].split(",")) {
    const kv = pair.match(/(\w+)\s*:\s*(\d+)/);
    if (kv) out[kv[1]] = Number(kv[2]);
  }
  return out;
}

describe("D-T2 · coherencia cliente ↔ Worker del contrato temporal", () => {
  it("ai.js declara los dos topes con nombres reconocibles", () => {
    const t = topesCliente();
    expect(t).toEqual({ corta: expect.any(Number), larga: expect.any(Number) });
  });

  it("el tope del cliente coincide con CONTRATO[tipo].frontendMs", () => {
    const t = topesCliente();
    expect(t.corta).toBe(CONTRATO.corta.frontendMs);
    expect(t.larga).toBe(CONTRATO.larga.frontendMs);
  });

  it("el cliente espera MÁS que el presupuesto del Worker (si no, aborta opaco)", () => {
    /*
     * Esta es la invariante de producto. Si alguien baja el tope del cliente
     * por debajo del presupuesto, el usuario deja de ver el diagnóstico del
     * Worker. Este es el test que protege esa causa raíz.
     */
    const t = topesCliente();
    for (const tipo of ["corta", "larga"]) {
      const c = contratoPara(tipo);
      expect(
        t[tipo],
        `el tope del cliente (${tipo}) debe superar el presupuesto del Worker`
      ).toBeGreaterThan(c.totalMs);
    }
  });

  it("el margen cliente−Worker es suficiente para que la respuesta llegue", () => {
    const t = topesCliente();
    for (const tipo of ["corta", "larga"]) {
      const margen = t[tipo] - contratoPara(tipo).totalMs;
      expect(margen, `margen insuficiente en ${tipo}`).toBeGreaterThanOrEqual(5000);
    }
  });

  it("el presupuesto del Worker sigue cabiendo en el techo de una llamada saliente", () => {
    for (const tipo of ["corta", "larga"]) {
      const c = contratoPara(tipo);
      expect(c.p1Ms).toBeLessThanOrEqual(c.upstreamMaxMs);
      expect(c.fallbackMs).toBeLessThanOrEqual(c.upstreamMaxMs);
      expect(c.minSliceMs).toBeLessThan(c.totalMs);
    }
  });

  it("ai.js ya no contiene los números mágicos sueltos del contrato", () => {
    /* El patrón viejo era: var timeoutMs=(tipo==="larga")?90000:60000; */
    expect(AI_SRC).not.toMatch(/90000\s*:\s*60000/);
    expect(AI_SRC).toMatch(/BATS_AI_TEMPORAL/);
  });
});
