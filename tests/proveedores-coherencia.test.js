/**
 * BATS Tarot — coherencia de proveedores entre frontend y Worker (medida 2).
 *
 * EL DEFECTO QUE ESTE FICHERO CIERRA
 * ----------------------------------
 * El commit f70cdf7 (2026-09-18) quitó NVIDIA y SambaNova del catálogo del
 * Worker, pero el frontend siguió ofreciéndolas:
 *
 *   ai.js:17            — AI_PROVIDERS incluía nvidia (modelo ya caducado)
 *   index.html:467      — el selector de IA ofrecía «NVIDIA build.nvidia.com»
 *   js/admin.js:38      — el fallback de defaults pedía sambanova y nvidia
 *   js/diagnosticoRed.js:25 — sondeaba «NVIDIA NIM»
 *
 * El usuario veía una opción que parecía funcionar y moría en el Worker. Y
 * `tests/ollama.test.js` afirmaba que nvidia NO debía estar deshabilitada: el
 * test codificaba el defecto en lugar de detectarlo.
 *
 * CONTRATO QUE SE EXIGE A PARTIR DE AQUÍ
 * --------------------------------------
 * a) El catálogo del Worker y su DEFAULT_ORDER declaran el mismo conjunto, en el
 *    mismo orden.
 * b) Ningún fichero de producto menciona nvidia ni sambanova.
 * c) El selector de la UI ofrece exactamente los AI_PROVIDERS declarados, solo
 *    `ollama` está deshabilitado, y el orden coincide.
 * d) Todo proveedor del Worker está en el frontend o en SERVER_ONLY (proveedor
 *    que solo tiene sentido con clave del servidor: google).
 * e) Todo proveedor del frontend que no está en el Worker es un proveedor de
 *    clave propia o local declarado en CLIENTE_DIRECTO (openai, ollama).
 * f) El fallback de defaults del panel admin es exactamente el DEFAULT_ORDER del
 *    Worker: no puede inventarse proveedores que el servidor no conoce.
 * g) El diagnóstico de red solo sondea hosts declarados (httpbin, el Worker, o
 *    la base de un proveedor de AI_PROVIDERS).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => readFileSync(resolve(RAIZ, rel), "utf8");

/* Proveedores que el Worker puede usar y el cliente no ofrece: solo tienen
   sentido con la clave del servidor (google exige además su propio formato de
   respuesta). El frontend no los lista a propósito. */
const SERVER_ONLY = ["google"];

/* Proveedores del cliente que NO pasan por el Worker: clave propia del usuario
   (openai) y modelo local (ollama, deshabilitado en la UI). */
const CLIENTE_DIRECTO = ["openai", "ollama"];

const pmSrc = leer("worker/provider-manager.js");
const aiSrc = leer("ai.js");
const indexHtml = leer("index.html");
const adminSrc = leer("js/admin.js");
const diagSrc = leer("js/diagnosticoRed.js");

function idsDeCatalogo() {
  const bloque = pmSrc.match(/export const CATALOG\s*=\s*\[([\s\S]*?)\n\];/);
  if (!bloque) throw new Error("no se pudo leer CATALOG del Worker");
  return [...bloque[1].matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
}

function ordenPorDefecto() {
  const m = pmSrc.match(/export const DEFAULT_ORDER\s*=\s*\[([^\]]+)\]/);
  if (!m) throw new Error("no se pudo leer DEFAULT_ORDER del Worker");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

function idsDeAiprofiles() {
  const m = aiSrc.match(/var AI_PROVIDERS=\[([\s\S]*?)\];/);
  if (!m) throw new Error("no se pudo leer AI_PROVIDERS de ai.js");
  return [...m[1].matchAll(/id:"([^"]+)"/g)].map((x) => x[1]);
}

/* Solo las opciones del selector de proveedor del panel de IA: index.html tiene
   otros <select> (admin) cuyas <option> no son proveedores. */
function opcionesDelSelector() {
  const partes = indexHtml.split('<select id="cfg-provider"');
  if (partes.length !== 2) throw new Error("no se pudo leer el selector #cfg-provider de index.html");
  const bloque = partes[1].split("</select>")[0];
  return [...bloque.matchAll(/<option value="([^"]+)"([^>]*)>/g)].map((m) => ({
    id: m[1],
    attrs: m[2],
    deshabilitada: /disabled/i.test(m[2])
  }));
}

describe("catálogo del Worker", () => {
  const catalogo = idsDeCatalogo();

  it("declara los 4 proveedores del contrato actual", () => {
    expect(catalogo).toEqual(["groq", "google", "openrouter", "mistral"]);
  });

  it("DEFAULT_ORDER coincide con el catálogo, mismo conjunto y mismo orden", () => {
    expect(ordenPorDefecto()).toEqual(catalogo);
  });
});

describe("proveedores fantasma", () => {
  it("ningún fichero de producto menciona nvidia ni sambanova", () => {
    const ficheros = {
      "ai.js": aiSrc,
      "index.html": indexHtml,
      "js/admin.js": adminSrc,
      "js/diagnosticoRed.js": diagSrc,
      "worker/provider-manager.js": pmSrc
    };
    for (const [nombre, src] of Object.entries(ficheros)) {
      expect(src.toLowerCase(), nombre).not.toContain("nvidia");
      expect(src.toLowerCase(), nombre).not.toContain("sambanova");
    }
  });
});

describe("selector de IA frente a AI_PROVIDERS", () => {
  const providers = idsDeAiprofiles();
  const opciones = opcionesDelSelector();

  it("AI_PROVIDERS declara el conjunto esperado, en orden", () => {
    expect(providers).toEqual(["openai", "groq", "openrouter", "mistral", "ollama"]);
  });

  it("el selector ofrece exactamente los mismos proveedores, en el mismo orden", () => {
    expect(opciones.map((o) => o.id)).toEqual(providers);
  });

  it("solo ollama está deshabilitado, y lo está a propósito", () => {
    for (const o of opciones) {
      if (o.id === "ollama") {
        expect(o.deshabilitada, "ollama debe seguir deshabilitada").toBe(true);
      } else {
        expect(o.deshabilitada, o.id + " no debe estar deshabilitada").toBe(false);
      }
    }
  });
});

describe("los dos lados dicen lo mismo", () => {
  const catalogo = idsDeCatalogo();
  const providers = idsDeAiprofiles();

  it("todo proveedor del Worker está en el frontend o declarado SERVER_ONLY", () => {
    const desconocidos = catalogo.filter((id) => !providers.includes(id) && !SERVER_ONLY.includes(id));
    expect(desconocidos).toEqual([]);
  });

  it("todo proveedor del frontend que no está en el Worker es de cliente directo", () => {
    const sospechosos = providers.filter((id) => !catalogo.includes(id) && !CLIENTE_DIRECTO.includes(id));
    expect(sospechosos).toEqual([]);
  });

  it("el fallback de defaults del admin es exactamente el DEFAULT_ORDER del Worker", () => {
    const m = adminSrc.match(/_adminState\.defaults=data\.defaults\|\|\[([^\]]+)\]/);
    expect(m, "no se pudo leer el fallback de defaults en js/admin.js").not.toBeNull();
    const fallback = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    expect(fallback).toEqual(ordenPorDefecto());
  });
});

describe("diagnóstico de red", () => {
  it("solo sondea httpbin, el Worker, o la base de un proveedor declarado", () => {
    const bases = [...aiSrc.matchAll(/base:"([^"]+)"/g)].map((m) => new URL(m[1]).hostname);
    const worker = (aiSrc.match(/AI_WORKER_DEFAULT="([^"]+)"/) || [])[1];
    const permitidos = new Set(["httpbin.org", ...bases, new URL(worker).hostname]);
    const urls = [...diagSrc.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith("http"));
    expect(urls.length).toBeGreaterThan(0);
    const fuera = urls.filter((u) => !permitidos.has(new URL(u).hostname));
    expect(fuera).toEqual([]);
  });
});
