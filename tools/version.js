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

const TARGETS = {
  "version.json": (v) => JSON.stringify({ version: v, date: jsonDate() }, null, 2) + "\n",
  "package.json": (v, src) => src.replace(/("version":\s*")[^"]*(")/, `$1${v}$2`),
  "js/state.js": (v, src) => src.replace(/version:\s*"[^"]*"/, `version: "${v}"`),
  "index.html": (v, src) => src.replace(/\?v=[0-9]+\.[0-9]+\.[0-9]+/g, `?v=${v}`),
  "service-worker.js": (v, src) => src.replace(/var CACHE = "[^"]*";/, `var CACHE = "bats-${v}";`)
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

  for (const [file, apply] of Object.entries(TARGETS)) {
    const src = read(file);
    const next = apply(version, src);
    if (norm(next) !== norm(src)) drifted.push(file);
    if (!check) write(file, next);
  }

  if (!check) {
    console.log(`bats ${version} — ${drifted.length ? "sincronizado: " + drifted.join(", ") : "ya estaba sincronizado"}`);
    console.log(`  version.json, package.json, js/state.js, index.html, service-worker.js`);
    return 0;
  }

  if (drifted.length) {
    console.error("DESFASE DE VERSIÓN — ejecuta `node tools/version.js`:");
    for (const f of drifted) console.error("  - " + f);
    process.exit(1);
  }
  console.log(`bats ${version} — versión coherente en los ${Object.keys(TARGETS).length} puntos.`);
  return 0;
}

process.exit(main());
