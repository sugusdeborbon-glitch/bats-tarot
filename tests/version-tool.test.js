/**
 * BATS Tarot — identidad de versión (medida 2: cubrir build.gradle).
 *
 * QUÉ SE EXIGE
 * ------------
 * 1) `versionCode(v) = major*10000 + minor*100 + patch`, monótono y determinista
 *    (1.11.1 -> 11101). Un versionCode mal formado en Android hace que la
 *    actualización del APK sea rechazada, así que el mapeo se prueba.
 * 2) Los 6 puntos derivados de `version.json` están al día en el árbol real:
 *    version.json, package.json, js/state.js, index.html, service-worker.js y
 *    ahora también android/app/build.gradle.
 * 3) La deriva se detecta de verdad: se monta un ÁRBOL AISLADO (copia temporal
 *    de la herramienta y de los 6 puntos), se desincroniza ahí y se comprueba
 *    que `--check` sale 1. Nunca se escribe en los ficheros reales del repo.
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
const version = require(path.join(RAIZ, "tools", "version.js"));

const temporales = [];
afterAll(() => {
  for (const d of temporales) fs.rmSync(d, { recursive: true, force: true });
});

const norm = (s) => s.replace(/\r\n/g, "\n");

function correrCheck(dir) {
  try {
    // stderr se captura, no se hereda: la salida esperada de un desfase forma
    // parte de la asercion y no debe ensuciar la salida de npm run verify.
    const out = execFileSync(process.execPath, ["tools/version.js", "--check"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { codigo: 0, salida: out };
  } catch (e) {
    return { codigo: e.status, salida: String(e.stdout || "") + String(e.stderr || "") };
  }
}

/** Copia la herramienta y los 6 puntos declarados a un árbol temporal. */
function arbolAislado() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bats-version-"));
  temporales.push(dir);
  fs.mkdirSync(path.join(dir, "tools"), { recursive: true });
  fs.copyFileSync(path.join(RAIZ, "tools", "version.js"), path.join(dir, "tools", "version.js"));
  for (const rel of Object.keys(version.TARGETS)) {
    const destino = path.join(dir, rel);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(path.join(RAIZ, rel), destino);
  }
  return dir;
}

describe("versionCode(v)", () => {
  it("mapea major*10000 + minor*100 + patch", () => {
    expect(version.versionCode("1.11.1")).toBe(11101);
    expect(version.versionCode("1.11.0")).toBe(11100);
    expect(version.versionCode("2.0.0")).toBe(20000);
    expect(version.versionCode("10.5.3")).toBe(100503);
  });

  it("crece con cada componente: el bump siempre es monótono", () => {
    const a = version.versionCode("1.11.0");
    const b = version.versionCode("1.11.1");
    const c = version.versionCode("1.12.0");
    const d = version.versionCode("2.0.0");
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThan(d);
  });

  it("rechaza versiones que no son MAJOR.MINOR.PATCH", () => {
    for (const mala of ["1.11", "v1.11.1", "1.11.1.2", "", "1.x.0"]) {
      expect(() => version.versionCode(mala), mala).toThrow();
    }
  });

  it("rechaza minor y patch que no caben en dos dígitos", () => {
    expect(() => version.versionCode("1.100.0")).toThrow();
    expect(() => version.versionCode("1.11.100")).toThrow();
  });
});

describe("los 6 puntos derivados de version.json", () => {
  const v = version.currentVersion();
  const puntos = Object.keys(version.TARGETS);

  it("declara exactamente los 6 puntos, incluido build.gradle", () => {
    expect(puntos).toEqual([
      "version.json",
      "package.json",
      "js/state.js",
      "index.html",
      "service-worker.js",
      "android/app/build.gradle"
    ]);
  });

  it("el árbol real está sincronizado en los 6 (lo mismo que comprueba --check)", () => {
    const desfasados = puntos.filter((rel) => {
      const src = fs.readFileSync(path.join(RAIZ, rel), "utf8");
      return norm(version.TARGETS[rel](v, src)) !== norm(src);
    });
    expect(desfasados).toEqual([]);
  });
});

describe("target de Android", () => {
  const aplica = (v, src) => version.TARGETS["android/app/build.gradle"](v, src);

  it("escribe versionCode y versionName derivados de la versión", () => {
    const src = 'defaultConfig {\n        versionCode 1\n        versionName "1.0"\n}\n';
    const out = aplica("1.11.1", src);
    expect(out).toContain("versionCode 11101");
    expect(out).toContain('versionName "1.11.1"');
    expect(out).not.toContain("versionCode 1\n");
  });

  it("es idempotente", () => {
    const src = fs.readFileSync(path.join(RAIZ, "android/app/build.gradle"), "utf8");
    const una = aplica("1.11.1", src);
    expect(aplica("1.11.1", una)).toBe(una);
  });
});

describe("deriva de versión en árbol aislado", () => {
  it("copia coherente: --check sale 0", () => {
    const dir = arbolAislado();
    const r = correrCheck(dir);
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain("versión coherente");
  });

  it("version.json desincronizado: --check sale 1 y lista los puntos, build.gradle incluido", () => {
    const dir = arbolAislado();
    const ruta = path.join(dir, "version.json");
    const original = fs.readFileSync(ruta, "utf8");
    fs.writeFileSync(ruta, original.replace(/"version":\s*"[^"]*"/, '"version": "9.9.9"'));

    const r = correrCheck(dir);
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("DESFASE DE VERSIÓN");
    expect(r.salida).toContain("android/app/build.gradle");
    expect(r.salida).toContain("index.html");

    fs.writeFileSync(ruta, original);
    expect(correrCheck(dir).codigo).toBe(0);
  });

  it("build.gradle desincronizado por sí solo: --check sale 1", () => {
    const dir = arbolAislado();
    const ruta = path.join(dir, "android/app/build.gradle");
    fs.writeFileSync(ruta, fs.readFileSync(ruta, "utf8").replace(/versionCode\s+\d+/, "versionCode 1"));
    const r = correrCheck(dir);
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("android/app/build.gradle");
  });

  it("omite con aviso los puntos ausentes: un clon limpio no trae android/", () => {
    const dir = arbolAislado();
    fs.rmSync(path.join(dir, "android"), { recursive: true, force: true });
    const r = correrCheck(dir);
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain("omitidos");
    expect(r.salida).toContain("android/app/build.gradle");
    expect(r.salida).toContain("5 puntos");
  });
});
