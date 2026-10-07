/**
 * N-13 — Diagnóstico del cuerpo upstream (incidente de disponibilidad LLM).
 *
 * En el incidente, OpenRouter devolvió 200 con un cuerpo no-JSON y la cadena
 * cayó a "(404) Todos los proveedores fallaron" sin ninguna evidencia: el
 * catch antiguo destruía el cuerpo y el Content-Type, y fundía un corte por
 * presupuesto (AbortError) con un fallo de parseo.
 *
 * Estos tests importan el adaptador REAL de worker/worker.js (no una
 * réplica local) para que la regresión vuelva a romper aquí.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { llamarProveedor } from "../worker/worker.js";

function proveedor() {
  return { name: "OpenRouter", key: "k", model: "m", url: "https://openrouter.test" };
}
const payload = { temperature: 0.7, max_tokens: 100 };

function conCabecera(ct) {
  return {
    get: function (h) {
      return String(h).toLowerCase() === "content-type" ? ct : null;
    }
  };
}

describe("N-13 — llamarProveedor conserva la evidencia del upstream", () => {
  let origFetch;
  beforeEach(() => { origFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = origFetch; });

  it("respuesta no JSON conserva el Content-Type y hasta 300 B del cuerpo", async () => {
    const cuerpo = "<html>" + "A".repeat(500) + "</html>";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: conCabecera("text/html; charset=utf-8"),
      text: async () => cuerpo
    });
    const r = await llamarProveedor(proveedor(), [], payload);
    expect(r.ok).toBe(false);
    expect(r.category).toBe("parse_error");
    expect(r.err).toContain("text/html; charset=utf-8");
    expect(r.err).toContain("<html>");
    /* La muestra va truncada a 300 caracteres: el cuerpo completo nunca se
       cuela en el mensaje de error. */
    expect((r.err.match(/A/g) || []).length).toBeLessThanOrEqual(300);
  });

  it("cuerpo interrumpido por el presupuesto es timeout_budget, no parse_error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: conCabecera(null),
      text: async () => {
        const e = new Error("The operation was aborted");
        e.name = "AbortError";
        throw e;
      }
    });
    const r = await llamarProveedor(proveedor(), [], payload);
    expect(r.ok).toBe(false);
    expect(r.category).toBe("timeout_budget");
    expect(r.status).toBe(504);
    expect(r.err).toContain("presupuesto");
    expect(r.category).not.toBe("parse_error");
  });

  it("JSON válido sigue parseándose igual que antes (regresión)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: conCabecera("application/json"),
      text: async () => JSON.stringify({ choices: [{ message: { content: "x".repeat(120) } }] })
    });
    const r = await llamarProveedor(proveedor(), [], payload);
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(r.content).toHaveLength(120);
  });

  it("error de red al leer el cuerpo no se disfraza de timeout ni de parseo mudo", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: conCabecera(null),
      text: async () => { throw new TypeError("network stream closed"); }
    });
    const r = await llamarProveedor(proveedor(), [], payload);
    expect(r.ok).toBe(false);
    expect(r.category).toBe("parse_error");
    expect(r.err).toContain("network stream closed");
  });

  it("respuesta no JSON con status de error conserva además el status upstream", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: conCabecera("text/html"),
      text: async () => "<body>Bad Gateway from upstream</body>"
    });
    const r = await llamarProveedor(proveedor(), [], payload);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(502);
    expect(r.category).toBe("parse_error");
    expect(r.err).toContain("(502)");
    expect(r.err).toContain("Bad Gateway from upstream");
  });
});
