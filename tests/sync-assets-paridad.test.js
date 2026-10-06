/**
 * BATS Tarot — punto ciego de paridad (Tarea 1 del encargo post-auditoría).
 *
 * EL PROBLEMA QUE ESTE FICHERO CIERRA
 * -----------------------------------
 * `tools/sync-assets.js --check` era un falso negativo estructural: recorría
 * SOLO los ficheros declarados en el payload, de modo que cualquier fichero
 * suelto en `www/` o en `android/.../assets/public/` entraba en el APK sin que
 * nadie lo viera. Había dos de verdad —`package.json` con una versión desfasada
 * y `vitest.config.js`— y los dos viajaban dentro del APK distribuido.
 *
 * LO QUE COMPRUEBA
 * ----------------
 * 1) El payload declarado es el esperado y contiene sus piezas críticas.
 * 2) `extras()` detecta ficheros no declarados, sueltos y anidados.
 * 3) Los dos ficheros que genera Capacitor NO son extras en android, y sí lo
 *    serían en `www/` (www no admite extras de ninguna clase).
 * 4) Los árboles reales están limpios y `--check` sale 0 como proceso.
 *
 * Los árboles de prueba se crean en `os.tmpdir()`: nunca se escribe en `www/`
 * ni en los assets reales del APK desde los tests.
 */
import { describe, it, expect, afterAll } from "vitest";
import { createRequire } from "module";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const sync = require(path.join(RAIZ, "tools", "sync-assets.js"));

const WWW = path.join(RAIZ, "www");
const ANDROID = path.join(RAIZ, "android", "app", "src", "main", "assets", "public");

const temporales = [];

/** Árbol temporal con los ficheros indicados (rutas relativas). */
function arbol(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bats-paridad-"));
  temporales.push(dir);
  for (const rel of files) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, "contenido de prueba");
  }
  return dir;
}

afterAll(() => {
  for (const d of temporales) fs.rmSync(d, { recursive: true, force: true });
});

describe("payload declarado", () => {
  const files = sync.payload();

  it("declara al menos las 108 piezas que se distribuyen", () => {
    expect(files.length).toBeGreaterThanOrEqual(108);
  });

  it("incluye los ficheros críticos del producto", () => {
    for (const f of [
      "index.html",
      "service-worker.js",
      "js/state.js",
      "manifest.json",
      "version.json",
      "comodin_anverso_umbral_abierto.png",
      "comodin_anverso_umbral_cerrado.png",
      "comodin_reverso.png"
    ]) {
      expect(files).toContain(f);
    }
    expect(files.some((f) => /^cartas\/.+\.(jpg|jpeg|png)$/i.test(f))).toBe(true);
  });

  it("no declara ficheros de herramienta ni de test", () => {
    expect(files).not.toContain("package.json");
    expect(files).not.toContain("vitest.config.js");
  });
});

describe("extras(): ficheros presentes en el destino que no se declaran", () => {
  const declarados = ["index.html", "js/state.js"];

  it("detecta un extra suelto en la raíz del destino", () => {
    const dir = arbol([...declarados, "zz_prueba.txt"]);
    expect(sync.extras(dir, declarados, [])).toEqual(["zz_prueba.txt"]);
  });

  it("detecta extras anidados y los devuelve ordenados", () => {
    const dir = arbol([...declarados, "js/ai/sobra.js", "cartas/nueva.jpg"]);
    expect(sync.extras(dir, declarados, [])).toEqual(["cartas/nueva.jpg", "js/ai/sobra.js"]);
  });

  it("no marca nada cuando el destino es exactamente el payload", () => {
    const dir = arbol(declarados);
    expect(sync.extras(dir, declarados, [])).toEqual([]);
  });

  it("tolera los 2 ficheros de Capacitor solo en el destino que los permite", () => {
    const dir = arbol([...declarados, "cordova.js", "cordova_plugins.js"]);
    expect(sync.extras(dir, declarados, sync.EXTRAS.android)).toEqual([]);
    expect(sync.extras(dir, declarados, sync.EXTRAS.www)).toEqual(["cordova.js", "cordova_plugins.js"]);
  });

  it("www no admite ningún extra y android solo los 2 de Capacitor", () => {
    expect(sync.EXTRAS.www).toEqual([]);
    expect(sync.EXTRAS.android).toEqual(["cordova.js", "cordova_plugins.js"]);
  });

  it("devuelve vacío si el destino no existe", () => {
    const inexistente = path.join(os.tmpdir(), "bats-no-existe-" + process.pid);
    expect(sync.extras(inexistente, declarados, [])).toEqual([]);
  });
});

const hayArboles = fs.existsSync(WWW) && fs.existsSync(ANDROID);

describe.skipIf(!hayArboles)("árboles reales (regresión de los huérfanos del APK)", () => {
  it("www/ no tiene ningún fichero no declarado", () => {
    expect(sync.extras(WWW, sync.payload(), sync.EXTRAS.www)).toEqual([]);
  });

  it("los assets del APK no tienen huérfanos: payload + los 2 de Capacitor", () => {
    expect(sync.extras(ANDROID, sync.payload(), sync.EXTRAS.android)).toEqual([]);
    expect(fs.existsSync(path.join(ANDROID, "cordova.js"))).toBe(true);
    expect(fs.existsSync(path.join(ANDROID, "cordova_plugins.js"))).toBe(true);
    expect(fs.existsSync(path.join(ANDROID, "package.json"))).toBe(false);
    expect(fs.existsSync(path.join(ANDROID, "vitest.config.js"))).toBe(false);
  });

  it("--check sale 0 ejecutando el script real como proceso", () => {
    const out = execFileSync(process.execPath, ["tools/sync-assets.js", "--check"], {
      cwd: RAIZ,
      encoding: "utf8"
    });
    expect(out).toContain("paridad OK");
    expect(out).toContain("sin extras");
  });
});
