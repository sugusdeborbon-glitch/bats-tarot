/**
 * BATS Tarot — identidad de versión (PASO 0.4 de la nueva dirección).
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * La versión del producto estaba escrita a mano en cuatro sitios y los cuatro
 * discrepaban:
 *
 *   version.json ............ 1.10.0
 *   package.json ............ 1.10.0
 *   js/state.js ............. 1.10.0   (lo que ve el usuario en window.BATS_VERSION)
 *   index.html .............. ?v=1.10.0 (12 veces) y ?v=1.11.0 (4 veces)
 *   service-worker.js ....... "bats-v37"  (contador sin relación con la versión)
 *
 * Con cuatro fuentes, la caché del navegador puede mezclar dos builds y no
 * existe forma mecánica de saber cuál está usando un usuario.
 *
 * DECISIÓN
 * --------
 * `version.json` es la ÚNICA fuente de verdad. Todo lo demás se deriva de ahí
 * por script, y `--check` falla si algo se ha editado a mano.
 *
 * El nombre de la caché del service worker pasa a ser `bats-<version>` en lugar
 * de un contador (`bats-v37`). Así la caché y la versión son el mismo hecho:
 * un bump de versión ES un bump de caché, y no se puede "subir la caché" sin
 * subir la versión. Esto elimina de raíz la práctica de los bumps rituales.
 *
 * USO
 *   node tools/version.js          # sincroniza todo a version.json
 *   node tools/version.js --check  # sale con código 1 si algo está desfasado
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);

/**
 * Android exige un `versionCode` entero y monótono. Mapeo determinista desde la
 * versión de producto: major*10000 + minor*100 + patch (1.11.1 -> 11101).
 * minor y patch deben caber en dos dígitos; si no, el bump deja de ser
 * representable y es mejor fallar aquí que publicar un código equivocado.
 */
function versionCode(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error("version.json no usa MAJOR.MINOR.PATCH: " + v);
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  if (minor > 99 || patch > 99) throw new Error("minor y patch deben ser <= 99: " + v);
  return major * 10000 + minor * 100 + patch;
}

const TARGETS = {
  "version.json": (v) => JSON.stringify({ version: v, date: jsonDate() }, null, 2) + "\n",
  "package.json": (v, src) => src.replace(/("version":\s*")[^"]*(")/, `$1${v}$2`),
  "js/state.js": (v, src) => src.replace(/version:\s*"[^"]*"/, `version: "${v}"`),
  "index.html": (v, src) => src.replace(/\?v=[0-9]+\.[0-9]+\.[0-9]+/g, `?v=${v}`),
  "service-worker.js": (v, src) => src.replace(/var CACHE = "[^"]*";/, `var CACHE = "bats-${v}";`)
  ,
  // El APK es un entregable aparte: su versionCode llevaba desde el principio
  // en 1 y ninguna comprobación lo miraba.
  "android/app/build.gradle": (v, src) =>
    src
      .replace(/versionCode\s+\d+/, "versionCode " + versionCode(v))
      .replace(/versionName\s+"[^"]*"/, 'versionName "' + v + '"')

};

function jsonDate() {
  try {
    return JSON.parse(read("version.json")).date || "2026-10-05";
  } catch (_) {
    return "2026-10-05";
  }
}

/**
 * Compara ignorando el final de línea.
 *
 * Sin esto la comprobación falla en cualquier clon con core.autocrlf=true
 * (Windows): git escribe CRLF al hacer checkout, la herramienta genera LF, y
 * el fichero aparece como "modificado" sin haberlo cambiado nadie.
 */
const norm = (s) => s.replace(/\r\n/g, "\n");

function currentVersion() {
  return JSON.parse(read("version.json")).version;
}

function main() {
  const check = process.argv.includes("--check");
  const version = currentVersion();
  const drifted = [];
  const ausentes = [];

  for (const [file, apply] of Object.entries(TARGETS)) {
    // Los derivados que no existen en este árbol se omiten con aviso: `android/`
    // está en .gitignore, de modo que un clon limpio no lo trae y un ENOENT sin
    // contexto no le dice a nadie qué hacer. Si el fichero existe, se comprueba.
    if (!fs.existsSync(path.join(ROOT, file))) {
      ausentes.push(file);
      continue;
    }
    const src = read(file);
    const next = apply(version, src);
    if (norm(next) !== norm(src)) drifted.push(file);
    if (!check) write(file, next);
  }

  if (!check) {
    console.log(`bats ${version} — ${drifted.length ? "sincronizado: " + drifted.join(", ") : "ya estaba sincronizado"}`);
    console.log(`  ${Object.keys(TARGETS).join(", ")}`);
    if (ausentes.length) console.log("  omitidos (no existen en este árbol): " + ausentes.join(", "));
    return 0;
  }

  if (drifted.length) {
    console.error("DESFASE DE VERSIÓN — ejecuta `node tools/version.js`:");
    for (const f of drifted) console.error("  - " + f);
    return 1;
  }
    if (ausentes.length) console.log("  omitidos (no existen en este árbol): " + ausentes.join(", "));
  console.log(`bats ${version} — versión coherente en los ${Object.keys(TARGETS).length - ausentes.length} puntos.`);
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { TARGETS, versionCode, currentVersion, main };
