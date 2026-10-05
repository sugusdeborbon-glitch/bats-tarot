/**
 * BATS Tarot — Ollama suspended state tests
 * Verifies Ollama is hidden from UI and not in active provider lists.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

/* Rutas relativas a este fichero, no absolutas a una máquina concreta. */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => readFileSync(resolve(RAIZ, rel), "utf8");

const indexHtml = leer("index.html");

describe("Ollama — UI visibility", () => {
  it("ollama option is disabled and hidden in index.html", () => {
    const match = indexHtml.match(/<option[^>]*value="ollama"[^>]*>/i);
    expect(match).not.toBeNull();
    expect(match[0]).toContain("disabled");
    expect(match[0]).toContain("hidden");
  });

  it("ollama option text indicates disabled state", () => {
    const match = indexHtml.match(/<option[^>]*value="ollama"[^>]*>[^<]*/i);
    expect(match).not.toBeNull();
    expect(match[0].toLowerCase()).toContain("desactivado");
  });

  it("other providers are NOT disabled", () => {
    const providers = ["openai", "nvidia", "groq", "openrouter", "mistral"];
    for (const p of providers) {
      const re = new RegExp('<option[^>]*value="' + p + '"[^>]*>', "i");
      const match = indexHtml.match(re);
      expect(match).not.toBeNull();
      expect(match[0]).not.toContain("disabled");
      expect(match[0]).not.toContain("hidden");
    }
  });
});

describe("Ollama — Worker provider list", () => {
  // FASE 2C-1: el catálogo pasó de `const PROVIDERS` en worker.js a
  // `CATALOG` en worker/provider-manager.js. Se asserta sobre el archivo que
  // ahora los contiene; el contrato (ollama ausente) no cambia.
  const pmSrc = leer("worker/provider-manager.js");

  it("DEFAULT_ORDER does not include ollama", async () => {
    const orderMatch = pmSrc.match(/DEFAULT_ORDER\s*=\s*\[([^\]]+)\]/);
    expect(orderMatch).not.toBeNull();
    expect(orderMatch[1]).not.toContain("ollama");
  });

  it("PROVIDERS array does not include ollama", async () => {
    const providersMatch = pmSrc.match(/export const CATALOG\s*=\s*\[([\s\S]*?)\];/);
    expect(providersMatch).not.toBeNull();
    expect(providersMatch[1]).not.toContain("ollama");
  });
});

describe("Ollama — AI_PROVIDERS client list", () => {
  it("AI_PROVIDERS contains ollama entry for future use", async () => {
    const aiSrc = leer("ai.js");
    expect(aiSrc).toContain('"ollama"');
    expect(aiSrc).toContain("Ollama");
  });
});

describe("Ollama — no active calls in normal flow", () => {
  it("no fetch() call to localhost:11434 in ai.js", async () => {
    const aiSrc = leer("ai.js");
    // Check there's no fetch/POST to localhost:11434 (only the AI_PROVIDERS definition is allowed)
    const lines = aiSrc.split("\n");
    const fetchLines = lines.filter(l => /fetch\s*\(/.test(l) && l.includes("localhost:11434"));
    expect(fetchLines).toHaveLength(0);
  });

  it("no fetch to localhost:11434 in ai-pipeline.js", async () => {
    const pipelineSrc = leer("js/ai-pipeline.js");
    expect(pipelineSrc).not.toContain("localhost:11434");
  });

  it("no fetch to localhost:11434 in app.js", async () => {
    const appSrc = leer("app.js");
    expect(appSrc).not.toContain("localhost:11434");
  });
});
