/**
 * BATS Tarot — Numerology & quintessence calculation
 * Phase 1: Extracted from app.js. Exposes on window.BATS.numerology.
 */
(function () {
  "use strict";

  // ── Numerology table ────────────────────────────────
  var PITO = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};

  function normalizarNombre(s) {
    return s.toUpperCase()
      .replace(/[ÁÉÍÓÚÜ]/g, function (m) {
        return {"Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U","Ü":"U"}[m];
      })
      .replace(/[^A-Z\s]/g, "");
  }

  function sumaDigitos(n) {
    var s = 0;
    for (var i = 0; i < n.length; i++) s += parseInt(n[i]) || 0;
    return s;
  }

  function sumaNombre(s) {
    var n = normalizarNombre(s), sum = 0;
    for (var i = 0; i < n.length; i++) if (PITO[n[i]]) sum += PITO[n[i]];
    return sum;
  }

  // ── Arcano calculation ──────────────────────────────
  function calcArcanoNum(fechaNac, fechaDia, nombre) {
    var dn = fechaNac.replace(/\//g, ""), dd = fechaDia.replace(/\//g, "");
    if (dn.length !== 8 || dd.length !== 8) return null;
    var sn = sumaDigitos(dn), sd = sumaDigitos(dd), snn = sumaNombre(nombre);
    var total = sn + sd + snn;
    if (total === 0) return null;
    if (total >= 1 && total <= 78) return total;
    while (total > 78) {
      var s = 0, t = total;
      while (t > 0) { s += t % 10; t = Math.floor(t / 10); }
      total = s;
    }
    return total > 0 && total <= 78 ? total : null;
  }

  // ── Quintessence ────────────────────────────────────
  function calcQuinta(cartas) {
    var suma = 0;
    cartas.forEach(function (it) {
      if (window.esComodin && window.esComodin(it.carta)) {
        if (it.extensionResuelta && it.extension && it.extension[2]) suma += it.extension[2].carta.valor;
      } else {
        suma += it.carta.valor;
      }
    });
    while (suma > 22) {
      var s = 0, t = suma;
      while (t > 0) { s += t % 10; t = Math.floor(t / 10); }
      suma = s;
    }
    if (suma < 1 || suma > 22) return null;
    if (suma === 22) return window.BARAJA ? window.BARAJA[0] : null;
    return window.BARAJA ? window.BARAJA[suma] : null;
  }

  function textoQuinta(nombre) {
    if (typeof QUINTA_BATS !== "undefined" && QUINTA_BATS[nombre]) return QUINTA_BATS[nombre];
    return null;
  }

  function parsearQuinta(texto) {
    if (!texto) return { lectura: "", consejo: "", palabraClave: "", antipatron: "" };
    var parts = texto.split(/\s{2,}/);
    var r = { lectura: "", consejo: "", palabraClave: "", antipatron: "" };
    parts.forEach(function (p) {
      var t = p.trim();
      if (/^CONSEJO:/i.test(t)) r.consejo = t.replace(/^CONSEJO:\s*/i, "");
      else if (/^PALABRA CLAVE:/i.test(t)) r.palabraClave = t.replace(/^PALABRA CLAVE:\s*/i, "");
      else if (/^ANTIPATR[ÓO]N:/i.test(t)) r.antipatron = t.replace(/^ANTIPATR[ÓO]N:\s*/i, "");
      else r.lectura += (r.lectura ? " " : "") + t;
    });
    return r;
  }

  // ── Expose on window.BATS.numerology ────────────────
  window.BATS = window.BATS || {};
  window.BATS.numerology = {
    PITO: PITO,
    normalizarNombre: normalizarNombre,
    sumaDigitos: sumaDigitos,
    sumaNombre: sumaNombre,
    calcArcanoNum: calcArcanoNum,
    calcQuinta: calcQuinta,
    textoQuinta: textoQuinta,
    parsearQuinta: parsearQuinta
  };

  // ── Backward-compatible globals ─────────────────────
  window.PITO = PITO;
  window.normalizarNombre = normalizarNombre;
  window.sumaDigitos = sumaDigitos;
  window.sumaNombre = sumaNombre;
  window.calcArcanoNum = calcArcanoNum;
  window.calcQuinta = calcQuinta;
  window.textoQuinta = textoQuinta;
  window.parsearQuinta = parsearQuinta;
})();
