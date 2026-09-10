/**
 * BATS Tarot — Deck data & operations
 * Phase 1: Extracted from app.js. Exposes on window.BATS.deck.
 * Global vars (PALOS, BARAJA, etc.) kept for backward compatibility.
 */
(function () {
  "use strict";

  // ── Card data constants ─────────────────────────────
  var PALOS = [["bastos","Wands"],["copas","Cups"],["espadas","Swords"],["oros","Pentacles"]];
  var NOMPALO = {bastos:"Bastos",copas:"Copas",espadas:"Espadas",oros:"Oros"};
  var BARAJA = [];
  var MAYORES = [
    [0,"El Loco","TheFool"],[1,"El Mago","TheMagician"],[2,"La Sacerdotisa","TheHighPriestess"],
    [3,"La Emperatriz","TheEmpress"],[4,"El Emperador","TheEmperor"],[5,"El Hierofante","TheHierophant"],
    [6,"Los Enamorados","TheLovers"],[7,"El Carro","TheChariot"],[8,"La Fuerza","Strength"],
    [9,"El Ermitaño","TheHermit"],[10,"La Rueda de la Fortuna","WheelOfFortune"],[11,"La Justicia","Justice"],
    [12,"El Colgado","TheHangedMan"],[13,"La Muerte","Death"],[14,"La Templanza","Temperance"],
    [15,"El Diablo","TheDevil"],[16,"La Torre","TheTower"],[17,"La Estrella","TheStar"],
    [18,"La Luna","TheMoon"],[19,"El Sol","TheSun"],[20,"El Juicio","Judgement"],[21,"El Mundo","TheWorld"]
  ];

  // ── Utility functions ───────────────────────────────
  function z(n) { return n < 10 ? "0" + n : "" + n; }

  function ini(s) {
    return s.replace(/^(La|Los|El|Las|As|Sota|Caballo|Reina|Rey)\s+(de\s+)?/i, "").substring(0, 2).toUpperCase();
  }

  function escHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(s) {
    return s.toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ\s-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/-+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "tirada";
  }

  // ── Build deck ──────────────────────────────────────
  var NUMES = ["","As","Dos","Tres","Cuatro","Cinco","Seis","Siete","Ocho","Nueve","Diez"];
  var FIGURAS = ["Sota","Caballo","Reina","Rey"];

  MAYORES.forEach(function (a) {
    BARAJA.push({
      nombre: a[1], valor: a[0], tipo: "arcano",
      img: "cartas/" + z(a[0]) + "-" + a[2] + ".jpg",
      nucleo: "Arcano Mayor", letras: ini(a[1])
    });
  });
  PALOS.forEach(function (p) {
    var pa = p[0], pi = p[1], np = NOMPALO[pa];
    for (var v = 1; v <= 14; v++) {
      var nom = (v <= 10 ? NUMES[v] : FIGURAS[v - 11]) + " de " + np;
      BARAJA.push({
        nombre: nom, valor: v, tipo: pa,
        img: "cartas/" + pi + z(v) + ".jpg",
        nucleo: np, letras: ini(nom)
      });
    }
  });

  // ── Comodin (wildcard) ──────────────────────────────
  var COMODIN = {nombre:"Comodín",valor:0,tipo:"comodin",img:"comodin_reverso.png",letras:"∞",nucleo:"Comodín"};
  var COMODIN_INV_TEXT = "El conocimiento no es apropiado en este momento; se recomienda avanzar con confianza.";
  var COMODIN_TEXTO_REVERSO = "Toca la carta para revelar el umbral.";
  var COMODIN_TEXTO_CERRADO = "Toca la carta para abrir la extensión BATS.";
  var COMODIN_TEXTO_ABIERTO = "Toca una carta extendida para ver su interpretación completa.";
  var COMODIN_POS = ["¿De qué te quiere avisar?","¿En qué te quiere ayudar?","La Salida"];

  function esComodin(c) { return c && c.tipo === "comodin"; }

  function añadirComodin(mazo, activo) {
    if (!activo && !window._BATS_TEST_COMODIN) return mazo;
    mazo.push(Object.assign({}, COMODIN));
    return mazo;
  }

  function comodinImg(estado, invertida) {
    if (estado === "cerrado") return "comodin_anverso_umbral_cerrado.png";
    if (estado === "abierto") return "comodin_anverso_umbral_abierto.png";
    return "comodin_reverso.png";
  }

  function comodinEnCartas(cartas) {
    if (!cartas) return null;
    for (var i = 0; i < cartas.length; i++) {
      if (esComodin(cartas[i].carta)) return cartas[i];
    }
    return null;
  }

  // ── TABLA_78 ────────────────────────────────────────
  var TABLA_78 = [];
  (function () {
    for (var i = 1; i <= 21; i++) TABLA_78.push(BARAJA[i]);
    TABLA_78.push(BARAJA[0]);
    for (var i = 22; i <= 77; i++) TABLA_78.push(BARAJA[i]);
  })();

  // ── Deck operations ─────────────────────────────────
  function barajar(a) {
    var arr = a.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function crearSub(m) {
    if (!m || m === "completo") return BARAJA.slice();
    if (m === "mayores") return BARAJA.filter(function (c) { return c.tipo === "arcano"; });
    if (m === "menores") return BARAJA.filter(function (c) { return c.tipo !== "arcano" && c.valor >= 1 && c.valor <= 10; });
    if (m === "corte") return BARAJA.filter(function (c) { return c.tipo !== "arcano" && c.valor >= 11 && c.valor <= 14; });
    return BARAJA.slice();
  }

  function repartir(n, inv, mazo) {
    var d = barajar(mazo.slice()), r = [];
    for (var i = 0; i < n && i < d.length; i++) {
      r.push({ carta: d[i], invertida: inv ? Math.random() < .5 : false });
    }
    return r;
  }

  function batsDe(c) {
    if (typeof DATOS_BATS !== "undefined" && DATOS_BATS[c.nombre]) return DATOS_BATS[c.nombre];
    return null;
  }

  function txt(c, inv, sombra) {
    var d = batsDe(c);
    if (!d) return "\u2014";
    if (sombra && d.sombra) return d.sombra;
    if (inv && d.invertida) return d.invertida;
    if (d.normal) return d.normal;
    if (d.prof) return d.prof;
    return c.nucleo || "\u2014";
  }

  function extraerExtensionDelMazo(n, mazo) {
    var r = [];
    for (var i = 0; i < n && i < mazo.length; i++) r.push(mazo[i]);
    return r;
  }

  // ── Expose on window.BATS.deck ──────────────────────
  window.BATS = window.BATS || {};
  window.BATS.deck = {
    PALOS: PALOS, NOMPALO: NOMPALO, BARAJA: BARAJA, MAYORES: MAYORES,
    NUMES: NUMES, FIGURAS: FIGURAS, TABLA_78: TABLA_78,
    COMODIN: COMODIN, COMODIN_INV_TEXT: COMODIN_INV_TEXT,
    COMODIN_TEXTO_REVERSO: COMODIN_TEXTO_REVERSO, COMODIN_TEXTO_CERRADO: COMODIN_TEXTO_CERRADO,
    COMODIN_TEXTO_ABIERTO: COMODIN_TEXTO_ABIERTO, COMODIN_POS: COMODIN_POS,
    z: z, ini: ini, escHTML: escHTML, slugify: slugify,
    esComodin: esComodin, añadirComodin: añadirComodin, comodinImg: comodinImg,
    comodinEnCartas: comodinEnCartas, barajar: barajar, crearSub: crearSub,
    repartir: repartir, batsDe: batsDe, txt: txt, extraerExtensionDelMazo: extraerExtensionDelMazo
  };

  // ── Backward-compatible global vars ─────────────────
  window.PALOS = PALOS;
  window.NOMPALO = NOMPALO;
  window.BARAJA = BARAJA;
  window.MAYORES = MAYORES;
  window.NUMES = NUMES;
  window.FIGURAS = FIGURAS;
  window.TABLA_78 = TABLA_78;
  window.COMODIN = COMODIN;
  window.COMODIN_INV_TEXT = COMODIN_INV_TEXT;
  window.COMODIN_TEXTO_REVERSO = COMODIN_TEXTO_REVERSO;
  window.COMODIN_TEXTO_CERRADO = COMODIN_TEXTO_CERRADO;
  window.COMODIN_TEXTO_ABIERTO = COMODIN_TEXTO_ABIERTO;
  window.COMODIN_POS = COMODIN_POS;
  window.z = z;
  window.ini = ini;
  window.escHTML = escHTML;
  window.slugify = slugify;
  window.esComodin = esComodin;
  window.añadirComodin = añadirComodin;
  window.comodinImg = comodinImg;
  window.comodinEnCartas = comodinEnCartas;
  window.barajar = barajar;
  window.crearSub = crearSub;
  window.repartir = repartir;
  window.batsDe = batsDe;
  window.txt = txt;
  window.extraerExtensionDelMazo = extraerExtensionDelMazo;
})();
