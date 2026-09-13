/* ============ Unified HTTP Client ============ */
/* Detects Capacitor native environment and uses OkHttp bridge,
   falls back to window.fetch for web/PWA.
   Returns normalized: {status, headers, data, ok, url} */

(function () {
  "use strict";

  var _isNative = !!(window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Http);
  var _httpPlugin = _isNative ? Capacitor.Plugins.Http : null;

  function isNative() { return _isNative; }

  /**
   * httpPost(url, body, opts) → Promise<{status, headers, data, ok}>
   * opts: {headers, timeoutMs, responseType}
   * responseType: "json" (default) or "text"
   */
  function httpPost(url, body, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    var timeoutMs = opts.timeoutMs || 60000;
    var responseType = opts.responseType || "json";

    if (_isNative) {
      return _nativePost(url, body, headers, timeoutMs, responseType);
    }
    return _fetchPost(url, body, headers, timeoutMs, responseType);
  }

  function _nativePost(url, body, headers, timeoutMs, responseType) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);

    return _httpPlugin.request({
      url: url,
      method: "POST",
      headers: headers,
      data: body,
      responseType: responseType === "json" ? "json" : "text"
    }).then(function (resp) {
      clearTimeout(timer);
      var data = resp.data;
      if (typeof data === "string" && responseType === "json") {
        try { data = JSON.parse(data); } catch (e) { /* keep as string */ }
      }
      return {
        status: resp.status,
        headers: resp.headers || {},
        data: data,
        ok: resp.status >= 200 && resp.status < 300,
        url: url
      };
    }).catch(function (e) {
      clearTimeout(timer);
      if (e && e.name === "AbortError") {
        throw new Error("La petición excedió el tiempo de espera (" + (timeoutMs / 1000) + "s).");
      }
      throw new Error("Error de red nativa: " + (e && e.message || "desconocido"));
    });
  }

  function _fetchPost(url, body, headers, timeoutMs, responseType) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);

    var fetchHeaders = { "Content-Type": "application/json" };
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
      fetchHeaders[keys[i]] = headers[keys[i]];
    }

    var fetchOpts = {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(body),
      signal: ctrl.signal
    };

    return fetch(url, fetchOpts).then(function (r) {
      clearTimeout(timer);
      var parseFn = responseType === "json" ? r.json.bind(r) : r.text.bind(r);
      return parseFn().then(function (data) {
        var hdrs = {};
        r.headers.forEach(function (v, k) { hdrs[k] = v; });
        return {
          status: r.status,
          headers: hdrs,
          data: data,
          ok: r.ok,
          url: url
        };
      });
    }).catch(function (e) {
      clearTimeout(timer);
      if (e && e.name === "AbortError") {
        throw new Error("La petición excedió el tiempo de espera (" + (timeoutMs / 1000) + "s).");
      }
      if (e && e.name === "TypeError" && /fetch/i.test(e.message || "")) {
        throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet y la URL del Worker en Configuración.");
      }
      throw e;
    });
  }

  /**
   * httpGet(url, opts) → Promise<{status, headers, data, ok}>
   */
  function httpGet(url, opts) {
    opts = opts || {};
    var headers = opts.headers || {};
    var timeoutMs = opts.timeoutMs || 15000;

    if (_isNative) {
      return _httpPlugin.request({
        url: url,
        method: "GET",
        headers: headers,
        responseType: "text"
      }).then(function (resp) {
        return {
          status: resp.status,
          headers: resp.headers || {},
          data: resp.data,
          ok: resp.status >= 200 && resp.status < 300,
          url: url
        };
      }).catch(function (e) {
        throw new Error("Error de red nativa: " + (e && e.message || "desconocido"));
      });
    }

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);

    return fetch(url, {
      method: "GET",
      headers: headers,
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(timer);
      return r.text().then(function (data) {
        var hdrs = {};
        r.headers.forEach(function (v, k) { hdrs[k] = v; });
        return { status: r.status, headers: hdrs, data: data, ok: r.ok, url: url };
      });
    }).catch(function (e) {
      clearTimeout(timer);
      if (e && e.name === "AbortError") {
        throw new Error("La petición excedió el tiempo de espera.");
      }
      throw new Error("No se pudo conectar: " + (e && e.message || "error de red"));
    });
  }

  /* Expose on BATS namespace */
  window.BATS = window.BATS || {};
  window.BATS.http = {
    post: httpPost,
    get: httpGet,
    isNative: isNative
  };
})();
