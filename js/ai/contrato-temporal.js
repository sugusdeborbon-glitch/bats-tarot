/*
 * BATS Tarot — PRO — Contrato temporal end-to-end (FASE 2C-3 / H-04)
 *
 * Módulo PURO: sin DOM, sin fetch, sin estado global, sin red. Solo aritmética
 * de presupuestos sobre un reloj inyectable, para que el contrato sea
 * determinista y testeable (batería B-1…B-12).
 *
 * El Worker es la autoridad temporal. Este módulo define CÓMO se reparte el
 * tiempo, no quién lo pide:
 *
 *   CORTA: 50 s de presupuesto, P1 24 s, fallback 13 s, minSlice 8 s,
 *          upstream máximo 40 s. El frontend espera 60 s.
 *   LARGA: 75 s de presupuesto, P1 35 s, fallback 10 s, minSlice 10 s,
 *          upstream máximo 40 s. El frontend espera 90 s.
 *
 * REGLA CENTRAL: el presupuesto es UN RELOJ COMPARTIDO. Al cambiar de
 * proveedor NO se reinicia. Cada intento se acota a lo que queda:
 *
 *   timeoutEfectivo = min(presupuestoDelIntento, restante, upstreamMáximo)
 *
 * y si el restante cae por debajo de `minSlice` no se inicia otro intento,
 * porque no daría tiempo a una respuesta útil.
 */

/**
 * Presupuestos por tipo de interpretación, en milisegundos.
 *
 * `totalMs`     presupuesto global que posee el Worker (deadline).
 * `frontendMs`  espera del frontend: siempre MAYOR que `totalMs`, para que
 *               sea el Worker quien decide y no un abort del navegador.
 * `p1Ms`        presupuesto del primer proveedor.
 * `fallbackMs`  presupuesto de cada proveedor posterior.
 * `minSliceMs`  por debajo de este resto no se intenta otro proveedor.
 * `upstreamMaxMs` techo absoluto de una llamada saliente.
 */
export var CONTRATO = {
  corta: {
    totalMs: 50000,
    frontendMs: 60000,
    p1Ms: 24000,
    fallbackMs: 13000,
    minSliceMs: 8000,
    upstreamMaxMs: 40000
  },
  larga: {
    totalMs: 75000,
    frontendMs: 90000,
    p1Ms: 35000,
    fallbackMs: 10000,
    minSliceMs: 10000,
    upstreamMaxMs: 40000
  }
};

/** Modo propio: sin fallback de proveedores, un único intento acotado. */
export var CONTRATO_PROPIA = {
  upstreamMaxMs: 40000,
  minSliceMs: 1000
};

/**
 * Devuelve el contrato aplicable a un tipo de interpretación.
 *
 * @param {string} tipo  "larga" activa el presupuesto largo; cualquier otro
 *                       valor (incluido undefined) usa el corto.
 * @returns {object}     contrato congelado en milisegundos.
 */
export function contratoPara(tipo) {
  return CONTRATO[tipo === "larga" ? "larga" : "corta"];
}

/**
 * Presupuesto de un intento concreto según su posición en la cadena.
 *
 * El primer proveedor consume `p1Ms`; los posteriores, `fallbackMs`.
 *
 * @param {object} contrato  contrato devuelto por contratoPara().
 * @param {number} indice    0 para el primer proveedor.
 * @returns {number}         presupuesto en ms de ese intento.
 */
export function presupuestoDeIntento(contrato, indice) {
  return indice === 0 ? contrato.p1Ms : contrato.fallbackMs;
}

/**
 * Crea un reloj determinista. Sin argumentos usa `Date.now` real; inyectando
 * `ahora` la aritmética del deadline se vuelve reproducible en tests.
 *
 * @param {function} [ahora]  función que devuelve el instante actual en ms.
 * @returns {function}        reloj invocable, sin argumentos.
 */
export function crearReloj(ahora) {
  var base = typeof ahora === "function" ? ahora : Date.now;
  return function () { return base(); };
}

/**
 * Instante absoluto en el que expira el presupuesto global.
 *
 * @param {object} contrato  contrato aplicable.
 * @param {function} reloj   reloj inyectado.
 * @returns {number}         deadline en ms.
 */
export function deadline(contrato, reloj) {
  return reloj() + contrato.totalMs;
}

/**
 * Tiempo que queda hasta el deadline. Puede ser negativo si ya expiró.
 *
 * @param {number} hasta     deadline absoluto.
 * @param {function} reloj   reloj inyectado.
 * @returns {number}         restante en ms.
 */
export function restante(hasta, reloj) {
  return hasta - reloj();
}

/**
 * ¿Queda tiempo suficiente para abrir otro intento?
 *
 * La regla es estricta: por debajo de `minSliceMs` no se inicia, porque el
 * intento no podría devolver una respuesta interpretable antes del deadline.
 *
 * @param {number} restanteMs       restante en ms.
 * @param {object} contrato        contrato aplicable.
 * @returns {boolean}              true si se puede intentar.
 */
export function puedeIntentar(restanteMs, contrato) {
  return restanteMs >= contrato.minSliceMs;
}

/**
 * Timeout efectivo de un intento: el menor entre el presupuesto del intento,
 * lo que queda del presupuesto global y el techo de upstream.
 *
 * @param {number} restanteMs   restante del deadline en ms.
 * @param {object} contrato    contrato aplicable.
 * @param {number} indice      0 para el primer proveedor.
 * @returns {number|null}      timeout en ms, o null si no se debe intentar.
 */
export function timeoutEfectivo(restanteMs, contrato, indice) {
  if (!puedeIntentar(restanteMs, contrato)) return null;
  var presupuesto = presupuestoDeIntento(contrato, indice);
  return Math.min(presupuesto, restanteMs, contrato.upstreamMaxMs);
}

/**
 * Presupuesto restante después de haber consumido `consumido`.
 *
 * Se usa para encadenar el fallback: el siguiente proveedor ve lo que queda,
 * nunca un presupuesto nuevo desde cero.
 *
 * @param {number} restanteMs  restante actual en ms.
 * @param {number} consumido   ms ya consumidos.
 * @returns {number}           restante nuevo, acotado a 0.
 */
export function descontar(restanteMs, consumido) {
  var r = restanteMs - consumido;
  return r > 0 ? r : 0;
}

/**
 * Simula la cadena completa de intentos de fallback bajo un solo deadline.
 *
 * Reproduce el caso que el contrato corrige: P1 agota su parte, y cada
 * proveedor posterior recibe únicamente el tiempo que queda. El reloj nunca
 * se reinicia.
 *
 * @param {object} [opciones]
 * @param {string} [opciones.tipo]     "larga" o "corta" (por defecto "corta").
 * @param {function} [opciones.ahora]  reloj base inyectable.
 * @param {function} [opciones.consumir]  dado un timeout, devuelve los ms que
 *        el intento consume de verdad. Por defecto consume el timeout entero.
 * @param {number} [opciones.proveedores] cuántos proveedores hay (por defecto 4).
 * @returns {object} traza de la ejecución.
 */
export function simularCadena(opciones) {
  var o = opciones || {};
  var contrato = contratoPara(o.tipo || "corta");
  var base = typeof o.ahora === "function" ? o.ahora : function () { return 0; };
  var reloj = crearReloj(base);
  var consumir = typeof o.consumir === "function" ? o.consumir : function (t) { return t; };
  var total = typeof o.proveedores === "number" ? o.proveedores : 4;

  var t0 = reloj();
  var hasta = deadline(contrato, reloj);
  var pasos = [];
  var consumidoTotal = 0;

  for (var i = 0; i < total; i++) {
    var quedan = restante(hasta, reloj);
    var timeout = timeoutEfectivo(quedan, contrato, i);
    if (timeout === null) {
      pasos.push({
        indice: i,
        iniciado: false,
        motivo: "restante<minSlice",
        restanteMs: quedan
      });
      break;
    }
    var consumido = Math.max(0, Math.min(timeout, consumir(timeout)));
    consumidoTotal += consumido;
    pasos.push({
      indice: i,
      iniciado: true,
      presupuestoMs: presupuestoDeIntento(contrato, i),
      restanteAntesMs: quedan,
      timeoutMs: timeout,
      consumidoMs: consumido
    });
  }

  return {
    contrato: contrato,
    inicioMs: t0,
    deadlineMs: hasta,
    pasos: pasos,
    intentos: pasos.filter(function (p) { return p.iniciado; }).length,
    consumidoTotalMs: consumidoTotal,
    restanteFinalMs: restante(hasta, reloj)
  };
}

/**
 * Timeout para el modo de IA propia.
 *
 * No hay cadena de proveedores: un solo intento, acotado al techo de upstream
 * y al restante del contrato que corresponda. Nunca devuelve presupuesto de
 * fallback.
 *
 * @param {object} contrato  contrato aplicable por tipo.
 * @param {number} restanteMs restante del deadline global.
 * @returns {number}         timeout en ms para la llamada propia.
 */
export function timeoutPropia(contrato, restanteMs) {
  var techo = CONTRATO_PROPIA.upstreamMaxMs;
  if (restanteMs <= 0) return 0;
  return Math.min(techo, restanteMs, contrato.totalMs);
}

/**
 * ¿Sigue siendo válida la espera del frontend frente al Worker?
 *
 * El frontend debe esperar MÁS que el presupuesto del Worker para que sea el
 * Worker quien cierre la operación. Si se invierte, el navegador aborta antes.
 *
 * @param {object} contrato  contrato aplicable.
 * @returns {boolean}        true si frontendMs > totalMs.
 */
export function esperaFrontendValida(contrato) {
  return contrato.frontendMs > contrato.totalMs;
}