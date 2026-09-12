/**
 * BATS Tarot — Centralized Application State
 * Phase 0: Initializes global state on window for backward compatibility.
 * Future phases will migrate functions to read/write through this module.
 */
(function () {
  "use strict";

  var state = {
    version: "1.10.0",

    // Draw state (set on each tirada)
    ult: null,              // current draw's card array
    mazoRestante: null,     // remaining cards after draw (for comodin extension)
    lastPanel: null,        // current active panel ID
    lastPanelTitle: null,   // current panel display title
    lastPanelDest: null,    // DOM element ID for rendering results
    lastRenderOpts: null,   // options used in last render call
    lastCtx: null,          // context object for current draw
    ocultarReferencias: false, // hide card references during AI loading
    iaStatus: null,         // callback for IA status updates
    testComodin: false      // debug flag for wildcard testing
  };

  // Expose on BATS namespace
  window.BATS = window.BATS || {};
  window.BATS.state = state;

  // Backward-compatible window._* aliases (read/write through state)
  Object.defineProperty(window, "_ult", {
    get: function () { return state.ult; },
    set: function (v) { state.ult = v; },
    configurable: true
  });
  Object.defineProperty(window, "_mazoRestante", {
    get: function () { return state.mazoRestante; },
    set: function (v) { state.mazoRestante = v; },
    configurable: true
  });
  Object.defineProperty(window, "_lastPanel", {
    get: function () { return state.lastPanel; },
    set: function (v) { state.lastPanel = v; },
    configurable: true
  });
  Object.defineProperty(window, "_lastPanelTitle", {
    get: function () { return state.lastPanelTitle; },
    set: function (v) { state.lastPanelTitle = v; },
    configurable: true
  });
  Object.defineProperty(window, "_lastPanelDest", {
    get: function () { return state.lastPanelDest; },
    set: function (v) { state.lastPanelDest = v; },
    configurable: true
  });
  Object.defineProperty(window, "_lastRenderOpts", {
    get: function () { return state.lastRenderOpts; },
    set: function (v) { state.lastRenderOpts = v; },
    configurable: true
  });
  Object.defineProperty(window, "_lastCtx", {
    get: function () { return state.lastCtx; },
    set: function (v) { state.lastCtx = v; },
    configurable: true
  });
  Object.defineProperty(window, "_ocultarReferencias", {
    get: function () { return state.ocultarReferencias; },
    set: function (v) { state.ocultarReferencias = v; },
    configurable: true
  });
  Object.defineProperty(window, "_iaStatus", {
    get: function () { return state.iaStatus; },
    set: function (v) { state.iaStatus = v; },
    configurable: true
  });
  Object.defineProperty(window, "_BATS_TEST_COMODIN", {
    get: function () { return state.testComodin; },
    set: function (v) { state.testComodin = v; },
    configurable: true
  });

  Object.defineProperty(window, "BATS_VERSION", {
    get: function () { return state.version; },
    configurable: true
  });
})();
