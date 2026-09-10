/* ============ RENDER CARDS (extracted from app.js) ============ */
/* Depends on: esComodin, comodinImg, comodinEnCartas, comodinPendiente, txt, batsDe, TABLA_78, BARAJA (deck.js)
                calcQuinta, textoQuinta, parsearQuinta, extensionMd, extensionHtml (numerology.js)
                escHTML, _clear, _mkEl, interpParaHTML (app.js)
                ponerBotones (export-share.js)
                vozBarDOM, vozTextoDe, vozPoblarSelect, vozActualizarBarras (tts.js)
                generarTextosIA, getAIMode, getFlagCorta, getFlagLarga, BATS_VERSION (ai.js / state.js) */

function imgCard(c,comodinEstado,comodinInv,idx){
  var frag=document.createDocumentFragment();
  if(esComodin(c)){
    var src=comodinImg(comodinEstado||"reverso",comodinInv);
    var cls="comodin-card"+(comodinInv&&comodinEstado!=="reverso"?" invertida":"");
    var img=document.createElement("img");
    img.src=src;img.alt="Comodín";img.className=cls;
    if(typeof idx==="number") img.onclick=function(){revelarComodin(idx)};
    else img.onclick=function(){abrirLightbox(src,"Comodín")};
    frag.appendChild(img);
    return frag;
  }
  var img=document.createElement("img");
  img.src=c.img;img.alt=c.nombre;img.loading="lazy";
  img.onclick=function(){abrirLightbox(c.img,c.nombre)};
  img.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'};
  frag.appendChild(img);
  var ph=document.createElement("div");
  ph.className="card-placeholder";ph.style.display="none";
  var cpn=document.createElement("div");cpn.className="cp-name";cpn.textContent=c.letras;
  var cps=document.createElement("div");cps.className="cp-suit";cps.textContent=c.tipo==="arcano"?"AM":c.nucleo;
  ph.appendChild(cpn);ph.appendChild(cps);
  frag.appendChild(ph);
  return frag;
}

function abrirLightbox(src,alt){
  var o=document.createElement('div');
  o.className='lightbox';
  var bg=document.createElement('div');
  bg.className='lightbox-bg';
  bg.onclick=function(){o.remove()};
  var content=document.createElement('div');
  content.className='lightbox-content';
  content.onclick=function(){o.remove()};
  var img=document.createElement('img');
  img.src=src;
  img.alt=alt;
  var nom=document.createElement('div');
  nom.className='lightbox-nombre';
  nom.textContent=alt;
  content.appendChild(img);
  content.appendChild(nom);
  o.appendChild(bg);
  o.appendChild(content);
  document.body.appendChild(o);
}

function revelarComodin(i){
  var cartas=window._ult;if(!cartas) return;
  var it=cartas[i];if(!it||!esComodin(it.carta)) return;
  if(it.comodinEstado==="reverso"){
    it.comodinEstado="cerrado";
    it.comodinImg=comodinImg("cerrado",it.comodinInvertido);
    renderCartasActuales();
    return;
  }
  if(it.comodinEstado==="cerrado"){
    if(it.comodinInvertido){toast(COMODIN_INV_TEXT);return;}
    if(it.extensionResuelta) return;
    abrirExtension(i);
    return;
  }
}

function abrirExtension(i){
  var cartas=window._ult;if(!cartas) return;
  var it=cartas[i];if(!it||!esComodin(it.carta)||it.extensionResuelta) return;
  var pool=window._mazoRestante||[];
  if(pool.length<3){toast("No hay suficientes cartas para la extensión",true);return;}
  var inv=it.comodinInvertido;
  var ext=[];
  for(var e=0;e<3;e++){
    var cr=pool[e];
    var invC=inv?Math.random()<.5:false;
    ext.push({carta:cr,invertida:invC,posicion:COMODIN_POS[e],texto:txt(cr,invC,e===0)});
  }
  it.extension=ext;
  it.extensionResuelta=true;
  it.comodinEstado="abierto";
  it.comodinImg=comodinImg("abierto",false);
  window._mazoRestante=pool.slice(3);
  recalcularQuintaYRenderizar();
  var dest=window._lastPanelDest;
  var ctx=window._lastCtx;
  if(!dest||!ctx) return;
  var panelId=ctx.panelId||window._lastPanel||"tirada";
  var useCorta=getFlagCorta(panelId);
  var useLarga=getFlagLarga(panelId);
  function fin(){
    window._ocultarReferencias=false;
    renderCartasActuales();
    if(useLarga){try{renderInterpLarga(dest,cartas,ctx)}catch(e){console.error("renderInterpLarga post-ext:",e)}}
    try{ponerBotones(dest,window._lastPanelTitle||"",window._lastPanel||"")}catch(e){}
  }
  if(!useCorta&&!useLarga){fin();return;}
  if(useLarga){
    window._ocultarReferencias=true;
    var el=document.getElementById(dest);
    if(el){_clear(el);var ld=document.createElement("div");ld.className="ai-cargando";var sp=document.createElement("span");sp.className="ai-spinner";ld.appendChild(sp);ld.appendChild(document.createTextNode("Interpretando con IA\u2026"));el.appendChild(ld);}
    var pCorta=useCorta?generarTextosIA(cartas,ctx):Promise.resolve(cartas);
    pCorta.then(fin).catch(function(e){
      console.error("Error textos IA post-ext:",e);
      fin();
    });
    return;
  }
  window._ocultarReferencias=true;
  generarTextosIA(cartas,ctx).then(fin).catch(function(e){console.error("Error textos IA post-ext:",e);fin()});
}

function renderCartasActuales(){
  var cartas=window._ult;if(!cartas) return;
  var dest=window._lastPanelDest;
  if(!dest) return;
  var opts=window._lastRenderOpts||{};
  if(cartas.length===5&&!opts.posiciones) mostrarCruz(cartas,dest,opts);
  else mostrarCompleto(cartas,dest,opts);
  ponerBotones(dest,window._lastPanelTitle||"",window._lastPanel||"");
  var qEl=document.getElementById("q-result");
  if(qEl){_clear(qEl);var qn=qHTML(cartas);if(qn)qEl.appendChild(qn);}
}

function recalcularQuintaYRenderizar(){
  renderCartasActuales();
}

function qHTML(cartas){
  if(window._ocultarReferencias) return document.createDocumentFragment();
  var d=_mkEl("div","q-box");
  var lbl=_mkEl("div","q-label");lbl.textContent="\u2726 QUINTAESENCIA";
  var inner=_mkEl("div","q-inner");
  if(comodinPendiente(cartas)){
    var pend=document.createElement("div");pend.style.color="var(--text2)";pend.textContent="Pendiente de resolución del Comodín";
    inner.appendChild(pend);d.appendChild(lbl);d.appendChild(inner);return d;
  }
  var q=calcQuinta(cartas);
  if(!q){
    var nc=document.createElement("div");nc.style.color="var(--text2)";nc.textContent="No calculada";
    inner.appendChild(nc);d.appendChild(lbl);d.appendChild(inner);return d;
  }
  var raw=cartas._qtext||textoQuinta(q.nombre)||txt(q,false);
  var p=parsearQuinta(raw);
  lbl.textContent="\u2726 QUINTAESENCIA: "+q.nombre;
  inner.appendChild(imgCard(q));
  var info=document.createElement("div");
  var nm=document.createElement("div");nm.className="q-name";nm.textContent=q.nombre;info.appendChild(nm);
  if(p.lectura){var t=document.createElement("div");t.className="q-text";t.textContent=p.lectura;info.appendChild(t);}
  if(p.consejo){var f=document.createElement("div");f.className="q-field";var fl=document.createElement("span");fl.className="q-fl";fl.textContent="Consejo de acción BATS";f.appendChild(fl);f.appendChild(document.createTextNode(p.consejo));info.appendChild(f);}
  if(p.palabraClave){var f=document.createElement("div");f.className="q-field";var fl=document.createElement("span");fl.className="q-fl";fl.textContent="Palabra clave";f.appendChild(fl);f.appendChild(document.createTextNode(p.palabraClave));info.appendChild(f);}
  if(p.antipatron){var f=document.createElement("div");f.className="q-field";var fl=document.createElement("span");fl.className="q-fl";fl.textContent="Antipatrón";f.appendChild(fl);f.appendChild(document.createTextNode(p.antipatron));info.appendChild(f);}
  inner.appendChild(info);
  d.appendChild(lbl);d.appendChild(inner);
  return d;
}

function renderExtensionHTML(cartas){
  var ci=comodinEnCartas(cartas);
  if(!ci||!ci.extensionResuelta||!ci.extension) return document.createDocumentFragment();
  var frag=document.createDocumentFragment();
  var box=document.createElement("div");box.className="extension-box";
  var lbl=document.createElement("div");lbl.className="ext-label";lbl.textContent="\u2726 COMODÍN \u221E \u2192 EXTENSIÓN BATS";
  var desc=document.createElement("div");desc.style.cssText="color:var(--gold2);font-style:italic;font-size:.8rem;margin-bottom:8px";desc.textContent=COMODIN_TEXTO_ABIERTO;
  var cards=document.createElement("div");cards.className="ext-cards";
  ci.extension.forEach(function(it){
    var c=it.carta,inv=it.invertida;
    var card=document.createElement("div");
    card.className="card-view ext-card"+(inv?" invertida":"");
    card.appendChild(imgCard(c));
    var nm=document.createElement("div");nm.className="card-name";nm.textContent=c.nombre+(inv?" (inv)":"");
    card.appendChild(nm);
    var pos=document.createElement("div");pos.className="ext-pos";pos.textContent=it.posicion;
    card.appendChild(pos);
    if(!window._ocultarReferencias){
      var tf=document.createElement("div");tf.className="card-field";tf.textContent=it.texto||txt(c,inv);
      card.appendChild(tf);
    }
    cards.appendChild(card);
  });
  box.appendChild(lbl);box.appendChild(desc);box.appendChild(cards);
  frag.appendChild(box);
  return frag;
}

function mostrarCompleto(cartas,dest,opts){
  opts=opts||{};
  window._lastPanelDest=dest;window._lastRenderOpts=opts;
  var el=document.getElementById(dest);_clear(el);
  var container=document.createElement("div");container.className="card-container";
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    var pos=it.posicion||(opts.posiciones?opts.posiciones[i]:null);
    var texto=it.texto||txt(c,inv);
    var comodinC=esComodin(c);
    var cv=document.createElement("div");
    cv.className="card-view"+(inv?" invertida":"")+(comodinC?" comodin-slot":"");
    if(comodinC) cv.appendChild(imgCard(c,it.comodinEstado||"reverso",it.comodinInvertido,i));
    else cv.appendChild(imgCard(c));
    var nm=document.createElement("div");nm.className="card-name";nm.textContent=c.nombre;cv.appendChild(nm);
    if(pos){var ps=document.createElement("div");ps.style.cssText="font-size:.72rem;color:var(--gold2);margin-top:2px";ps.textContent=pos;cv.appendChild(ps);}
    if(comodinC&&it.comodinEstado==="cerrado"&&!it.comodinInvertido&&!it.extensionResuelta){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic";cf.textContent=COMODIN_TEXTO_CERRADO;cv.appendChild(cf);
      var bwrap=document.createElement("div");bwrap.style.marginTop="6px";
      var btn=document.createElement("button");btn.className="btn btn-gold btn-sm";btn.textContent="\u2726 Abrir Extensión";btn.onclick=(function(jj){return function(){abrirExtension(jj)}})(i);
      bwrap.appendChild(btn);cv.appendChild(bwrap);
    }
    if(comodinC&&it.comodinInvertido&&it.comodinEstado!=="reverso"){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic";cf.textContent=COMODIN_INV_TEXT;cv.appendChild(cf);
    }
    if(comodinC&&it.comodinEstado==="reverso"){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic";cf.textContent=COMODIN_TEXTO_REVERSO;cv.appendChild(cf);
    }
    if(texto&&opts.mostrarTexto!==false&&!comodinC&&!window._ocultarReferencias){
      var cf=document.createElement("div");cf.className="card-field";cf.textContent=texto;cv.appendChild(cf);
    }
    container.appendChild(cv);
  });
  el.appendChild(container);
  el.appendChild(renderExtensionHTML(cartas));
  if(opts.mostrarQ!==false) el.appendChild(qHTML(cartas));
}

function mostrarCruz(cartas,dest,opts){
  opts=opts||{};
  window._lastPanelDest=dest;window._lastRenderOpts=opts;
  var cls=["cross-center","cross-left","cross-right","cross-top","cross-bottom"];
  var el=document.getElementById(dest);_clear(el);
  var container=document.createElement("div");container.className="cross-container";
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida,pos=it.posicion;
    var texto=it.texto||txt(c,inv);
    var comodinC=esComodin(c);
    var cv=document.createElement("div");
    cv.className="card-view"+(inv?" invertida":"")+(comodinC?" comodin-slot":"")+" "+cls[i];
    if(comodinC) cv.appendChild(imgCard(c,it.comodinEstado||"reverso",it.comodinInvertido,i));
    else cv.appendChild(imgCard(c));
    var nm=document.createElement("div");nm.className="card-name";nm.textContent=c.nombre;cv.appendChild(nm);
    if(pos){var ps=document.createElement("div");ps.style.cssText="font-size:.65rem;color:var(--gold2);margin-top:1px;line-height:1.2";ps.textContent=pos;cv.appendChild(ps);}
    if(comodinC&&it.comodinEstado==="cerrado"&&!it.comodinInvertido&&!it.extensionResuelta){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic;font-size:.7rem";cf.textContent=COMODIN_TEXTO_CERRADO;cv.appendChild(cf);
      var bwrap=document.createElement("div");bwrap.style.marginTop="6px";
      var btn=document.createElement("button");btn.className="btn btn-gold btn-sm";btn.textContent="\u2726 Abrir Extensión";btn.onclick=(function(jj){return function(){abrirExtension(jj)}})(i);
      bwrap.appendChild(btn);cv.appendChild(bwrap);
    }
    if(comodinC&&it.comodinInvertido&&it.comodinEstado!=="reverso"){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic;font-size:.7rem";cf.textContent=COMODIN_INV_TEXT;cv.appendChild(cf);
    }
    if(comodinC&&it.comodinEstado==="reverso"){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="color:var(--gold2);font-style:italic;font-size:.7rem";cf.textContent=COMODIN_TEXTO_REVERSO;cv.appendChild(cf);
    }
    if(texto&&opts.mostrarTexto!==false&&!comodinC&&!window._ocultarReferencias){
      var cf=document.createElement("div");cf.className="card-field";cf.style.cssText="font-size:.7rem";cf.textContent=texto;cv.appendChild(cf);
    }
    container.appendChild(cv);
  });
  el.appendChild(container);
  el.appendChild(renderExtensionHTML(cartas));
  if(opts.mostrarQ!==false) el.appendChild(qHTML(cartas));
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

function renderAV(carta,num,d,fnac,nombre,dd,texts){
  texts=texts||null;
  var res=document.getElementById("r-arcano-visitante");_clear(res);
  var rb=document.createElement("div");rb.className="result-box";
  var qb=document.createElement("div");qb.className="q-box";
  var ql=document.createElement("div");ql.className="q-label";ql.textContent="\u2726 TU ARCANO DEL DÍA";qb.appendChild(ql);
  var qi=document.createElement("div");qi.className="q-inner";
  qi.appendChild(imgCard(carta));
  var info=document.createElement("div");
  var qn=document.createElement("div");qn.className="q-name";
  qn.textContent=(num<=21?"XIIII".substring(0,num).replace(/^(X*)(I{0,3})(IV|V|VI{0,3})$/,"$1$2$3"):num===22?"0/XXII":num)+" \u2014 "+carta.nombre;
  info.appendChild(qn);qi.appendChild(info);qb.appendChild(qi);rb.appendChild(qb);
  var calc=document.createElement("div");calc.className="av-calc";
  var stC=document.createElement("strong");stC.textContent="Cálculo: ";calc.appendChild(stC);calc.appendChild(document.createTextNode(fnac.replace(/\//g,"+").replace(/\+/g," + ")+" + "+dd.replace(/\//g,"+").replace(/\+/g," + ")+" + "+normalizarNombre(nombre)+" = "));var strong=document.createElement("strong");strong.textContent=num;calc.appendChild(strong);rb.appendChild(calc);
  var qs=document.createElement("div");qs.className="av-questions";
  var qdefs=[["¿Qué vienes a mostrarme hoy?",texts?(texts.q1||"—"):(d?d.normal:"—")],["¿Qué patrón conocido me estás ayudando a no repetir hoy?",texts?(texts.q2||"—"):(d?d.sombra||d.normal:"—")],["¿Qué acción consciente me ayuda a escucharte?",texts?(texts.q3||"—"):(d?d.ayuda||d.normal:"—")]];
  qdefs.forEach(function(qd){
    var cr=document.createElement("div");cr.className="card-result";
    var pn=document.createElement("div");pn.className="pos-name";pn.textContent=qd[0];cr.appendChild(pn);
    var cm=document.createElement("div");cm.className="card-msg";cm.textContent=qd[1];cr.appendChild(cm);
    qs.appendChild(cr);
  });
  rb.appendChild(qs);
  var aiDiv=document.createElement("div");aiDiv.className="ai-interp";aiDiv.id="ai-interp-r-arcano-visitante";rb.appendChild(aiDiv);
  var cs=document.createElement("div");cs.className="cuaderno-section";
  var h4=document.createElement("h4");h4.style.cssText="color:var(--gold);margin:12px 0 6px;font-size:.9rem";h4.textContent="Cuaderno de reflexiones";cs.appendChild(h4);
  var fg1=document.createElement("div");fg1.className="form-group";
  var lbl1=document.createElement("label");lbl1.htmlFor="anotaciones-arcano-visitante";lbl1.textContent="Anotaciones";fg1.appendChild(lbl1);
  var cc=document.createElement("div");cc.className="char-counter";
  var ta=document.createElement("textarea");ta.id="anotaciones-arcano-visitante";ta.className="input-desc";ta.maxLength=300;ta.placeholder="Escribe lo que consideres...";
  ta.oninput=function(){var c=document.getElementById('cnt-av');if(c)c.textContent=this.length+'/300'};
  cc.appendChild(ta);var sp=document.createElement("span");sp.className="counter-text";sp.id="cnt-av";sp.textContent="0/300";cc.appendChild(sp);
  fg1.appendChild(cc);cs.appendChild(fg1);
  var fg2=document.createElement("div");fg2.className="form-group";
  var lbl2=document.createElement("label");lbl2.htmlFor="observado-arcano-visitante";lbl2.textContent="Lo observado";fg2.appendChild(lbl2);
  var ta2=document.createElement("textarea");ta2.id="observado-arcano-visitante";ta2.className="input-desc";ta2.maxLength=500;ta2.placeholder="Escribe después lo que has visto o vivido...";
  fg2.appendChild(ta2);cs.appendChild(fg2);rb.appendChild(cs);
  var disc=document.createElement("div");disc.className="av-disclaimer";disc.textContent="El tarot no predice el futuro. Muestra patrones. La decisión siempre es tuya.";rb.appendChild(disc);
  res.appendChild(rb);
  var bg=document.createElement("div");bg.className="btn-group mt-8";
  var bDefs=[["Descargar MD",function(){descargarAV('md')}],["Descargar HTML",function(){descargarAV('html')}],["Compartir",compartirAV],["Guardar",function(){guardarHist('El Arcano Visitante',window._ult,'','El Arcano Visitante')}]];
  bDefs.forEach(function(bd){var b=document.createElement("button");b.className="btn btn-outline btn-sm";b.textContent=bd[0];b.onclick=bd[1];bg.appendChild(b);});
  res.appendChild(bg);
}
