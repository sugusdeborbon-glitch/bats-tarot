/* ============ AI PIPELINE (extracted from app.js) ============ */
/* Depends on: escHTML, toast, _clear, comodinPendiente (app.js)
                getAIMode, getFlagCorta, getFlagLarga, etiquetaIA, generarTextosIA, generarInterpretacionLarga (ai.js)
                vozParar, vozSoporte, vozBarDOM, vozTextoDe, vozPoblarSelect, vozActualizarBarras, VOZ (tts.js)
                ponerBotones (export-share.js)
                BATS_VERSION (global) */

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
  var ini=Date.now(),tick=null,failsafe=null,acabado=false;
  function limpiar(){acabado=true;if(tick){clearInterval(tick);tick=null}if(failsafe){clearTimeout(failsafe);failsafe=null}}
  function mostrarError(e){
    limpiar();
    try{console.error("Error interpretacion larga:",e)}catch(_){}
    _clear(body);
    var p=document.createElement("p");p.className="subtle";p.textContent="No se pudo generar la interpretación"+(e&&e.message?": "+e.message:"");body.appendChild(p);
    var btns=document.createElement("div");btns.className="ai-interp-btns";
    var rb=document.createElement("button");rb.className="btn btn-outline btn-sm";rb.textContent="Reintentar";rb.onclick=(function(dd){return function(){reintentarInterp(dd)}})(dest);
    btns.appendChild(rb);body.appendChild(btns);
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
  failsafe=setTimeout(function(){
    if(acabado) return;
    if(body&&body.querySelector(".ai-spinner")) mostrarError(new Error("La IA tard\u00f3 demasiado. Reintenta."));
  },30000);
  try{
    generarInterpretacionLarga(cartas,ctx).then(function(t){
      mostrarOK(t);
    }).catch(function(e){
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
  reintentarInterp: reintentarInterp
};