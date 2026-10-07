/* ============ AI PIPELINE (extracted from app.js) ============ */
/* H-04: contador de ejecuciones. Cada render de interpretación larga toma un
   token; una respuesta que llega de un token antiguo se ignora, de modo que
   una operación terminal permanece terminal. */
/* Depends on: escHTML, toast, _clear, comodinPendiente (app.js)
                getAIMode, getFlagCorta, getFlagLarga, etiquetaIA, generarTextosIA, generarInterpretacionLarga (ai.js)
                vozParar, vozSoporte, vozBarDOM, vozTextoDe, vozPoblarSelect, vozActualizarBarras, VOZ (tts.js)
ponerBotones (export-share.js)
                 BATS_VERSION (global) */

/* H-04.A — IDENTIFICACIÓN DE OPERACIONES CONCURRENTES POR DESTINO
 *
 * Finding A: un contador GLOBAL invalidaba operaciones legítimas e
 * independientes. Renderizar el Arcano Visitante (`r-arcano-visitante`)
 * mientras una tirada (`r-diaria`) seguía en vuelo descartaba la respuesta de
 * la tirada, porque el contador global ya había avanzado.
 *
 * La regla correcta: una operación solo se invalida cuando otra operación la
 * SUSTITUYE EN SU MISMO DESTINO. El ámbito que identifica una operación
 * sustituible es el destino de render, no un contador compartido.
 *
 * `dest` puede llegar como string DOM ("r-diaria") o nulo/undefined cuando
 * viene de window._lastPanelDest; por eso la clave se normaliza con String()
 * y un respaldo explícito, para que dos destinos distintos nunca colisionen.
 */
var TOKEN_POR_DESTINO={};
var LIMPIADORES_POR_DESTINO={};
var secuenciaToken=0;

/**
 * Clave estable y no colisionable para un destino de render.
 * @param {*} dest  destino (string DOM, null o undefined).
 * @returns {string} clave comparable.
 */
function claveDestino(dest){
  var d=(dest===null||dest===undefined)?"":String(dest);
  return d===""?"(sin-destino)":d;
}

/**
 * Abre una operación y devuelve su token. Invalida la operación anterior
 * que hubiera sobre el MISMO destino.
 * @param {*} dest  destino de render.
 * @returns {number} token de esta ejecución.
 */
function abrirOperacion(dest){
  var k=claveDestino(dest);
  /* H-04.A: si había una operación previa sobre ESTE destino, se la retira
     de forma activa. Sin esto su `setInterval` del contador de segundos
     quedaría huérfano, porque una operación sustituida nunca resuelve y
     por tanto nunca llega a `limpiar()`. */
  var previa=LIMPIADORES_POR_DESTINO[k];
  if(previa){try{previa()}catch(_){}delete LIMPIADORES_POR_DESTINO[k]}
  TOKEN_POR_DESTINO[k]=(secuenciaToken++)+1;
  return TOKEN_POR_DESTINO[k];
}

/**
 * Registra la función de limpieza de una operación en vuelo, para poder
 * retirarla si una operación posterior la sustituye.
 * @param {*} dest  destino de render.
 * @param {function} fn  limpieza (limpiar()).
 */
function registrarLimpiador(dest,fn){
  LIMPIADORES_POR_DESTINO[claveDestino(dest)]=fn;
}

/**
 * ¿Esta ejecución sigue siendo la vigente para su destino?
 *
 * @param {*} dest    destino de render.
 * @param {number} tok token capturado al abrir.
 * @returns {boolean}  true si su respuesta puede aplicarse.
 */
function operacionVigente(dest,tok){
  return TOKEN_POR_DESTINO[claveDestino(dest)]===tok;
}

/**
 * Cierra la operación: marca el token como retirado para que cualquier
 * respuesta posterior de esa misma ejecución sea descartada.
 * @param {*} dest  destino de render.
 * @param {number} tok token capturado al abrir.
 */
function cerrarOperacion(dest,tok){
  var k=claveDestino(dest);
  if(TOKEN_POR_DESTINO[k]===tok){
    delete TOKEN_POR_DESTINO[k];
    delete LIMPIADORES_POR_DESTINO[k];
  }
}

function interpParaHTML(t){
  var h=escHTML(t);
  return h.replace(/\*\*/g,"").replace(/^#{1,6}\s*/gm,"").replace(/\*([^*]+)\*/g,"$1").replace(/\n{3,}/g,"\n\n").replace(/\n/g,"<br>");
}

function renderConIA(cartas,dest,renderFn,ctx){
  ctx=ctx||{};
  ctx.fecha=ctx.fecha||new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});
  window._lastCtx=ctx;
  if(typeof vozParar==="function"){try{vozParar()}catch(e){}}
  var panelId=ctx.panelId||window._lastPanel||"tirada";
  var titulo=ctx.titulo||window._lastPanelTitle||"Tirada";
  var modo=(typeof getAIMode==="function")?getAIMode():"off";
  var useCorta=modo!=="off"&&getFlagCorta(panelId);
  var useLarga=modo!=="off"&&getFlagLarga(panelId);
  function finSinIA(){
    window._ocultarReferencias=false;
    try{renderFn()}catch(e){console.error("renderFn:",e)}
    try{ponerBotones(dest,titulo,panelId)}catch(e){console.error("ponerBotones:",e)}
  }
  function falloIA(e){
    console.error("Error textos IA:",e);
    window._ocultarReferencias=false;
    toast((e&&e.message||"Error de IA")+". Se muestran los textos BATS.",true);
    try{renderFn()}catch(e2){console.error("renderFn:",e2)}
    if(useLarga){try{renderInterpLarga(dest,cartas,ctx)}catch(e3){console.error("renderInterpLarga:",e3);toast("Error al iniciar la interpretaci\u00f3n larga: "+(e3&&e3.message||e3),true)}}
    try{ponerBotones(dest,titulo,panelId)}catch(e4){console.error("ponerBotones:",e4)}
  }
  if(modo==="off"||(!useCorta&&!useLarga)){
    finSinIA();
    return;
  }
  if(comodinPendiente(cartas)){
    window._ocultarReferencias=true;
    try{renderFn()}catch(e){console.error("renderFn:",e)}
    try{ponerBotones(dest,titulo,panelId)}catch(e){console.error("ponerBotones:",e)}
    return;
  }
  if(useLarga){
    var el=document.getElementById(dest);
    if(useCorta){
      window._ocultarReferencias=true;
      if(el){_clear(el);var ld=document.createElement("div");ld.className="ai-cargando";var sp=document.createElement("span");sp.className="ai-spinner";ld.appendChild(sp);ld.appendChild(document.createTextNode("Interpretando con IA\u2026"));el.appendChild(ld);}
      generarTextosIA(cartas,ctx).then(function(){
        window._ocultarReferencias=false;
        try{renderFn()}catch(e){console.error("renderFn:",e)}
        try{renderInterpLarga(dest,cartas,ctx)}catch(e){console.error("renderInterpLarga:",e);toast("Error al iniciar la interpretaci\u00f3n larga: "+(e&&e.message||e),true)}
        try{ponerBotones(dest,titulo,panelId)}catch(e){console.error("ponerBotones:",e)}
      }).catch(falloIA);
    } else {
      try{renderFn()}catch(e){console.error("renderFn:",e)}
      try{renderInterpLarga(dest,cartas,ctx)}catch(e){console.error("renderInterpLarga:",e);toast("Error al iniciar la interpretaci\u00f3n larga: "+(e&&e.message||e),true)}
      try{ponerBotones(dest,titulo,panelId)}catch(e){console.error("ponerBotones:",e)}
    }
    return;
  }
  window._ocultarReferencias=true;
  generarTextosIA(cartas,ctx).then(function(){
    window._ocultarReferencias=false;
    try{renderFn()}catch(e){console.error("renderFn:",e)}
    try{ponerBotones(dest,titulo,panelId)}catch(e){console.error("ponerBotones:",e)}
  }).catch(falloIA);
}

function renderInterpLarga(dest,cartas,ctx){
  ctx=ctx||{};
  var el=document.getElementById(dest);
  if(!el) return;
  var cont=document.getElementById("ai-interp-"+dest);
  if(!cont){
    cont=document.createElement("div");
    cont.className="ai-interp";
    cont.id="ai-interp-"+dest;
    el.parentNode.insertBefore(cont,el.nextSibling);
  }
  cont.style.display="";
  _clear(cont);
  var h4=document.createElement("h4");h4.className="ai-interp-title";h4.textContent="\u2726 Interpretación";cont.appendChild(h4);
  var bodyWrap=document.createElement("div");bodyWrap.className="ai-interp-body";
  var carg=document.createElement("div");carg.className="ai-cargando";
  var sp=document.createElement("span");sp.className="ai-spinner";carg.appendChild(sp);
  carg.appendChild(document.createTextNode("Generando interpretación"));
  var tEl=document.createElement("span");tEl.className="ai-interp-t";carg.appendChild(tEl);
  carg.appendChild(document.createTextNode("\u2026 "));
  var vEl=document.createElement("span");vEl.className="ai-interp-v";vEl.style.cssText="font-size:.75em;opacity:.6";vEl.textContent="v"+BATS_VERSION;carg.appendChild(vEl);
  var sEl=document.createElement("span");sEl.className="ai-interp-status";sEl.style.cssText="display:block;font-size:.72em;opacity:.75;margin-top:4px";carg.appendChild(sEl);
  bodyWrap.appendChild(carg);cont.appendChild(bodyWrap);
  var body=bodyWrap;
  var ini=Date.now(),tick=null,acabado=false;
  /* H-04.A: el token pertenece al DESTINO, no a un contador global. Otra
     operación sobre otro destino no invalida esta, y una nueva sobre este
     mismo destino sí la invalida. */
  var miToken=abrirOperacion(dest);
  function limpiar(){acabado=true;if(tick){clearInterval(tick);tick=null}cerrarOperacion(dest,miToken)}
  /* Permite que una operación posterior sobre este destino retire los timers
     de esta si la sustituye. */
  registrarLimpiador(dest,limpiar);
  function mostrarError(e){
    limpiar();
    try{console.error("Error interpretacion larga:",e)}catch(_){}
    _clear(body);
    var p=document.createElement("p");p.className="subtle";p.textContent="No se pudo generar la interpretación"+(e&&e.message?": "+e.message:"");body.appendChild(p);
    var btns=document.createElement("div");btns.className="ai-interp-btns";
    var rb=document.createElement("button");rb.className="btn btn-outline btn-sm";rb.textContent="Reintentar";rb.onclick=(function(dd){return function(){reintentarInterp(dd)}})(dest);
    btns.appendChild(rb);body.appendChild(btns);
    /* El fallo de IA no impide escuchar la tirada: la barra de voz lee los
       textos de las cartas (vozTextoDe(cartas,ctx)), no la interpretación
       generada, así que también se ofrece en el panel de error. */
    if(typeof vozSoporte==="function"&&vozSoporte()){
      var vd=String(dest).replace(/"/g,"");
      body.appendChild(vozBarDOM(vd));
      VOZ.textos[vd]=vozTextoDe(cartas,ctx);
      vozPoblarSelect(body.querySelector(".voz-select"));
      vozActualizarBarras();
    }
  }
  function mostrarOK(t){
    limpiar();
    cartas._interp=t;
    cartas._ia=etiquetaIA()||"";
    _clear(body);
    var td=document.createElement("div");td.className="ai-interp-texto";td.innerHTML=interpParaHTML(t);body.appendChild(td);
    if(cartas._ia){var iad=document.createElement("div");iad.className="ai-interp-ia";iad.textContent="IA que ha asistido la interpretación: "+cartas._ia;body.appendChild(iad);}
    if(typeof vozSoporte==="function"&&vozSoporte()){
      var vd=String(dest).replace(/"/g,"");
      body.appendChild(vozBarDOM(vd));
      VOZ.textos[vd]=vozTextoDe(cartas,ctx);
      vozPoblarSelect(body.querySelector(".voz-select"));
      vozActualizarBarras();
    }
  }
  function tickS(){
    if(!acabado&&tEl) tEl.textContent=" ("+Math.round((Date.now()-ini)/1000)+" s)";
  }
  window._iaStatus=function(s){
    if(acabado) return;
    if(sEl) sEl.textContent=s;
    try{console.log("[BATS-IA]",s)}catch(_){}
  };
  tickS();
  tick=setInterval(tickS,1000);
  /* H-04: el failsafe de 30 s desaparece. El Worker es la autoridad
     temporal y su presupuesto LARGA es de 75 s; un corte a los 30 s en el
     navegador cerraba operaciones que el Worker todavía podía responder.
     Aquí solo el frontend decide, y decide cuando su propio timeout vence. */
  try{
    generarInterpretacionLarga(cartas,ctx).then(function(t){
      /* H-04.A: se descarta si esta ejecución ya terminó o si otra operación
         sustituyó a ESTE MISMO destino. Otra operación sobre otro destino no
         la invalida. */
      if(acabado||!operacionVigente(dest,miToken)) return;
      mostrarOK(t);
    }).catch(function(e){
      if(acabado||!operacionVigente(dest,miToken)) return;
      mostrarError(e);
    });
  }catch(e){
    mostrarError(e);
  }
}

function reintentarInterp(dest){
  if(window._ult) renderInterpLarga(dest,window._ult,window._lastCtx||{});
}

/* ── Expose on window.BATS.aiPipeline ────────────────────── */
window.BATS = window.BATS || {};
window.BATS.aiPipeline = {
  renderConIA: renderConIA,
  renderInterpLarga: renderInterpLarga,
  interpParaHTML: interpParaHTML,
  reintentarInterp: reintentarInterp,
  /* H-04.A: el mecanismo de identificación por destino se expone para poder
     verificarlo con tests de comportamiento sobre el módulo real. */
  claveDestino: claveDestino,
  abrirOperacion: abrirOperacion,
  registrarLimpiador: registrarLimpiador,
  operacionVigente: operacionVigente,
  cerrarOperacion: cerrarOperacion
};