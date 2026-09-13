/* ============ Network Diagnostic Module ============ */
/* Temporary module for diagnosing connectivity issues.
   Access via console: BATS.diagnostico.red(callback)
   callback receives array of test results. */

(function () {
  "use strict";

  var TESTS = [
    {
      name: "Conectividad general",
      url: "https://httpbin.org/get",
      method: "GET",
      headers: {}
    },
    {
      name: "Worker BATS",
      url: (window.BATS && BATS.http) ? (function () {
        try { return (typeof getWorkerURL === "function" ? getWorkerURL() : "https://bats-tarot-ai.bats-tarot.workers.dev") + "/api/ai-flags"; } catch (e) { return "https://bats-tarot-ai.bats-tarot.workers.dev/api/ai-flags"; }
      })() : "",
      method: "GET",
      headers: {}
    },
    {
      name: "NVIDIA NIM",
      url: "https://integrate.api.nvidia.com/v1/models",
      method: "GET",
      headers: {}
    },
    {
      name: "Mistral AI",
      url: "https://api.mistral.ai/v1/models",
      method: "GET",
      headers: {}
    }
  ];

  function runDiagnostic(callback) {
    var http = (window.BATS && BATS.http) ? BATS.http : null;
    var results = [];
    var pending = TESTS.length;

    TESTS.forEach(function (test, idx) {
      if (!test.url) {
        results[idx] = { name: test.name, status: "skip", time: 0, error: "URL no configurada" };
        pending--;
        if (pending === 0) callback(results);
        return;
      }

      var start = Date.now();
      var p;

      if (http) {
        p = http.get(test.url, { headers: test.headers, timeoutMs: 10000 });
      } else {
        p = fetch(test.url, { method: test.method, headers: test.headers, mode: "no-cors" })
          .then(function (r) {
            return { status: r.status, ok: r.ok, data: "ok" };
          });
      }

      p.then(function (resp) {
        results[idx] = {
          name: test.name,
          status: resp.ok ? "ok" : "error",
          httpStatus: resp.status,
          time: Date.now() - start,
          error: null
        };
        pending--;
        if (pending === 0) callback(results);
      }).catch(function (e) {
        results[idx] = {
          name: test.name,
          status: "error",
          httpStatus: 0,
          time: Date.now() - start,
          error: e && e.message || "desconocido"
        };
        pending--;
        if (pending === 0) callback(results);
      });
    });
  }

  function logResults(results) {
    console.group("[BATS-DIAG] Diagnóstico de red — " + new Date().toLocaleTimeString());
    console.log("Plataforma: " + ((window.BATS && BATS.http && BATS.http.isNative()) ? "Capacitor NATIVO" : "Navegador web"));
    results.forEach(function (r) {
      var icon = r.status === "ok" ? "✓" : r.status === "skip" ? "○" : "✗";
      console.log(icon + " " + r.name + ": " + r.status + (r.httpStatus ? " (HTTP " + r.httpStatus + ")" : "") + " — " + r.time + "ms" + (r.error ? " — " + r.error : ""));
    });
    console.groupEnd();
  }

  function run(callback) {
    runDiagnostic(function (results) {
      logResults(results);
      if (callback) callback(results);
    });
  }

  window.BATS = window.BATS || {};
  window.BATS.diagnostico = { red: run };
})();
