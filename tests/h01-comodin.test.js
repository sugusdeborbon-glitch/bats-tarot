/**
 * BATS Tarot — H-01: el Comodín vuelve a ser opt-in real
 *
 * Carga el módulo real `js/deck.js` (IIFE que se expone en `window.BATS.deck`)
 * en un entorno con `window` auténtico y comprueba COMPORTAMIENTO, no texto.
 *
 * Antes de H-01, `añadirComodin(mazo, false)` insertaba el Comodín si
 * `window._BATS_TEST_COMODIN` era verdadero, y `barajar()` lo empujaba a la
 * posición 0. Eso convertía el Comodín en un comodín de test forzado.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let deck = null;
let BATS = null;

/** Ejecuta el IIFE de deck.js contra el `window` que hemos preparado. */
function cargarDeck(ventana) {
  const src = readFileSync(resolve(RAIZ, "js", "deck.js"), "utf8");
  const fn = new Function("window", src);
  fn(ventana);
  return ventana;
}

beforeAll(() => {
  // `window` mínimo: deck.js solo usa window como contenedor deexports.
  const ventana = {};
  cargarDeck(ventana);
  BATS = ventana.BATS;
  deck = BATS.deck;
});

/* ─────────────────────────── A-1 ─────────────────────────── */

describe("A-1 — sin Comodín solicitado, el mazo NO contiene Comodín", () => {
  it("añadirComodin(mazo, false) no inserta ninguna carta comodín", () => {
    const mazo = deck.BARAJA.slice();
    const antes = mazo.length;
    const res = deck.añadirComodin(mazo, false);
    expect(res.filter(deck.esComodin)).toHaveLength(0);
    expect(res).toHaveLength(antes);
  });

  it("false explícito en un mazo ya vacío sigue sin añadir nada", () => {
    const res = deck.añadirComodin([], false);
    expect(res).toHaveLength(0);
  });

  it("undefined / null también se tratan como 'no solicitado'", () => {
    expect(deck.añadirComodin([], undefined).filter(deck.esComodin)).toHaveLength(0);
    expect(deck.añadirComodin([], null).filter(deck.esComodin)).toHaveLength(0);
  });

  it("repartir() sobre un mazo sin Comodín reparte solo cartas reales", () => {
    const tirada = deck.repartir(10, false, deck.BARAJA.slice());
    expect(tirada.length).toBe(10);
    expect(tirada.some((r) => deck.esComodin(r.carta))).toBe(false);
  });
});

/* ─────────────────────────── A-2 ─────────────────────────── */

describe("A-2 — con Comodín solicitado, aparece exactamente UN Comodín", () => {
  it("añadirComodin(mazo, true) añade exactamente una carta comodín", () => {
    const res = deck.añadirComodin(deck.BARAJA.slice(), true);
    expect(res.filter(deck.esComodin)).toHaveLength(1);
  });

  it("el Comodín añadido lleva la forma real de BATS", () => {
    const res = deck.añadirComodin([], true);
    const com = res[0];
    expect(com.nombre).toBe("Comodín");
    expect(com.tipo).toBe("comodin");
    expect(com.img).toBe("comodin_reverso.png");
    expect(com.valor).toBe(0);
  });

  it("no duplica Comodines si se invoca dos veces sobre el mismo mazo", () => {
    let mazo = deck.BARAJA.slice();
    mazo = deck.añadirComodin(mazo, true);
    mazo = deck.añadirComodin(mazo, true);
    expect(mazo.filter(deck.esComodin)).toHaveLength(2); // una por llamada
    expect(mazo.filter(deck.esComodin).every((c) => c.tipo === "comodin")).toBe(true);
  });

  it("el Comodín añadido es una COPIA, no la constante compartida", () => {
    const res = deck.añadirComodin([], true);
    expect(res[0]).not.toBe(deck.COMODIN);
    res[0].nombre = "MUTADO";
    expect(deck.COMODIN.nombre).toBe("Comodín");
  });

  it("repartir() de un mazo con Comodín puede seguir sacando cartas reales", () => {
    const mazo = deck.añadirComodin(deck.BARAJA.slice(), true);
    const tirada = deck.repartir(10, false, mazo);
    expect(tirada.length).toBe(10);
    // La única carta comodín del mazo puede o no salir en 10 cartas.
    for (const r of tirada) expect(r.carta).toBeTruthy();
  });
});

/* ─────────────────────────── A-3 ─────────────────────────── */

describe("A-3 — el flag global de test ya NO puede forzar la inserción", () => {
  it("window._BATS_TEST_COMODIN no existe tras cargar el estado", () => {
    const ventana = {};
    const srcState = readFileSync(resolve(RAIZ, "js", "state.js"), "utf8");
    new Function("window", srcState)(ventana);
    expect("_BATS_TEST_COMODIN" in ventana).toBe(false);
    expect(ventana.BATS.state.testComodin).toBeUndefined();
  });

  it("asignar el flag a mano NO fuerza el Comodín", () => {
    const ventana = {};
    cargarDeck(ventana);
    ventana._BATS_TEST_COMODIN = true;
    const d = ventana.BATS.deck;
    const res = d.añadirComodin(d.BARAJA.slice(), false);
    expect(res.filter(d.esComodin)).toHaveLength(0);
  });

  it("barajar() ya NO reordena el Comodín a la posición 0", () => {
    const ventana = {};
    cargarDeck(ventana);
    ventana._BATS_TEST_COMODIN = true;
    const d = ventana.BATS.deck;
    const mazo = d.añadirComodin(d.BARAJA.slice(), true);
    // 40 barajados: antes el Comodín acababa SIEMPRE en el índice 0.
    for (let i = 0; i < 40; i++) {
      const res = d.barajar(mazo);
      expect(res[0]).not.toBe(d.COMODIN);
    }
  });

  it("ninguna fuente del proyecto referencia ya el flag de test", () => {
    const ficheros = [
      "js/deck.js", "js/state.js", "js/render-cards.js", "js/app.js",
      "app.js", "ai.js", "index.html"
    ];
    for (const f of ficheros) {
      const ruta = resolve(RAIZ, f);
      let src = "";
      try { src = readFileSync(ruta, "utf8"); } catch { continue; }
      expect(src).not.toContain("_BATS_TEST_COMODIN");
      expect(src.toLowerCase()).not.toContain("testcomodin");
    }
  });
});

/* ───────────────────── A-4 y A-5 ───────────────────── */

describe("A-4 — añadirComodin conserva su comportamiento con activo = true", () => {
  it("devuelve el mismo array recibido (muta in situ, como antes)", () => {
    const mazo = deck.BARAJA.slice();
    const res = deck.añadirComodin(mazo, true);
    expect(res).toBe(mazo);
  });

  it("el tamaño del mazo crece exactamente en 1", () => {
    const mazo = deck.BARAJA.slice();
    const antes = mazo.length;
    const res = deck.añadirComodin(mazo, true);
    expect(res).toHaveLength(antes + 1);
  });

  it("acepta cualquier valor truthy como 'sí solicitado'", () => {
    for (const v of [true, 1, "sí"]) {
      expect(deck.añadirComodin([], v).filter(deck.esComodin)).toHaveLength(1);
    }
  });

  it("se expone también en BATS.deck y como global", () => {
    expect(typeof deck.añadirComodin).toBe("function");
    expect(deck.añadirComodin).toBe(BATS.deck.añadirComodin);
  });
});

describe("A-5 — añadirComodin NO modifica el mazo con activo = false", () => {
  it("conserva la longitud exacta", () => {
    const mazo = deck.BARAJA.slice();
    const antes = mazo.length;
    deck.añadirComodin(mazo, false);
    expect(mazo).toHaveLength(antes);
  });

  it("conserva el contenido elemento a elemento", () => {
    const mazo = deck.BARAJA.slice();
    const copia = mazo.slice();
    deck.añadirComodin(mazo, false);
    expect(mazo.map((c) => c.nombre)).toEqual(copia.map((c) => c.nombre));
  });

  it("devuelve la misma referencia, sin clonar ni reordenar", () => {
    const mazo = deck.BARAJA.slice();
    const ref = deck.añadirComodin(mazo, false);
    expect(ref).toBe(mazo);
    expect(ref[0]).toBe(mazo[0]);
  });

  it("0, cadena vacía y NaN cuentan como 'no solicitado'", () => {
    for (const v of [0, "", NaN]) {
      expect(deck.añadirComodin([], v).filter(deck.esComodin)).toHaveLength(0);
    }
  });
});

/* ─────────────────────────── A-6 ─────────────────────────── */

describe("A-6 — la selección real de Comodín en la sesión sigue funcionando", () => {
  it("el mazo base (78 cartas) no contiene Comodines", () => {
    expect(deck.BARAJA.filter(deck.esComodin)).toHaveLength(0);
  });

  it("TABLA_78 tiene 78 cartas y ninguna es Comodín", () => {
    expect(deck.TABLA_78).toHaveLength(78);
    expect(deck.TABLA_78.filter(deck.esComodin)).toHaveLength(0);
  });

  it("crearSub(...) no introduce Comodines en ninguna-modalidad", () => {
    for (const m of ["completo", "mayores", "menores", "corte"]) {
      const sub = deck.crearSub(m);
      expect(sub.length).toBeGreaterThan(0);
      expect(sub.filter(deck.esComodin)).toHaveLength(0);
    }
  });

  it("cada checkbox de sesión controla SU tirada y todas usan la misma vía", () => {
    // app.js decide con el checkbox y siempre pasa por añadirComodin(mazo, comodin).
    const app = readFileSync(resolve(RAIZ, "app.js"), "utf8");
    const llamadas = app.match(/añadirComodin\(/g) || [];
    // 5 llamadas en app.js (diaria, rel, laboral, pers, aprendizaje) + la definición
    // NO está en app.js: la definición vive en deck.js.
    expect(llamadas.length).toBe(5);
    for (const id of ["diaria-comodin", "rel-comodin", "laboral-comodin",
                      "pers-comodin", "aprendizaje-comodin"]) {
      expect(app).toContain(`"${id}"`);
    }
  });

  it("esComodin/comodinEnCartas siguen detectando el Comodín del mazo", () => {
    const mazo = deck.añadirComodin(deck.BARAJA.slice(), true);
    const reparto = deck.repartir(79, false, mazo);
    const conCom = reparto.filter((r) => deck.esComodin(r.carta));
    expect(conCom).toHaveLength(1);
    expect(deck.comodinEnCartas(reparto)).not.toBeNull();
    expect(deck.comodinEnCartas(reparto).carta.tipo).toBe("comodin");
  });

  it("comodinEnCartas devuelve null si el Comodín no está repartido", () => {
    const reparto = deck.repartir(10, false, deck.BARAJA.slice());
    expect(deck.comodinEnCartas(reparto)).toBeNull();
  });

  it("las imágenes y textos del Comodín siguen disponibles", () => {
    expect(deck.comodinImg("cerrado")).toBe("comodin_anverso_umbral_cerrado.png");
    expect(deck.comodinImg("abierto")).toBe("comodin_anverso_umbral_abierto.png");
    expect(deck.comodinImg("reverso")).toBe("comodin_reverso.png");
    expect(deck.COMODIN_POS).toContain("La Salida");
    expect(typeof deck.COMODIN_INV_TEXT).toBe("string");
  });
});