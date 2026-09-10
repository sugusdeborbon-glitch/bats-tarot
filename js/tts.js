/**
 * BATS Tarot — Text-to-Speech subsystem (Web Speech API)
 * Phase 2: Extracted from app.js. Exposes on window.BATS.tts.
 * Dependencies: lsGet/lsSet (ai.js), toast/_clear (app.js), extensionVoz (app.js),
 *               calcQuinta/textoQuinta/parsearQuinta/txt (numerology/deck)
 */
(function () {
  "use strict";

  var VOZ = { estado: "idle", idx: 0, partes: [], utter: null, dest: null, textos: {}, voz: null, tasa: 1, cargado: false };
  var VOZ_RATE_KEY = "bats-voz-tasa";
  var VOZ_VOZ_KEY = "bats-voz-voice";
  var VOZ_ULTIMA_FIRMA = "";

  function vozSoporte() {
    return typeof window !== "undefined" && ("speechSynthesis" in window) && ("SpeechSynthesisUtterance" in window);
  }

  function vozVozes() {
    try { return window.speechSynthesis.getVoices() || []; } catch (e) { return []; }
  }

  function vozEsVoz(v) { return v && /^es\b|^es-/i.test(v.lang || ""); }

  function vozTieneES() { return vozVozes().some(vozEsVoz); }

  function vozVozesES() {
    var vs = vozVozes().filter(vozEsVoz);
    vs.sort(function (a, b) {
      var ea = (a.lang || "").toLowerCase() === "es-es" ? 0 : 1;
      var eb = (b.lang || "").toLowerCase() === "es-es" ? 0 : 1;
      return (ea - eb) || (a.name || "").localeCompare(b.name || "");
    });
    return vs;
  }

  function vozVozPorURI(uri) {
    var vs = vozVozes();
    for (var i = 0; i < vs.length; i++) if (vs[i].voiceURI === uri) return vs[i];
    return null;
  }

  function vozVozActual() {
    if (VOZ.voz) return VOZ.voz;
    var saved = lsGet(VOZ_VOZ_KEY);
    if (saved) { var v = vozVozPorURI(saved); if (v) return v; }
    return vozVozesES()[0] || null;
  }

  function vozTextoDe(cartas, ctx) {
    ctx = ctx || window._lastCtx || {};
    var partes = [];
    if (cartas && cartas.length) {
      cartas.forEach(function (it) {
        var c = it.carta;
        if (!c) return;
        var pos = (it.posicion || "").replace(/\s+/g, " ").trim();
        var nm = c.nombre || "";
        if (it.invertida) nm += " (invertida)";
        var t = (it.texto || "").replace(/\s+/g, " ").trim();
        var seg = (pos ? pos + ": " : "") + nm;
        if (t) seg += ". " + t;
        if (seg) partes.push(seg);
      });
      if (typeof extensionVoz === "function") {
        var extVoz = extensionVoz(cartas);
        if (extVoz) partes.push(extVoz);
      }
      if (ctx.guion !== "arcano") {
        if (typeof calcQuinta === "function") {
          var q = calcQuinta(cartas);
          if (q) {
            var raw = (cartas._qtext || (typeof textoQuinta === "function" ? textoQuinta(q.nombre) : "") || (typeof txt === "function" ? txt(q, false) : "") || "");
            var p = typeof parsearQuinta === "function" ? parsearQuinta(raw) : { lectura: "", consejo: "", palabraClave: "", antipatron: "" };
            var qt = "Quintaesencia: " + q.nombre;
            if (p.lectura) qt += ". " + p.lectura;
            if (p.consejo) qt += ". Consejo: " + p.consejo;
            if (p.palabraClave) qt += ". Palabra clave: " + p.palabraClave;
            if (p.antipatron) qt += ". Antipatrón: " + p.antipatron;
            partes.push(qt);
          }
        }
      }
    }
    if (cartas && cartas._interp) {
      var li = String(cartas._interp).replace(/\s+/g, " ").trim();
      if (li) partes.push(li);
    }
    return partes.join(". ");
  }

  function vozDividir(texto, max) {
    max = max || 300;
    var s = String(texto || "").replace(/[#*_~`>]/g, "").replace(/\s+/g, " ").trim();
    if (!s) return [];
    var chunks = [], rest = s;
    while (rest.length > max) {
      var slice = rest.substring(0, max);
      var cut = slice.lastIndexOf(". ");
      if (cut < max * 0.5) cut = slice.lastIndexOf(" ");
      if (cut <= 0) cut = max;
      var piece = slice.substring(0, cut).trim();
      if (piece) chunks.push(piece);
      rest = rest.substring(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function vozPoblarSelect(sel) {
    if (!sel) return;
    var es = vozVozesES();
    var saved = lsGet(VOZ_VOZ_KEY);
    if (typeof _clear === "function") _clear(sel);
    else { while (sel.firstChild) sel.removeChild(sel.firstChild); }
    if (!es.length) {
      var opt = document.createElement("option");
      opt.value = ""; opt.textContent = "Sin voz en español";
      sel.appendChild(opt); sel.disabled = true;
      return;
    }
    sel.disabled = false;
    var selIdx = 0;
    es.forEach(function (v, i) {
      var o = document.createElement("option");
      o.value = v.voiceURI;
      o.textContent = v.name + " (" + v.lang + ")";
      sel.appendChild(o);
      if (saved && v.voiceURI === saved) selIdx = i;
    });
    sel.selectedIndex = selIdx;
  }

  function vozBarHTML(dest) {
    var d = String(dest || "").replace(/"/g, "");
    var h = '<div class="voz-bar" id="voz-' + d + '" data-dest="' + d + '">';
    h += '<span class="voz-label">Leer</span>';
    h += '<button class="btn btn-outline btn-sm voz-play" onclick="vozLeer(\'' + d + '\')">\u25B6 Escuchar</button>';
    h += '<button class="btn btn-outline btn-sm voz-pause" onclick="vozPausa()" disabled>\u23F8 Pausa</button>';
    h += '<button class="btn btn-outline btn-sm voz-stop" onclick="vozParar()" disabled>\u23F9 Parar</button>';
    h += '<span class="voz-tasa-group">';
    [0.75, 1, 1.25].forEach(function (t) {
      h += '<button class="btn btn-outline btn-sm voz-tasa' + (t === 1 ? " active" : "") + '" data-t="' + t + '" onclick="vozTasa(' + t + ')">' + t + '\u00D7</button>';
    });
    h += '</span>';
    h += '<select class="voz-select" onchange="vozCambiarVoz(\'' + d + '\',this.value)"></select>';
    h += '<button class="btn btn-outline btn-sm voz-mp3" data-mp3="' + d + '" onclick="vozDescargarMP3(\'' + d + '\')">\u2B07 MP3</button>';
    h += '<span class="voz-notice" style="display:none"></span>';
    h += '</div>';
    return h;
  }

  function vozBarDOM(dest) {
    var d = String(dest || "").replace(/"/g, "");
    var bar = document.createElement("div"); bar.className = "voz-bar"; bar.id = "voz-" + d; bar.setAttribute("data-dest", d);
    var lbl = document.createElement("span"); lbl.className = "voz-label"; lbl.textContent = "Leer"; bar.appendChild(lbl);
    var pBtn = document.createElement("button"); pBtn.className = "btn btn-outline btn-sm voz-play"; pBtn.textContent = "\u25B6 Escuchar"; pBtn.onclick = function () { vozLeer(d); }; bar.appendChild(pBtn);
    var paBtn = document.createElement("button"); paBtn.className = "btn btn-outline btn-sm voz-pause"; paBtn.textContent = "\u23F8 Pausa"; paBtn.disabled = true; paBtn.onclick = vozPausa; bar.appendChild(paBtn);
    var sBtn = document.createElement("button"); sBtn.className = "btn btn-outline btn-sm voz-stop"; sBtn.textContent = "\u23F9 Parar"; sBtn.disabled = true; sBtn.onclick = vozParar; bar.appendChild(sBtn);
    var tGrp = document.createElement("span"); tGrp.className = "voz-tasa-group";
    [0.75, 1, 1.25].forEach(function (t) {
      var tb = document.createElement("button"); tb.className = "btn btn-outline btn-sm voz-tasa" + (t === 1 ? " active" : ""); tb.setAttribute("data-t", t); tb.textContent = t + "\u00D7"; tb.onclick = function () { vozTasa(t); }; tGrp.appendChild(tb);
    });
    bar.appendChild(tGrp);
    var sel = document.createElement("select"); sel.className = "voz-select"; sel.onchange = function () { vozCambiarVoz(d, this.value); }; bar.appendChild(sel);
    var mp3 = document.createElement("button"); mp3.className = "btn btn-outline btn-sm voz-mp3"; mp3.setAttribute("data-mp3", d); mp3.textContent = "\u2B07 MP3"; mp3.onclick = function () { vozDescargarMP3(d); }; bar.appendChild(mp3);
    var notice = document.createElement("span"); notice.className = "voz-notice"; notice.style.display = "none"; bar.appendChild(notice);
    return bar;
  }

  function vozActualizarBarras() {
    if (typeof document === "undefined") return;
    var bars = document.querySelectorAll(".voz-bar");
    for (var i = 0; i < bars.length; i++) {
      var bar = bars[i];
      var dest = bar.getAttribute("data-dest") || (bar.id || "").replace(/^voz-/, "");
      var play = bar.querySelector(".voz-play"), pause = bar.querySelector(".voz-pause"), stop = bar.querySelector(".voz-stop");
      var notice = bar.querySelector(".voz-notice");
      if (!play) continue;
      if (!vozSoporte()) {
        if (notice) { notice.style.display = "block"; notice.textContent = "Este dispositivo no soporta lectura por voz."; }
        play.disabled = true; if (pause) pause.disabled = true; if (stop) stop.disabled = true;
        continue;
      }
      if (!vozTieneES() && VOZ.cargado) {
        if (notice) { notice.style.display = "block"; notice.textContent = "No hay voz en español instalada en este dispositivo"; }
        play.disabled = true; if (pause) pause.disabled = true; if (stop) stop.disabled = true;
        continue;
      }
      if (!VOZ.cargado) {
        if (notice) { notice.style.display = "none"; }
        play.disabled = true; play.textContent = "\u2026 Cargando voces";
        if (pause) pause.disabled = true; if (stop) stop.disabled = true;
        continue;
      }
      if (notice) { notice.style.display = "none"; }
      play.disabled = false; play.textContent = "\u25B6 Escuchar";
      if (VOZ.estado === "hablando" && VOZ.dest === dest) {
        play.textContent = "\u25B6 Leyendo\u2026"; if (pause) pause.disabled = false; if (stop) stop.disabled = false;
      } else if (VOZ.estado === "pausado" && VOZ.dest === dest) {
        play.textContent = "\u25B6 Reanudar"; if (pause) pause.disabled = true; if (stop) stop.disabled = false;
      } else {
        if (pause) pause.disabled = true; if (stop) stop.disabled = true;
      }
    }
  }

  function vozHablar() {
    if (!VOZ.partes || VOZ.idx >= VOZ.partes.length) { vozTerminar(); return; }
    var u = new SpeechSynthesisUtterance(VOZ.partes[VOZ.idx]);
    var v = vozVozActual();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "es-ES"; }
    u.rate = VOZ.tasa; u.pitch = 1;
    u.onend = function () { VOZ.idx++; if (VOZ.idx < VOZ.partes.length) vozHablar(); else vozTerminar(); };
    u.onerror = function () { vozTerminar(); };
    VOZ.utter = u; VOZ.estado = "hablando"; vozActualizarBarras();
    try { window.speechSynthesis.speak(u); } catch (e) { vozTerminar(); }
  }

  function vozLeer(dest) {
    if (!vozSoporte()) { toast("Este dispositivo no soporta lectura por voz", true); return; }
    var texto = VOZ.textos[dest] || (window._ult ? vozTextoDe(window._ult) : "");
    if (!texto) { toast("No hay texto que leer", true); return; }
    if (VOZ.estado === "pausado" && VOZ.dest === dest) { vozReanudar(); return; }
    vozParar(false);
    vozConVoices(function () {
      if (!vozTieneES()) {
        VOZ.cargado = true; vozActualizarBarras();
        toast("No hay voz en español instalada en este dispositivo", true); return;
      }
      VOZ.partes = vozDividir(texto);
      VOZ.idx = 0; VOZ.dest = dest; VOZ.tasa = vozTasaActual();
      vozHablar();
    });
  }

  function vozPausa() {
    if (!vozSoporte() || VOZ.estado !== "hablando") return;
    try { window.speechSynthesis.pause(); } catch (e) {}
    VOZ.estado = "pausado"; vozActualizarBarras();
  }

  function vozReanudar() {
    if (!vozSoporte() || VOZ.estado !== "pausado") return;
    try { window.speechSynthesis.resume(); } catch (e) {}
    VOZ.estado = "hablando"; vozActualizarBarras();
  }

  function vozParar(actualizar) {
    actualizar = (actualizar === undefined) ? true : actualizar;
    if (vozSoporte()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    VOZ.estado = "idle"; VOZ.idx = 0; VOZ.partes = []; VOZ.utter = null; VOZ.dest = null;
    if (actualizar) vozActualizarBarras();
  }

  function vozTerminar() {
    VOZ.estado = "idle"; VOZ.idx = 0; VOZ.partes = []; VOZ.utter = null; VOZ.dest = null;
    vozActualizarBarras();
  }

  function vozTasaActual() {
    var t = parseFloat(lsGet(VOZ_RATE_KEY));
    return (t === 0.75 || t === 1 || t === 1.25) ? t : 1;
  }

  function vozTasa(t) {
    if (t !== 0.75 && t !== 1 && t !== 1.25) return;
    VOZ.tasa = t; lsSet(VOZ_RATE_KEY, String(t));
    var btns = document.querySelectorAll(".voz-tasa");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", parseFloat(btns[i].getAttribute("data-t")) === t);
    if (VOZ.estado === "hablando" || VOZ.estado === "pausado") {
      if (vozSoporte()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
      VOZ.estado = "idle";
      if (VOZ.partes && VOZ.idx < VOZ.partes.length) {
        VOZ.estado = "hablando";
        setTimeout(function () { vozHablar(); }, 30);
      }
    }
  }

  function vozCambiarVoz(dest, uri) {
    var v = uri ? vozVozPorURI(uri) : null;
    if (!v) return;
    VOZ.voz = v; lsSet(VOZ_VOZ_KEY, v.voiceURI);
    if (VOZ.estado === "hablando" || VOZ.estado === "pausado") {
      var actual = VOZ.idx;
      if (vozSoporte()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
      VOZ.estado = "idle"; VOZ.idx = actual; VOZ.estado = "hablando";
      setTimeout(function () { vozHablar(); }, 30);
    }
  }

  function vozFirma() {
    try { return vozVozes().map(function (v) { return (v.voiceURI || "") + "|" + (v.lang || ""); }).join(";"); } catch (e) { return ""; }
  }

  function vozCalentar() {
    try {
      var u = new SpeechSynthesisUtterance(" ");
      u.volume = 0; u.rate = 1; u.pitch = 1;
      window.speechSynthesis.speak(u);
      setTimeout(function () { try { window.speechSynthesis.cancel(); } catch (e) {} }, 60);
    } catch (e) {}
  }

  function vozCargar() {
    if (!vozSoporte()) return;
    var marco = Date.now();
    var detenido = false;
    function revisar() {
      if (detenido) return;
      var vs = vozVozes();
      if (vs.length) VOZ.cargado = true;
      else if (Date.now() - marco >= 10000) VOZ.cargado = true;
      var firma = vozFirma();
      if (firma !== VOZ_ULTIMA_FIRMA) {
        VOZ_ULTIMA_FIRMA = firma;
        var sels = document.querySelectorAll(".voz-select");
        for (var i = 0; i < sels.length; i++) vozPoblarSelect(sels[i]);
      }
      vozActualizarBarras();
    }
    try { window.speechSynthesis.addEventListener("voiceschanged", revisar); } catch (e) {}
    try { window.speechSynthesis.onvoiceschanged = revisar; } catch (e) {}
    vozCalentar();
    revisar();
    var iv = setInterval(revisar, 500);
    setTimeout(function () { detenido = true; clearInterval(iv); }, 60000);
  }

  function vozConVoices(cb) {
    if (vozVozes().length) { cb(); return; }
    vozCalentar();
    var intentos = 0;
    var iv = setInterval(function () {
      intentos++;
      if (vozVozes().length || intentos >= 10) {
        clearInterval(iv);
        cb();
      }
    }, 300);
  }

  function vozDescargarMP3(dest) {
    var texto = VOZ.textos[dest] || (window._ult ? vozTextoDe(window._ult) : "");
    if (!texto) { toast("No hay texto que descargar", true); return; }
    if (typeof getWorkerURL !== "function" || typeof AI_WORKER_TOKEN === "undefined") { toast("Servicio de voz no disponible", true); return; }
    var btn = document.querySelector('[data-mp3="' + dest + '"]');
    if (btn) { btn.disabled = true; btn.textContent = "Generando MP3\u2026"; }
    var voz = vozVozActual();
    var lang = (voz && voz.lang) ? String(voz.lang) : "es-ES";
    var tl = /^es-US$/i.test(lang) ? "es-US" : "es";
    var url = getWorkerURL() + "/api/tts";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BATS-Token": AI_WORKER_TOKEN },
      body: JSON.stringify({ text: texto, voice: tl })
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || ("Error del servidor (" + r.status + ")")); });
      return r.blob();
    }).then(function (blob) {
      var u = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = u; a.download = "lectura-bats.mp3";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      toast("MP3 descargado");
    }).catch(function (e) {
      toast("No se pudo generar el MP3: " + (e && e.message || "error"), true);
    }).finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = "\u2B07 MP3"; }
    });
  }

  // ── Expose on window.BATS.tts ──────────────────────
  window.BATS = window.BATS || {};
  window.BATS.tts = {
    VOZ: VOZ,
    vozSoporte: vozSoporte, vozVozes: vozVozes, vozEsVoz: vozEsVoz,
    vozTieneES: vozTieneES, vozVozesES: vozVozesES, vozVozPorURI: vozVozPorURI,
    vozVozActual: vozVozActual, vozTextoDe: vozTextoDe, vozDividir: vozDividir,
    vozPoblarSelect: vozPoblarSelect, vozBarHTML: vozBarHTML, vozBarDOM: vozBarDOM,
    vozActualizarBarras: vozActualizarBarras, vozHablar: vozHablar, vozLeer: vozLeer,
    vozPausa: vozPausa, vozReanudar: vozReanudar, vozParar: vozParar,
    vozTerminar: vozTerminar, vozTasaActual: vozTasaActual, vozTasa: vozTasa,
    vozCambiarVoz: vozCambiarVoz, vozFirma: vozFirma, vozCalentar: vozCalentar,
    vozCargar: vozCargar, vozConVoices: vozConVoices, vozDescargarMP3: vozDescargarMP3
  };

  // ── Backward-compatible globals ─────────────────────
  window.VOZ = VOZ;
  window.VOZ_RATE_KEY = VOZ_RATE_KEY;
  window.VOZ_VOZ_KEY = VOZ_VOZ_KEY;
  window.VOZ_ULTIMA_FIRMA = VOZ_ULTIMA_FIRMA;
  window.vozSoporte = vozSoporte;
  window.vozVozes = vozVozes;
  window.vozEsVoz = vozEsVoz;
  window.vozTieneES = vozTieneES;
  window.vozVozesES = vozVozesES;
  window.vozVozPorURI = vozVozPorURI;
  window.vozVozActual = vozVozActual;
  window.vozTextoDe = vozTextoDe;
  window.vozDividir = vozDividir;
  window.vozPoblarSelect = vozPoblarSelect;
  window.vozBarHTML = vozBarHTML;
  window.vozBarDOM = vozBarDOM;
  window.vozActualizarBarras = vozActualizarBarras;
  window.vozHablar = vozHablar;
  window.vozLeer = vozLeer;
  window.vozPausa = vozPausa;
  window.vozReanudar = vozReanudar;
  window.vozParar = vozParar;
  window.vozTerminar = vozTerminar;
  window.vozTasaActual = vozTasaActual;
  window.vozTasa = vozTasa;
  window.vozCambiarVoz = vozCambiarVoz;
  window.vozFirma = vozFirma;
  window.vozCalentar = vozCalentar;
  window.vozCargar = vozCargar;
  window.vozConVoices = vozConVoices;
  window.vozDescargarMP3 = vozDescargarMP3;
})();
