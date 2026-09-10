/**
 * BATS Tarot — Pure utility functions (no DOM dependency)
 * Extracted for testability. app.js delegates to these.
 */

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

function esComodin(c) { return c && c.tipo === "comodin"; }

function barajar(a) {
  var arr = a.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

var PITO = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8 };

function normalizarNombre(s) {
  return s.toUpperCase()
    .replace(/[ÁÉÍÓÚÜ]/g, function(m) { return { "Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U","Ü":"U" }[m]; })
    .replace(/[^A-Z\s]/g, "");
}

function sumaDigitos(n) {
  var s = 0;
  for (var i = 0; i < n.length; i++) s += parseInt(n[i]) || 0;
  return s;
}

function sumaNombre(s) {
  var norm = normalizarNombre(s);
  var total = 0;
  for (var i = 0; i < norm.length; i++) {
    var ch = norm[i];
    if (PITO[ch]) total += PITO[ch];
  }
  return total;
}

function calcArcanoNum(fechaNac, fechaDia, nombre) {
  var partes = fechaNac.split("/");
  if (partes.length < 3) return 1;
  var dia = parseInt(partes[0]) || 1;
  var mes = parseInt(partes[1]) || 1;
  var anio = parseInt(partes[2]) || 2000;
  var sumaFn = dia + mes + anio;
  var sumaNd = sumaDigitos("" + sumaFn);
  while (sumaNd > 22) sumaNd = sumaDigitos("" + sumaNd);
  var sumaNm = sumaNombre(nombre);
  while (sumaNm > 22) sumaNm = sumaDigitos("" + sumaNm);
  var total = sumaNd + sumaNm;
  while (total > 78) total = sumaDigitos("" + total);
  if (total === 0) total = 1;
  return total;
}

function calcQuinta(cartas) {
  if (!cartas || !cartas.length) return null;
  var suma = 0;
  for (var i = 0; i < cartas.length; i++) {
    var c = cartas[i].carta || cartas[i];
    suma += (c.valor || 0);
  }
  var s = sumaDigitos("" + suma);
  while (s > 22) s = sumaDigitos("" + s);
  if (s === 0) s = 1;
  return s;
}

export {
  z, ini, escHTML, slugify, esComodin, barajar,
  PITO, normalizarNombre, sumaDigitos, sumaNombre,
  calcArcanoNum, calcQuinta
};
