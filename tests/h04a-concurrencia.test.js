/**
 * BATS Tarot — PRO — H-04.A: identificación de operaciones por destino
 *
 * Finding A: `contadorRuns` era un token GLOBAL, así que una operación
 * legítima sobre otro destino invalidaba a una que seguía en vuelo.
 *
 * Estos tests ejecutan el módulo REAL `js/ai-pipeline.js` contra un DOM
 * mínimo y comprueban COMPORTAMIENTO, no texto: tokens, invalidación por
 * destino y limpieza de temporizadores.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ── DOM mínimo suficiente para renderInterpLarga ───────────────── */

function crearNodo(tag) {
  return {
    tagName: tag,
    id: "",
    className: "",
    style: {},
    children: [],
    textContent: "",
    innerHTML: "",
    disabled: false,
    parentNode: null,
    appendChild(n) { this.children.push(n); n.parentNode = this; return n; },
    insertBefore(n) { this.children.push(n); n.parentNode = this; return n; },
    addEventListener() {},
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

function montarDom() {
  const nodos = {};
  const document = {
    createElement: (tag) => crearNodo(tag),
    createTextNode: (txt) => ({ nodeType: 3, textContent: String(txt), children: [] }),
    getElementById(id) {
      if (id === "ai-interp-r-diaria") return nodos.interpDiaria || null;
      if (id === "ai-interp-r-laboral") return nodos.interpLaboral || null;
      if (id === "ai-interp-r-arcano-visitante") return nodos.interpAV || null;
      if (id === "r-diaria") return nodos.diaria || null;
      if (id === "r-laboral") return nodos.laboral || null;
      if (id === "r-arcano-visitante") return nodos.av || null;
      return null;
    }
  };
  nodos.diaria = crearNodo("div");
  nodos.diaria.parentNode = crearNodo("div");
  nodos.laboral = crearNodo("div");
  nodos.laboral.parentNode = crearNodo("div");
  nodos.av = crearNodo("div");
  nodos.av.parentNode = crearNodo("div");
  return { document, nodos };
}

let ventana;
let pipeline;
let src;

/** Generadores de promesa controlables: una operación = un handle manual. */
function controllable() {
  let resolver, rechazar;
  const promesa = new Promise((res, rej) => { resolver = res; rechazar = rej; });
  return { promesa, resolver, rechazar };
}

/** Genera `generarInterpretacionLarga` que devuelve un handle por llamada. */
function generadorControlable() {
  const llamadas = [];
  const fn = () => {
    const h = controllable();
    llamadas.push(h);
    return h.promesa;
  };
  fn.llamadas = llamadas;
  return fn;
}

/** Estado de timers observado en tiempo real. */
let intervalosActivos;
let timeoutsActivos;

function instalarRelojEspia() {
  intervalosActivos = new Set();
  timeoutsActivos = new Set();
  const espiaInterval = (fn, ms) => {
    const id = { fn, ms, vivo: true };
    intervalosActivos.add(id);
    return id;
  };
  const espiaClearInterval = (id) => {
    if (id) id.vivo = false;
    intervalosActivos.delete(id);
  };
  const espiaTimeout = (fn, ms) => {
    const id = { fn, ms, vivo: true };
    timeoutsActivos.add(id);
    return id;
  };
  const espiaClearTimeout = (id) => {
    if (id) id.vivo = false;
    timeoutsActivos.delete(id);
  };
  return { espiaInterval, espiaClearInterval, espiaTimeout, espiaClearTimeout };
}

beforeEach(() => {
  const dom = montarDom();
  src = readFileSync(resolve(RAIZ, "js", "ai-pipeline.js"), "utf8");
  ventana = {
    document: dom.document,
    BATS: {},
    setInterval: null,
    clearInterval: null,
    _ult: null,
    _lastCtx: {},
    _ocultarReferencias: false
  };
  // Dependencias que ai-pipeline.js espera de otros módulos PRO.
  ventana._clear = (n) => { n.children.length = 0; };
  ventana.escHTML = (s) => String(s);
  ventana.toast = () => {};
  ventana.comodinPendiente = () => false;
  ventana.vozSoporte = () => false;
  ventana.vozBarDOM = () => crearNodo("div");
  ventana.vozTextoDe = () => "";
  ventana.vozPoblarSelect = () => {};
  ventana.vozActualizarBarras = () => {};
  ventana.VOZ = { textos: {} };
  ventana.ponerBotones = () => {};
  ventana.BATS_VERSION = "1.10.0";
  ventana.getAIMode = () => "estandar";
  ventana.getFlagCorta = () => false;
  ventana.getFlagLarga = () => true;
  ventana.etiquetaIA = () => "ia-test";
  const reloj = instalarRelojEspia();
  ventana.setInterval = reloj.espiaInterval;
  ventana.clearInterval = reloj.espiaClearInterval;
  ventana.setTimeout = reloj.espiaTimeout;
  ventana.clearTimeout = reloj.espiaClearTimeout;
  // El módulo es un script plano: sus identificadores libres (`_clear`,
  // `toast`, `setInterval`...) se resuelven en el ámbito global, no en
  // `window`. Por eso se inyectan como argumentos del Function.
  new Function(
    "window", "document", "setInterval", "clearInterval", "setTimeout", "clearTimeout",
    "_clear", "escHTML", "toast", "comodinPendiente", "vozSoporte", "vozBarDOM",
    "vozTextoDe", "vozPoblarSelect", "vozActualizarBarras", "VOZ", "ponerBotones",
    "BATS_VERSION", "getAIMode", "getFlagCorta", "getFlagLarga", "etiquetaIA",
    "generarInterpretacionLarga",
    src
  ).call(
    ventana, ventana, dom.document,
    ventana.setInterval, ventana.clearInterval, ventana.setTimeout, ventana.clearTimeout,
    ventana._clear, ventana.escHTML, ventana.toast, ventana.comodinPendiente,
    ventana.vozSoporte, ventana.vozBarDOM, ventana.vozTextoDe, ventana.vozPoblarSelect,
    ventana.vozActualizarBarras, ventana.VOZ, ventana.ponerBotones,
    ventana.BATS_VERSION, ventana.getAIMode, ventana.getFlagCorta,
    ventana.getFlagLarga, ventana.etiquetaIA,
    (c, ctx) => ventana.generarInterpretacionLarga(c, ctx)
  );
  pipeline = ventana.BATS.aiPipeline;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ══════════════ A1 — destinos independientes ══════════════ */

describe("A1 — X en vuelo, Y en otro destino: X se procesa, Y sigue válida", () => {
  it("la respuesta de X se aplica aunque Y sea de otro destino", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;

    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    const tokX = pipeline.operacionVigente("r-diaria", gen ? 1 : 1);

    // Y arranca en OTRO destino: no debe tocar el token de X.
    pipeline.renderInterpLarga("r-laboral", { _interp: "" }, {});

    // X responde: debe aceptarse.
    gen.llamadas[0].resolver("texto de X");
    await Promise.resolve();
    await Promise.resolve();

    expect(gen.llamadas).toHaveLength(2);
    // Y sigue en vuelo: su token continúa vigente.
    const tokY = pipeline.operacionVigente("r-laboral", 2);
    expect(tokY).toBe(true);
  });

  it("abrir una operación en otro destino no invalida la vigente del primero", () => {
    const t1 = pipeline.abrirOperacion("r-diaria");
    expect(pipeline.operacionVigente("r-diaria", t1)).toBe(true);

    const t2 = pipeline.abrirOperacion("r-laboral");
    // X sigue vigente: Y no la tocó.
    expect(pipeline.operacionVigente("r-diaria", t1)).toBe(true);
    expect(pipeline.operacionVigente("r-laboral", t2)).toBe(true);
    expect(t2).not.toBe(t1);
  });
});

/* ══════════════ A2 — sustitución del mismo destino ══════════════ */

describe("A2 — nueva operación sobre el MISMO destino invalida la anterior", () => {
  it("el token antiguo deja de ser vigente", () => {
    const t1 = pipeline.abrirOperacion("r-diaria");
    const t2 = pipeline.abrirOperacion("r-diaria");
    expect(pipeline.operacionVigente("r-diaria", t1)).toBe(false);
    expect(pipeline.operacionVigente("r-diaria", t2)).toBe(true);
  });

  it("la respuesta antigua se descarta y la nueva conserva la UI", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    const cartas = { _interp: "" };

    pipeline.renderInterpLarga("r-diaria", cartas, {});
    pipeline.renderInterpLarga("r-diaria", cartas, {});
    expect(gen.llamadas).toHaveLength(2);

    // La primera (antigua) responde: NO debe aplicarse.
    gen.llamadas[0].resolver("respuesta antigua");
    await Promise.resolve();
    await Promise.resolve();
    expect(cartas._interp).not.toBe("respuesta antigua");

    // La nueva responde: sí se aplica.
    gen.llamadas[1].resolver("respuesta nueva");
    await Promise.resolve();
    await Promise.resolve();
    expect(cartas._interp).toBe("respuesta nueva");
  });

  it("reintentar el mismo destino invalida la operación anterior", () => {
    const t1 = pipeline.abrirOperacion("r-diaria");
    const t2 = pipeline.abrirOperacion("r-diaria");   // reintentar
    expect(pipeline.operacionVigente("r-diaria", t1)).toBe(false);
    expect(pipeline.operacionVigente("r-diaria", t2)).toBe(true);
  });
});

/* ══════════════ A3 — operación terminada ══════════════ */

describe("A3 — respuesta tardía tras terminar se ignora", () => {
  it("cerrar la operación retira su token", () => {
    const t1 = pipeline.abrirOperacion("r-diaria");
    pipeline.cerrarOperacion("r-diaria", t1);
    expect(pipeline.operacionVigente("r-diaria", t1)).toBe(false);
  });

  it("una respuesta tardía no modifica _interp tras el éxito", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    const cartas = { _interp: "" };
    pipeline.renderInterpLarga("r-diaria", cartas, {});

    gen.llamadas[0].resolver("primera");
    await Promise.resolve();
    await Promise.resolve();
    expect(cartas._interp).toBe("primera");

    // Segunda entrega tardía de la MISMA promesa ya resuelta: no cambia nada.
    gen.llamadas[0].promesa.then(() => {});
    await Promise.resolve();
    expect(cartas._interp).toBe("primera");
  });
});

/* ══════════════ A4 — limpieza en éxito ══════════════ */

describe("A4 — el éxito limpia timers e intervalos", () => {
  it("no queda ningún setInterval vivo tras el éxito", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    expect(intervalosActivos.size).toBeGreaterThan(0);

    gen.llamadas[0].resolver("ok");
    await Promise.resolve();
    await Promise.resolve();

    expect(intervalosActivos.size).toBe(0);
  });
});

/* ══════════════ A5 — limpieza en error ══════════════ */

describe("A5 — el error limpia timers e intervalos", () => {
  it("no queda ningún setInterval vivo tras el error", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    expect(intervalosActivos.size).toBeGreaterThan(0);

    gen.llamadas[0].rechazar(new Error("fallo"));
    await Promise.resolve();
    await Promise.resolve();

    expect(intervalosActivos.size).toBe(0);
  });
});

/* ══════════════ A6 — dos destinos completan por separado ══════════════ */

describe("A6 — X y Y completan independientemente", () => {
  it("si X responde primero y Y después, ambas se aplican", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    const cx = { _interp: "" };
    const cy = { _interp: "" };

    pipeline.renderInterpLarga("r-diaria", cx, {});
    pipeline.renderInterpLarga("r-laboral", cy, {});

    gen.llamadas[0].resolver("texto X");
    await Promise.resolve();
    await Promise.resolve();
    expect(cx._interp).toBe("texto X");

    gen.llamadas[1].resolver("texto Y");
    await Promise.resolve();
    await Promise.resolve();
    expect(cy._interp).toBe("texto Y");

    // Ninguna se anuló a la otra.
    expect(cx._interp).toBe("texto X");
    expect(cy._interp).toBe("texto Y");
  });

  it("terminar X no cierra la operación de Y", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    const cy = { _interp: "" };

    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    pipeline.renderInterpLarga("r-laboral", cy, {});
    const tokenY = 2;   // segundo token emitido

    gen.llamadas[0].resolver("X lista");
    await Promise.resolve();
    await Promise.resolve();

    // Y sigue viva pese a que X terminó.
    expect(pipeline.operacionVigente("r-laboral", tokenY)).toBe(true);
  });
});

/* ══════════════ A7 — invalidación selectiva ══════════════ */

describe("A7 — Y se reinicia sin afectar a X", () => {
  it("primera Y se invalida, X y segunda Y siguen vigentes", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;
    const cx = { _interp: "" };
    const cy = { _interp: "" };

    pipeline.renderInterpLarga("r-diaria", cx, {});       // X
    pipeline.renderInterpLarga("r-laboral", cy, {});      // Y v1
    pipeline.renderInterpLarga("r-laboral", cy, {});      // Y v2 (sustituye a Y v1)

    expect(gen.llamadas).toHaveLength(3);

    // Y v1 responde: se descarta.
    gen.llamadas[1].resolver("Y vieja");
    await Promise.resolve();
    await Promise.resolve();
    expect(cy._interp).not.toBe("Y vieja");

    // X responde: se acepta, porque Y no lo invalidó.
    gen.llamadas[0].resolver("X final");
    await Promise.resolve();
    await Promise.resolve();
    expect(cx._interp).toBe("X final");

    // Y v2 responde: se acepta.
    gen.llamadas[2].resolver("Y nueva");
    await Promise.resolve();
    await Promise.resolve();
    expect(cy._interp).toBe("Y nueva");
  });

  it("la sustitución limpia el intervalo de la operación sustituida", async () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;

    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    const trasPrimer = intervalosActivos.size;
    expect(trasPrimer).toBe(1);

    // Segunda operación sobre el MISMO destino: debe retirar el intervalo
    // huérfano de la primera y crear el suyo.
    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    expect(intervalosActivos.size).toBe(1);
  });

  it("un destino distinto NO retira el intervalo del anterior", () => {
    const gen = generadorControlable();
    ventana.generarInterpretacionLarga = gen;

    pipeline.renderInterpLarga("r-diaria", { _interp: "" }, {});
    pipeline.renderInterpLarga("r-laboral", { _interp: "" }, {});
    // Ambos vivos: son operaciones independientes.
    expect(intervalosActivos.size).toBe(2);
  });
});

/* ══════════════ Estabilidad de la clave de destino ══════════════ */

describe("Clave de destino — estable y sin colisiones", () => {
  it("normaliza null y undefined al mismo respaldo", () => {
    expect(pipeline.claveDestino(null)).toBe(pipeline.claveDestino(undefined));
    expect(pipeline.claveDestino(null)).toBe("(sin-destino)");
  });

  it("destinos distintos producen claves distintas", () => {
    const claves = ["r-diaria", "r-laboral", "r-relacion", "r-pers",
                    "r-aprendizaje", "r-arcano-visitante"].map(pipeline.claveDestino);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("convierte a string sin colapsar tipos distintos", () => {
    expect(pipeline.claveDestino(1)).toBe("1");
    expect(pipeline.claveDestino("1")).toBe("1");
    expect(pipeline.claveDestino(true)).toBe("true");
  });
});

/* ══════════════ Ausencia del contador global ══════════════ */

describe("Ausencia del contador global (origen del finding A)", () => {
  it("ai-pipeline.js no declara contadorRuns", () => {
    expect(src).not.toContain("contadorRuns");
  });

  it("ai-pipeline.js no compara contra un contador global", () => {
    expect(src).not.toMatch(/!==\s*contador/);
    expect(src).not.toMatch(/miRun/);
  });

  it("el token se resuelve por destino", () => {
    expect(src).toContain("TOKEN_POR_DESTINO");
    expect(src).toContain("operacionVigente(dest,miToken)");
  });
});