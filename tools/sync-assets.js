/**
 * BATS Tarot — paridad de las tres copias del producto (PASO 0.4b).
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * BATS tenía tres copias del frontend:
 *
 *   raíz ............... el código fuente
 *   www/ ............... webDir de Capacitor; lo que se sirve dentro del APK
 *   android/…/public/ .. destino de `npx cap copy`
 *
 * `www/` y `android/` estaban en `.gitignore`, así que la copia que realmente
 * se distribuye al usuario NO estaba versionada. Cuando H-01 y H-04.A se
 * aplicaron en la raíz y no se copiaron, las tres copias divergieron en
 * exactamente esos ficheros — y nada en el repositorio lo señalaba. El
 * resultado: un APK que se comporta de forma distinta de la web.
 *
 * DECISIÓN
 * --------
 * La raíz es la ÚNICA fuente. `www/` y `android/` son artefactos de
 * compilación, no código fuente: se generan, no se editan. Este script es el
 * único camino para generarlos, y `--check` verifica que sigan siendo
 * derivados y no copias editadas a mano.
 *
 * Es CRÍTICO que esto exista: sin él, la paridad depende de la disciplina de
 * quien recuerda ejecutar la copia.
 *
 * USO
 *   node tools/sync-assets.js          # sincroniza raíz → www/ y raíz → android/
 *   node tools/sync-assets.js --check  # sale con 1 si hay divergencia
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const WWW = path.join(ROOT, "www");
const ANDROID = path.join(ROOT, "android", "app", "src", "main", "assets", "public");

/**
 * Carga útil que se distribuye. Todo lo que el navegador o el APK necesitan
 * para funcionar. `js/` se recorre entero (así los módulos nuevos, como
 * `js/ai/`, llegan sin tocar esta lista).
 */
const PAYLOAD_FILES = [
  "index.html",
  "style.css",
  "app.js",
  "ai.js",
  "datos_bats.js",
  "quintaesencia_bats.js",
  "service-worker.js",
  "manifest.json",
  "novedades.json",
  "offline.html",
  "icono-512.png",
  "version.json",
  "PROMPTS.md"
];

const PAYLOAD_DIRS = ["js", "cartas"];

const PAYLOAD_EXTRA = [
  "comodin_anverso_umbral_abierto.png",
  "comodin_anverso_umbral_cerrado.png",
  "comodin_reverso.png"
];

function walk(dir, base, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = base ? base + "/" + name : name;
    if (fs.statSync(full).isDirectory()) walk(full, rel, acc);
    else acc.push(rel);
  }
  return acc;
}

/** Lista de ficheros a distribuir, desde la raíz (fuente de verdad). */
function payload() {
  const files = [];
  for (const f of PAYLOAD_FILES) {
    if (fs.existsSync(path.join(ROOT, f))) files.push(f);
  }
  for (const d of PAYLOAD_DIRS) {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) walk(full, d, files);
  }
  for (const f of PAYLOAD_EXTRA) {
    if (fs.existsSync(path.join(ROOT, f))) files.push(f);
  }
  return files.sort();
}

/* Extensiones de texto: se comparan normalizando el final de línea. */
const TEXTO = new Set([".js", ".html", ".css", ".json", ".md", ".txt", ".xml", ".webmanifest"]);

function esTexto(rel) {
  return TEXTO.has(path.extname(rel).toLowerCase());
}

/**
 * Huella de un fichero.
 *
 * En los de TEXTO se normaliza CRLF→LF antes de hashear. Sin esto la
 * comprobación falla en cualquier clon con core.autocrlf=true (Windows): git
 * convierte la raíz a CRLF al hacer checkout, las copias generadas siguen en
 * LF, y todo el frontend aparece como divergente sin que nadie lo cambiara.
 * Los binarios (png, jpg) se hashean tal cual, byte a byte.
 */
function hash(abs, rel) {
  const buf = fs.readFileSync(abs);
  const contenido = esTexto(rel) ? Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8") : buf;
  return crypto.createHash("sha256").update(contenido).digest("hex").slice(0, 12);
}

function ensureDir(abs) {
  fs.mkdirSync(abs, { recursive: true });
}

function copyTo(root, dest, rel) {
  const from = path.join(root, rel);
  const to = path.join(dest, rel);
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function diff(dest, files) {
  const out = { missing: [], changed: [], ok: 0 };
  for (const rel of files) {
    const target = path.join(dest, rel);
    if (!fs.existsSync(target)) {
      out.missing.push(rel);
      continue;
    }
    if (hash(path.join(ROOT, rel), rel) !== hash(target, rel)) out.changed.push(rel);
    else out.ok++;
  }
  return out;
}

function main() {
  const check = process.argv.includes("--check");
  const files = payload();
  const targets = [["www/", WWW], ["android/app/src/main/assets/public/", ANDROID]];

  if (!check) {
    for (const [, dest] of targets) {
      ensureDir(dest);
      for (const rel of files) copyTo(ROOT, dest, rel);
      console.log(`copiado ${files.length} ficheros → ${path.relative(ROOT, dest)}`);
    }
    return 0;
  }

  let bad = 0;
  for (const [label, dest] of targets) {
    if (!fs.existsSync(dest)) {
      console.error(`PARIDAD — ${label} no existe`);
      bad++;
      continue;
    }
    const d = diff(dest, files);
    const total = d.missing.length + d.changed.length;
    if (total) {
      console.error(`PARIDAD ROTA — ${label}`);
      for (const m of d.missing) console.error(`  ausente : ${m}`);
      for (const c of d.changed) console.error(`  distinto: ${c}`);
      console.error(`  ejecuta: node tools/sync-assets.js`);
      bad++;
    } else {
      console.log(`paridad OK — ${label} (${d.ok} ficheros idénticos)`);
    }
  }
  return bad ? 1 : 0;
}

process.exit(main());
