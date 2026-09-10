// State initialized by js/state.js (window._* backed by BATS.state)
// Card data & deck operations now in js/deck.js (window.BATS.deck)
// Numerology & quintessence now in js/numerology.js (window.BATS.numerology)
// Global vars (PALOS, BARAJA, z, ini, etc.) remain on window for backward compatibility

function toggleMenu(){
  document.getElementById("menu-overlay").classList.toggle("open");
  document.getElementById("menu-lateral").classList.toggle("open");
}
function cerrarMenu(){
  document.getElementById("menu-overlay").classList.remove("open");
  document.getElementById("menu-lateral").classList.remove("open");
}
function irA(id){
  cerrarMenu();
  if(typeof vozParar==="function"){try{vozParar()}catch(e){}}
  document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("active")});
  var el=document.getElementById("panel-"+id);
  if(el) el.classList.add("active");
  if(id==="historial") cargarHist();
  if(id==="ayuda") mostrarTodas();
  window.scrollTo({top:0,behavior:"smooth"});
}

function toast(msg,isError){
  var t=document.createElement("div");
  t.className="toast"+(isError?" error-toast":"");
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.remove()},2500);
}

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
// extraerExtensionDelMazo → moved to js/deck.js
// calcQuinta, textoQuinta, parsearQuinta → moved to js/numerology.js

function extensionMd(cartas){
  var ci=comodinEnCartas(cartas);
  if(!ci||!ci.extensionResuelta||!ci.extension) return "";
  var md="### ✦ Comodín ∞\n\n";
  ci.extension.forEach(function(it){
    md+="**"+it.posicion+":** "+it.carta.nombre+(it.invertida?" (invertida)":"")+"\n\n";
    md+=(it.texto||txt(it.carta,it.invertida)||"\u2014")+"\n\n";
  });
  return md;
}
function extensionHtml(cartas){
  var ci=comodinEnCartas(cartas);
  if(!ci||!ci.extensionResuelta||!ci.extension) return "";
  var h='<div style="margin:16px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;text-align:center;max-width:620px"><div style="color:#f0d080;font-weight:600;margin-bottom:8px">✦ COMODÍN ∞ → EXTENSIÓN BATS</div>';
  ci.extension.forEach(function(it){
    h+='<div style="margin:8px 0"><strong style="color:#f0d080;font-size:.75rem">'+escHTML(it.posicion)+':</strong> '+escHTML(it.carta.nombre)+(it.invertida?" (inv)":"")+'</div>';
    h+='<div style="color:#b8a898;font-size:.8rem">'+escHTML(it.texto||txt(it.carta,it.invertida)||"\u2014")+'</div>';
  });
  h+='</div>';
  return h;
}
function extensionVoz(cartas){
  var ci=comodinEnCartas(cartas);
  if(!ci||!ci.extensionResuelta||!ci.extension) return "";
  var parts=[];
  parts.push("Comodín extendido");
  ci.extension.forEach(function(it){
    parts.push(it.posicion+": "+it.carta.nombre+(it.invertida?" invertida":"")+". "+(it.texto||txt(it.carta,it.invertida)||""));
  });
  return parts.join(". ");
}
function reconstruirCartasHist(hr){
  return hr.cartas.map(function(it){
    var obj={carta:{nombre:it.nombre,img:it.img,valor:it.valor,tipo:it.tipo,nucleo:it.nucleo,letras:it.letras},invertida:it.invertida,texto:it.texto,posicion:it.posicion};
    if(it.comodin){
      obj.comodinInvertido=it.comodinInvertido;obj.comodinEstado=it.comodinEstado;
      if(it.extensionResuelta&&it.extension){
        obj.extensionResuelta=true;
        obj.extension=it.extension.map(function(ex){return{carta:{nombre:ex.nombre,img:ex.img,valor:ex.valor,tipo:ex.tipo,nucleo:ex.nucleo,letras:ex.letras},invertida:ex.invertida,posicion:ex.posicion,texto:ex.texto};});
      }
    }
    return obj;
  });
}
var PROMPT_AI="Eres un intérprete profesional de tarot Rider-Waite-Smith. Recibirás una tirada con posiciones ya definidas y sus cartas asignadas, incluyendo la quintaesencia ya calculada.\nPara cada posición:\n* Describe brevemente la imagen simbólica de la carta (RWS).\n* Interpreta su significado filtrado por el sentido de esa posición específica.\nAl final, interpreta la quintaesencia como síntesis arquetípica de fondo (nunca como mandato de acción ni predicción).\nNo inventes datos biográficos ni asumas circunstancias no proporcionadas. Si falta información necesaria, indícala explícitamente en vez de suponerla.";
function comodinPendiente(cartas){
  var pend=false;
  cartas.forEach(function(it){if(esComodin(it.carta)&&!it.extensionResuelta) pend=true;});
  return pend;
}
function comodinResuelto(cartas){
  var r=null;
  cartas.forEach(function(it){if(esComodin(it.carta)&&it.extensionResuelta&&it.extension) r=it;});
  return r;
}
function cartasParaAI(cartas){
  var ci=comodinResuelto(cartas);
  if(!ci) return cartas;
  var nueva=[];
  cartas.forEach(function(it){
    if(esComodin(it.carta)){
      var laSalida=ci.extension[2];
      nueva.push({carta:laSalida.carta,invertida:laSalida.invertida,posicion:it.posicion,texto:laSalida.texto||txt(laSalida.carta,laSalida.invertida)});
    } else {
      nueva.push(it);
    }
  });
  nueva._interp=cartas._interp; nueva._ia=cartas._ia; nueva._qtext=cartas._qtext;
  nueva._q=calcQuinta(nueva);
  return nueva;
}
function cartasExtensionParaAI(cartas){
  var ci=comodinResuelto(cartas);
  if(!ci) return null;
  return ci.extension.map(function(it,i){
    return {carta:it.carta,invertida:it.invertida,posicion:it.posicion,texto:it.texto};
  });
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

function guardarHist(tipo,cartas,descripcion,titulo){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var sit=document.getElementById('situacion-'+window._lastPanel)?.value||'';
  var acc=document.getElementById('accion-'+window._lastPanel)?.value||'';
  var tipo_rel=document.getElementById('tipo-'+window._lastPanel)?.value||'';
  var anot=document.getElementById('anotaciones-'+window._lastPanel)?.value||'';
  var obs=document.getElementById('observado-'+window._lastPanel)?.value||'';
  h.unshift({fecha:new Date().toISOString(),tipo:tipo,descripcion:descripcion||"",titulo:titulo||"",situacion:sit,accion:acc,tipo_rel:tipo_rel,anotaciones:anot,observado:obs,_interp:cartas._interp||"",_ia:cartas._ia||"",_qtext:cartas._qtext||"",cartas:cartas.map(function(it){
    var obj={nombre:it.carta.nombre,img:it.carta.img,valor:it.carta.valor,tipo:it.carta.tipo,nucleo:it.carta.nucleo,letras:it.carta.letras,invertida:it.invertida,posicion:it.posicion,texto:it.texto||txt(it.carta,it.invertida)};
    if(esComodin(it.carta)){
      obj.comodin=true;obj.comodinInvertido=it.comodinInvertido;obj.comodinEstado=it.comodinEstado;
      if(it.extensionResuelta&&it.extension){
        obj.extensionResuelta=true;
        obj.extension=it.extension.map(function(ex){return {nombre:ex.carta.nombre,img:ex.carta.img,valor:ex.carta.valor,tipo:ex.carta.tipo,nucleo:ex.carta.nucleo,letras:ex.carta.letras,invertida:ex.invertida,posicion:ex.posicion,texto:ex.texto};});
      }
    }
    return obj;
  }),resumen:cartas.map(function(it){return it.carta.nombre+(it.invertida?"(inv)":"")}).join(", ")});
  if(h.length>50) h=h.slice(0,50);
  lsSet("bats-hist",JSON.stringify(h));
  toast("\u2713 Guardado en historial");
}

function exportarHist(){
  var h=lsGet("bats-hist");
  if(!h||h==="[]"){toast("No hay historial para exportar",true);return}
  var f=new Date(),fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate());
  downloadBlob(h,"bats-historial-"+fn+".json","application/json");
  toast("Historial exportado");
}
function importarHist(){
  var inp=document.createElement("input");inp.type="file";inp.accept=".json";
  inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result);
        if(!Array.isArray(data)){toast("Formato inv\u00e1lido",true);return}
        if(!confirm("\u00bfImportar "+data.length+" lectura(s)? Se a\u00f1adir\u00e1n al historial actual."))return;
        var h=JSON.parse(lsGet("bats-hist")||"[]");
        data.forEach(function(r){h.unshift(r)});
        if(h.length>100) h=h.slice(0,100);
        lsSet("bats-hist",JSON.stringify(h));
        cargarHist();
        toast("\u2713 "+data.length+" lectura(s) importadas");
      }catch(e){toast("Archivo inv\u00e1lido",true)}
    };
    reader.readAsText(file);
  };
  inp.click();
}

function isCap(){return !!(window.Capacitor&&Capacitor.Plugins)}
function downloadBlob(content,filename,type){
  if(isCap()&&Capacitor.Plugins.Filesystem&&Capacitor.Plugins.Share){
    var fs=Capacitor.Plugins.Filesystem;
    var sh=Capacitor.Plugins.Share;
    fs.writeFile({path:filename,data:content,directory:"CACHE",encoding:"utf8"}).then(function(r){
      return fs.getUri({path:filename,directory:"CACHE"});
    }).then(function(r){
      sh.share({title:filename,text:content,files:[r.uri]}).catch(function(){toast("Guardado en caché: "+filename)});
    }).catch(function(){toast("No se pudo guardar",true)});
  }else{
    var b=new Blob([content],{type:type+";charset=utf-8"});
    var u=URL.createObjectURL(b);
    var a=document.createElement("a");a.href=u;a.download=filename;
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(u);
  }
}
function slugify(s){
  return s.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s-]/g,'').replace(/\s+/g,'_').replace(/-+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'')||"tirada";
}
function btnGuardar(tipo,cartas){
  var btn=document.createElement("button");btn.className="btn btn-outline btn-sm";btn.textContent="Guardar en historial";
  btn.onclick=function(){guardarHist(tipo,window._ult,document.getElementById('desc-'+window._lastPanel)&&document.getElementById('desc-'+window._lastPanel).value||'',document.getElementById('titulo-'+window._lastPanel)&&document.getElementById('titulo-'+window._lastPanel).value||'');return false};
  return btn;
}
function btnMD(titulo,panelId){
  var btn=document.createElement("button");btn.className="btn btn-outline btn-sm";btn.textContent="Descargar MD";
  btn.onclick=function(){descargarMD(titulo,window._ult,document.getElementById('desc-'+panelId)&&document.getElementById('desc-'+panelId).value||'',document.getElementById('situacion-'+panelId)&&document.getElementById('situacion-'+panelId).value||'',document.getElementById('accion-'+panelId)&&document.getElementById('accion-'+panelId).value||'',document.getElementById('tipo-'+panelId)&&document.getElementById('tipo-'+panelId).value||'',document.getElementById('anotaciones-'+panelId)&&document.getElementById('anotaciones-'+panelId).value||'',document.getElementById('observado-'+panelId)&&document.getElementById('observado-'+panelId).value||'')};
  return btn;
}
function btnHTML(titulo,panelId){
  var btn=document.createElement("button");btn.className="btn btn-outline btn-sm";btn.textContent="Descargar HTML";
  btn.onclick=function(){descargarHTML(titulo,window._ult,document.getElementById('desc-'+panelId)&&document.getElementById('desc-'+panelId).value||'',document.getElementById('situacion-'+panelId)&&document.getElementById('situacion-'+panelId).value||'',document.getElementById('accion-'+panelId)&&document.getElementById('accion-'+panelId).value||'',document.getElementById('tipo-'+panelId)&&document.getElementById('tipo-'+panelId).value||'',document.getElementById('anotaciones-'+panelId)&&document.getElementById('anotaciones-'+panelId).value||'',document.getElementById('observado-'+panelId)&&document.getElementById('observado-'+panelId).value||'')};
  return btn;
}
function btnAI(titulo,panelId){
  var btn=document.createElement("button");btn.className="btn btn-outline btn-sm";btn.textContent="Descargar IA";
  btn.onclick=function(){descargarAI(titulo,window._ult)};
  return btn;
}
function btnCompartir(titulo){
  var btn=document.createElement("button");btn.className="btn btn-outline btn-sm";btn.textContent="Compartir";
  btn.onclick=function(){compartirTirada()};
  return btn;
}
function cuadernoHTML(panelId){
  var cntId='cnt-'+panelId;
  var wrap=document.createElement("div");wrap.className="cuaderno-section";
  var h4=document.createElement("h4");h4.style.cssText="color:var(--gold);margin:0 0 8px;font-size:.9rem";h4.textContent="Cuaderno de reflexiones";wrap.appendChild(h4);
  var fg1=document.createElement("div");fg1.className="form-group";
  var lbl1=document.createElement("label");lbl1.htmlFor="anotaciones-"+panelId;lbl1.textContent="Anotaciones";fg1.appendChild(lbl1);
  var cc=document.createElement("div");cc.className="char-counter";
  var ta=document.createElement("textarea");ta.id="anotaciones-"+panelId;ta.className="input-desc";ta.maxLength=300;ta.placeholder="Escribe lo que consideres sobre esta tirada...";
  ta.oninput=function(){updateCounter(this,cntId)};
  cc.appendChild(ta);
  var sp=document.createElement("span");sp.className="counter-text";sp.id=cntId;sp.textContent="0/300";cc.appendChild(sp);
  fg1.appendChild(cc);wrap.appendChild(fg1);
  var fg2=document.createElement("div");fg2.className="form-group";
  var lbl2=document.createElement("label");lbl2.htmlFor="observado-"+panelId;lbl2.textContent="Lo observado";fg2.appendChild(lbl2);
  var ta2=document.createElement("textarea");ta2.id="observado-"+panelId;ta2.className="input-desc";ta2.maxLength=500;ta2.placeholder="Escribe después lo que has visto o vivido respecto a lo que entendiste...";
  fg2.appendChild(ta2);wrap.appendChild(fg2);
  return wrap;
}
function ponerBotones(dest,titulo,panelId){
  var el=document.getElementById(dest);
  el.appendChild(cuadernoHTML(panelId));
  var bg=document.createElement("div");bg.className="btn-group mt-8";
  bg.appendChild(btnMD(titulo,panelId));
  bg.appendChild(btnHTML(titulo,panelId));
  bg.appendChild(btnAI(titulo,panelId));
  bg.appendChild(btnCompartir(titulo));
  bg.appendChild(btnGuardar(titulo));
  el.appendChild(bg);
}

var BATS_BASE="https://sugusdeborbon-glitch.github.io/bats-tarot/";
function descargarMD(titulo,cartas,descripcion,situacion,accion,tipo,anotaciones,observado){
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate())+"_"+z(f.getHours())+z(f.getMinutes());
  var slug=slugify(titulo);
  var md="# "+titulo+"\n\n_Fecha: "+fs+"_\n\n";
  if(descripcion) md+="*"+descripcion+"*\n\n";
  if(situacion) md+="**Situación:** "+situacion+"\n\n";
  if(tipo) md+="**Tipo de relación:** "+tipo+"\n\n";
  cartas.forEach(function(it){
    var c=it.carta,inv=it.invertida,pos=it.posicion;
    md+="### "+(pos?pos+": ":"")+c.nombre+(inv?" (invertida)":"")+"\n\n";
    md+=(it.texto||txt(c,inv)||"\u2014")+"\n\n";
  });
  md+=extensionMd(cartas);
  var q=calcQuinta(cartas);
  if(q){var p=parsearQuinta(cartas._qtext||textoQuinta(q.nombre)||txt(q,false));md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n";if(p.lectura) md+=p.lectura+"\n\n";if(p.consejo) md+="**Consejo de acción BATS:** "+p.consejo+"\n\n";if(p.palabraClave) md+="**Palabra clave:** "+p.palabraClave+"\n\n";if(p.antipatron) md+="**Antipatrón:** "+p.antipatron+"\n\n";}
  if(cartas._interp) md+="### ✦ Interpretación\n\n"+cartas._interp+"\n\n";
  if(cartas._ia) md+="_IA que ha asistido la interpretación: "+cartas._ia+"_\n\n";
  if(accion) md+="**Acción recomendada:** "+accion+"\n\n";
  if(anotaciones) md+="**Anotaciones:** "+anotaciones+"\n\n";
  if(observado) md+="**Lo observado:** "+observado+"\n\n";
  md+="_Generado por BATS Tarot_";
  downloadBlob(md,"bats-"+slug+"-"+fn+".md","text/markdown");
}
function descargarHTML(titulo,cartas,descripcion,situacion,accion,tipo,anotaciones,observado){
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate())+"_"+z(f.getHours())+z(f.getMinutes());
  var slug=slugify(titulo);
  var esCruz=cartas.length===5;
  var clsCruz=["cross-center","cross-left","cross-right","cross-top","cross-bottom"];
  var cardsHTML="";
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida,pos=it.posicion;
    var txts=it.texto||txt(c,inv)||"\u2014";
    if(esCruz) cardsHTML+='<div class="card '+(inv?"inv ":"")+clsCruz[i]+'">';
    else cardsHTML+='<div class="card'+(inv?" inv":"")+'">';
    cardsHTML+='<img src="'+BATS_BASE+c.img+'" alt="'+escHTML(c.nombre)+'">';
    cardsHTML+='<div class="cn">'+escHTML(c.nombre)+(inv?' <small>(inv)</small>':'')+'</div>';
    if(pos) cardsHTML+='<div class="cp">'+pos+'</div>';
    cardsHTML+='<div class="ct">'+txts+'</div></div>';
  });
  var q=calcQuinta(cartas);
  var qH="";
  if(q){
    var p=parsearQuinta(cartas._qtext||textoQuinta(q.nombre)||txt(q,false));
    qH='<div class="q"><div class="ql">✦ QUINTAESENCIA: '+escHTML(q.nombre)+'</div>';
    qH+='<img src="'+BATS_BASE+q.img+'" alt="'+escHTML(q.nombre)+'">';
    qH+='<div class="cn">'+escHTML(q.nombre)+'</div>';
    if(p.lectura) qH+='<div class="ct">'+p.lectura+'</div>';
    if(p.consejo) qH+='<div class="ct" style="margin-top:6px"><strong style="color:#f0d080;font-size:.75rem">CONSEJO DE ACCIÓN BATS:</strong> '+p.consejo+'</div>';
    if(p.palabraClave) qH+='<div class="ct" style="margin-top:4px"><strong style="color:#f0d080;font-size:.75rem">PALABRA CLAVE:</strong> '+p.palabraClave+'</div>';
    if(p.antipatron) qH+='<div class="ct" style="margin-top:4px"><strong style="color:#f0d080;font-size:.75rem">ANTIPATRÓN:</strong> '+p.antipatron+'</div>';
    qH+='</div>';
  }
  var wrap=esCruz?"cross-container":"cards";
  var extraCSS=esCruz?".cross-container{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;gap:12px;max-width:520px;margin:16px auto;justify-items:center;align-items:start}.cross-center{grid-column:2;grid-row:2}.cross-left{grid-column:1;grid-row:2}.cross-right{grid-column:3;grid-row:2}.cross-top{grid-column:2;grid-row:1}.cross-bottom{grid-column:2;grid-row:3}.cross-container .card{width:140px}":"";
  var interpH=cartas._interp?'<div class="interp"><div class="ql">✦ INTERPRETACIÓN</div><div class="ct">'+interpParaHTML(cartas._interp)+'</div></div>':"";
  var iaH=cartas._ia?'<p class="ia">IA que ha asistido la interpretaci\u00f3n: '+escHTML(cartas._ia)+'</p>':"";
  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+escHTML(titulo)+' - BATS</title>';
  html+='<style>body{font-family:sans-serif;background:#0d0a13;color:#e8dcc8;padding:20px;max-width:800px;margin:0 auto}h1{color:#d4a847}.cards{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:16px 0}.card{width:160px;text-align:center;background:#1a1225;border-radius:8px;padding:8px;border:1px solid #2a1a3e}.card.inv img,.card.invertida img{transform:rotate(180deg)}.card img,.q img{width:100%;border-radius:6px}.cn{color:#d4a847;font-weight:600;margin-top:4px;font-size:.9rem}.cp{color:#f0d080;font-size:.75rem;margin-top:2px}.ct{color:#b8a898;font-size:.8rem;margin-top:4px;text-align:left}.q{margin:20px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;text-align:center;max-width:320px}.ql{color:#f0d080;font-weight:600;margin-bottom:8px}.q img{width:80px}.interp{margin:20px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;max-width:620px;text-align:left}.interp .ct{white-space:pre-wrap}.ia{color:#8a7f6a;font-size:.72rem;text-align:center;margin:4px auto 0;max-width:620px}.foot{color:#666;font-size:.8rem;text-align:center;margin-top:24px}'+extraCSS+'</style></head><body>';
  html+='<h1>'+escHTML(titulo)+'</h1><p style="color:#b8a898"><em>'+escHTML(fs)+'</em></p>';
  if(descripcion) html+='<p style="font-style:italic;color:#b8a898;margin-bottom:12px">'+escHTML(descripcion)+'</p>';
  if(tipo) html+='<p style="font-style:italic;color:#f0d080;margin-bottom:12px"><strong>Tipo de relación:</strong> '+escHTML(tipo)+'</p>';
  if(situacion) html+='<p style="font-style:italic;color:#f0d080;margin-bottom:12px"><strong>Situación:</strong> '+escHTML(situacion)+'</p>';
  html+='<div class="'+wrap+'">'+cardsHTML+'</div>'+extensionHtml(cartas)+qH+interpH+iaH;
  if(accion) html+='<p style="font-style:italic;color:#b8a898;margin-top:12px"><strong>Acción recomendada:</strong> '+escHTML(accion)+'</p>';
  if(anotaciones) html+='<p style="color:#b8a898;margin-top:8px"><strong>Anotaciones:</strong> '+escHTML(anotaciones)+'</p>';
  if(observado) html+='<p style="color:#b8a898;margin-top:8px"><strong>Lo observado:</strong> '+escHTML(observado)+'</p>';
  html+='<p class="foot">Generado por BATS Tarot</p></body></html>';
  downloadBlob(html,"bats-"+slug+"-"+fn+".html","text/html");
}
function descargarAI(titulo,cartas){
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate())+"_"+z(f.getHours())+z(f.getMinutes());
  var slug=slugify(titulo);
  var panelId=window._lastPanel;
  var desc=document.getElementById('desc-'+panelId)?.value||'';
  var sit=document.getElementById('situacion-'+panelId)?.value||'';
  var acc=document.getElementById('accion-'+panelId)?.value||'';
  var tipo=document.getElementById('tipo-'+panelId)?.value||'';
  var anot=document.getElementById('anotaciones-'+panelId)?.value||'';
  var obs=document.getElementById('observado-'+panelId)?.value||'';
  var md=PROMPT_AI+"\n\n";
  md+="Tirada: "+titulo+"\nFecha: "+fs+"\n";
  if(desc) md+="Descripción: "+desc+"\n";
  if(sit) md+="Situación: "+sit+"\n";
  if(tipo) md+="Tipo de relación: "+tipo+"\n";
  md+="\nPosiciones y cartas:\n";
  cartas.forEach(function(it,i){
    md+=(i+1)+". "+(it.posicion||"")+": "+it.carta.nombre+(it.invertida?" (invertida)":"")+"\n";
  });
  var ci=comodinEnCartas(cartas);
  if(ci&&ci.extensionResuelta&&ci.extension){
    md+="\nComodín extendido:\n";
    ci.extension.forEach(function(it){md+="  "+it.posicion+": "+it.carta.nombre+(it.invertida?" (invertida)":"")+"\n";});
  }
  var q=calcQuinta(cartas);
  if(q) md+="\nQuintaesencia: "+q.nombre+"\n";
  if(acc) md+="\nAcción recomendada: "+acc+"\n";
  if(anot) md+="\nAnotaciones: "+anot+"\n";
  if(obs) md+="\nLo observado: "+obs+"\n";
  downloadBlob(md,"ia-"+slug+"-"+fn+".md","text/markdown");
}

function cargarHist(){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var c=document.getElementById("r-historial");_clear(c);
  var notice=document.createElement("div");notice.className="priv-notice";notice.textContent="Las lecturas se guardan solo en este navegador y no se sincronizan. Para conservarlas o trasladarlas a otro dispositivo, usa Exportar.";
  c.appendChild(notice);
  var controls=document.createElement("div");controls.className="hist-controls";
  var srow=document.createElement("div");srow.className="hist-search-row";
  var inp=document.createElement("input");inp.type="text";inp.id="hist-search";inp.placeholder="Palabra clave...";
  inp.onkeydown=function(ev){if(ev.key==='Enter')buscarHist()};
  srow.appendChild(inp);
  var btnB=document.createElement("button");btnB.className="btn btn-outline btn-sm";btnB.textContent="Buscar";btnB.onclick=buscarHist;srow.appendChild(btnB);
  var btnL=document.createElement("button");btnL.className="btn btn-outline btn-sm";btnL.textContent="Limpiar";btnL.onclick=limpiarFiltros;srow.appendChild(btnL);
  controls.appendChild(srow);
  var frow=document.createElement("div");frow.className="hist-filters-row";
  var sel=document.createElement("select");sel.id="hist-tipo";
  ["","Cruz Diaria","Tirada de la relación","BATS Laboral","El Aprendizaje","Tirada Personalizada","El Arcano Visitante"].forEach(function(v){
    var o=document.createElement("option");o.value=v;o.textContent=v||"Todos los tipos";sel.appendChild(o);
  });
  frow.appendChild(sel);
  var lblD=document.createElement("label");lblD.textContent="Desde: ";var inpD=document.createElement("input");inpD.type="date";inpD.id="hist-desde";lblD.appendChild(inpD);frow.appendChild(lblD);
  var lblH=document.createElement("label");lblH.textContent="Hasta: ";var inpH=document.createElement("input");inpH.type="date";inpH.id="hist-hasta";lblH.appendChild(inpH);frow.appendChild(lblH);
  controls.appendChild(frow);c.appendChild(controls);
  var listado=document.createElement("div");listado.id="hist-listado";c.appendChild(listado);
  renderHistCards(h);
}
function renderHistCards(arr,fullArr){
  fullArr=fullArr||arr;
  var c=document.getElementById("hist-listado");
  if(!c) return;
  _clear(c);
  if(!arr.length){var p=document.createElement("p");p.className="subtle";p.textContent="No hay lecturas guardadas.";c.appendChild(p);return}
  var grid=document.createElement("div");grid.className="historial-grid";
  arr.forEach(function(hr){
    var origIdx=fullArr.indexOf(hr);
    var d=new Date(hr.fecha),fs=d.toLocaleDateString("es-ES",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    var card=document.createElement("div");card.className="historial-card";card.onclick=(function(jj){return function(){verHist(jj)}})(origIdx);
    if(hr.cartas&&hr.cartas.length){
      var prev=document.createElement("div");prev.className="hc-preview";
      hr.cartas.slice(0,4).forEach(function(ca){
        var im=document.createElement("img");im.src=ca.img;im.alt="";im.loading="lazy";prev.appendChild(im);
      });
      card.appendChild(prev);
    }
    var fd=document.createElement("div");fd.className="h-fecha";fd.textContent=fs;card.appendChild(fd);
    var ft=document.createElement("div");ft.className="h-tipo";
    ft.appendChild(document.createTextNode(hr.titulo||hr.tipo));
    if(hr.descripcion){var sp=document.createElement("span");sp.style.cssText="font-weight:normal;font-size:.75rem;opacity:.7";sp.textContent=" \u00B7 "+hr.descripcion;ft.appendChild(sp);}
    card.appendChild(ft);
    var fc=document.createElement("div");fc.className="h-cartas";fc.textContent=hr.resumen;card.appendChild(fc);
    grid.appendChild(card);
  });
  c.appendChild(grid);
}
function buscarHist(){
  var q=document.getElementById('hist-search')?.value?.toLowerCase().trim()||'';
  var tipo=document.getElementById('hist-tipo')?.value||'';
  var desde=document.getElementById('hist-desde')?.value||'';
  var hasta=document.getElementById('hist-hasta')?.value||'';
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  if(!h.length){renderHistCards([]);return}
  var filtered=h.filter(function(hr){
    if(tipo && (hr.titulo||hr.tipo)!==tipo) return false;
    if(desde||hasta){
      var d=new Date(hr.fecha);
      if(desde && d<new Date(desde+'T00:00:00')) return false;
      if(hasta && d>new Date(hasta+'T23:59:59')) return false;
    }
    if(q){
      var text=(hr.titulo||hr.tipo+" "+hr.descripcion+" "+hr.resumen+" "+(hr.situacion||"")+" "+(hr.accion||"")+" "+(hr.tipo_rel||"")+" "+(hr.anotaciones||"")+" "+(hr.observado||"")).toLowerCase();
      var d2=new Date(hr.fecha),fs=d2.toLocaleDateString("es-ES",{year:"numeric",month:"short",day:"numeric"});
      return text.indexOf(q)>=0||fs.indexOf(q)>=0;
    }
    return true;
  });
  renderHistCards(filtered,h);
}
function limpiarFiltros(){
  ['hist-search','hist-tipo','hist-desde','hist-hasta'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.value='';
  });
  buscarHist();
}
function verHist(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=reconstruirCartasHist(hr);
  cartas._interp=hr._interp||"";
  cartas._ia=hr._ia||"";
  cartas._qtext=hr._qtext||"";
  var root=document.getElementById("r-historial");_clear(root);
  var box=document.createElement("div");box.className="result-box";
  var tit=document.createElement("h3");tit.style.cssText="color:var(--gold);margin-bottom:6px";tit.textContent=hr.titulo||hr.tipo;box.appendChild(tit);
  var fs=new Date(hr.fecha).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fp=document.createElement("p");fp.style.cssText="color:var(--text-muted);margin-bottom:8px;font-size:.85rem";fp.textContent=fs;box.appendChild(fp);
  if(hr.descripcion){var dp=document.createElement("p");dp.style.cssText="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem";dp.textContent=(hr.titulo?hr.tipo+": ":"")+hr.descripcion;box.appendChild(dp);}
  if(hr.tipo_rel){var tp=document.createElement("p");tp.style.cssText="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem";var st=document.createElement("strong");st.textContent="Tipo de relaci\u00f3n: ";tp.appendChild(st);tp.appendChild(document.createTextNode(hr.tipo_rel));box.appendChild(tp);}
  if(hr.situacion){var sp=document.createElement("p");sp.style.cssText="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem";var st=document.createElement("strong");st.textContent="Situaci\u00f3n: ";sp.appendChild(st);sp.appendChild(document.createTextNode(hr.situacion));box.appendChild(sp);}
  if(hr.accion){var ap=document.createElement("p");ap.style.cssText="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem";var st=document.createElement("strong");st.textContent="Acci\u00f3n: ";ap.appendChild(st);ap.appendChild(document.createTextNode(hr.accion));box.appendChild(ap);}
  if(hr.cartas[0]&&hr.cartas[0].posicion){
    cartas.forEach(function(it){
      var c=it.carta;
      var cr=document.createElement("div");cr.className="card-result";
      var pn=document.createElement("div");pn.className="pos-name";pn.textContent=it.posicion||"";cr.appendChild(pn);
      var cn=document.createElement("div");cn.className="card-name-r";cn.textContent=c.nombre+(it.invertida?" (inv)":"");cr.appendChild(cn);
      var cm=document.createElement("div");cm.className="card-msg";cm.textContent=it.texto||"\u2014";cr.appendChild(cm);
      box.appendChild(cr);
    });
  }else{
    var cc=document.createElement("div");cc.className="card-container";
    cartas.forEach(function(it){
      var c=it.carta,inv=it.invertida?" invertida":"";
      var cv=document.createElement("div");cv.className="card-view"+inv;
      cv.appendChild(imgCard(c,esComodin(c)?it.comodinEstado:undefined,esComodin(c)?it.comodinInvertido:undefined));
      var nm=document.createElement("div");nm.className="card-name";nm.textContent=c.nombre;
      if(it.invertida){var iv=document.createElement("span");iv.style.cssText="color:var(--danger);font-size:.7rem";iv.textContent=" (inv)";nm.appendChild(iv);}
      cv.appendChild(nm);
      if(it.texto){var tf=document.createElement("div");tf.className="card-field";tf.textContent=it.texto;cv.appendChild(tf);}
      cc.appendChild(cv);
    });
    box.appendChild(cc);
  }
  box.appendChild(_htmlToDom(extensionHtml(cartas)));
  box.appendChild(qHTML(cartas));
  if(hr._interp){
    var itd=document.createElement("div");itd.className="ai-interp-texto";itd.style.marginTop="10px";
    itd.innerHTML=interpParaHTML(hr._interp);box.appendChild(itd);
  }else{
    var np=document.createElement("p");np.style.cssText="font-style:italic;color:var(--text-muted);margin-top:10px;font-size:.85rem";np.textContent="Lectura sin interpretaci\u00f3n guardada.";box.appendChild(np);
  }
  if(hr._ia){var iad=document.createElement("div");iad.className="ai-interp-ia";iad.textContent="IA que ha asistido la interpretaci\u00f3n: "+hr._ia;box.appendChild(iad);}
  if(typeof vozSoporte==="function"&&vozSoporte()){
    box.appendChild(vozBarDOM("hist-"+i));
    VOZ.textos["hist-"+i]=vozTextoDe(cartas,{guion:/arcano/i.test(hr.tipo||"")?"arcano":null});
  }
  var cs=document.createElement("div");cs.className="cuaderno-section";
  var h4=document.createElement("h4");h4.style.cssText="color:var(--gold);margin:12px 0 6px;font-size:.9rem";h4.textContent="Cuaderno de reflexiones";cs.appendChild(h4);
  var fg1=document.createElement("div");fg1.className="form-group";
  var lbl1=document.createElement("label");lbl1.htmlFor="c-anot-"+i;lbl1.textContent="Anotaciones";fg1.appendChild(lbl1);
  var cc2=document.createElement("div");cc2.className="char-counter";
  var ta=document.createElement("textarea");ta.id="c-anot-"+i;ta.className="input-desc";ta.maxLength=300;ta.placeholder="Escribe lo que consideres sobre esta tirada...";
  ta.value=hr.anotaciones||"";ta.oninput=function(){var el=document.getElementById('cnt-'+i);if(el)el.textContent=this.length+'/300'};
  cc2.appendChild(ta);
  var spn=document.createElement("span");spn.className="counter-text";spn.id="cnt-"+i;spn.textContent=(hr.anotaciones||"").length+'/300';cc2.appendChild(spn);
  fg1.appendChild(cc2);cs.appendChild(fg1);
  var fg2=document.createElement("div");fg2.className="form-group";
  var lbl2=document.createElement("label");lbl2.htmlFor="c-obs-"+i;lbl2.textContent="Lo observado";fg2.appendChild(lbl2);
  var ta2=document.createElement("textarea");ta2.id="c-obs-"+i;ta2.className="input-desc";ta2.maxLength=500;ta2.placeholder="Escribe después lo que has visto o vivido respecto a lo que entendiste...";
  ta2.value=hr.observado||"";fg2.appendChild(ta2);cs.appendChild(fg2);
  var bg2=document.createElement("div");bg2.className="btn-group";
  var btnSave=document.createElement("button");btnSave.className="btn btn-outline btn-sm";btnSave.textContent="Guardar cambios";btnSave.onclick=(function(jj){return function(){guardarCuaderno(jj)}})(i);
  bg2.appendChild(btnSave);cs.appendChild(bg2);box.appendChild(cs);
  var bg3=document.createElement("div");bg3.className="btn-group mt-8";
  var bDefs=[["Compartir",function(){compartirHist(i)}],["MD",function(){descargarHistMD(i)}],["HTML",function(){descargarHistHTML(i)}],["IA",function(){descargarHistAI(i)}]];
  bDefs.forEach(function(d){var b=document.createElement("button");b.className="btn btn-outline btn-sm";b.textContent=d[0];b.onclick=d[1];bg3.appendChild(b);});
  var bDel=document.createElement("button");bDel.className="btn btn-danger btn-sm";bDel.textContent="Eliminar";bDel.onclick=(function(jj){return function(){eliminarHist(jj)}})(i);bg3.appendChild(bDel);
  var bBack=document.createElement("button");bBack.className="btn btn-outline btn-sm";bBack.textContent="\u2190 Volver";bBack.onclick=cargarHist;bg3.appendChild(bBack);
  box.appendChild(bg3);root.appendChild(box);
  if(typeof vozSoporte==="function"&&vozSoporte()){
    var sel=document.querySelector("#r-historial .voz-select");
    if(sel) vozPoblarSelect(sel);
    vozActualizarBarras();
  }
}
function guardarCuaderno(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  if(!h[i])return;
  var anot=document.getElementById('c-anot-'+i)?.value||'';
  var obs=document.getElementById('c-obs-'+i)?.value||'';
  h[i].anotaciones=anot;
  h[i].observado=obs;
  lsSet("bats-hist",JSON.stringify(h));
  toast("Cuaderno actualizado");
}
function updateCounter(el,id){
  var cnt=document.getElementById(id);
  if(cnt)cnt.textContent=el.value.length+'/300';
}
function compartirHist(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas;
  var fs=new Date(hr.fecha).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var md="# "+(hr.titulo||hr.tipo)+"\n\n_Fecha: "+fs+"_";
  if(hr.descripcion)md+="\n\n*"+hr.descripcion+"*";
  if(hr.tipo_rel)md+="\n\n**Tipo de relación:** "+hr.tipo_rel;
  if(hr.situacion)md+="\n\n**Situación:** "+hr.situacion;
  md+="\n\n";
  cartas.forEach(function(it,idx){
    md+="### "+(it.posicion?it.posicion+": ":"")+it.nombre+(it.invertida?" (invertida)":"")+"\n\n"+(it.texto||"—")+"\n\n";
    if(it.comodin&&it.extensionResuelta&&it.extension){
      md+="### ✦ Comodín ∞ → Extensión\n\n";
      it.extension.forEach(function(ex){md+="**"+ex.posicion+":** "+ex.nombre+(ex.invertida?" (invertida)":"")+"\n\n"+(ex.texto||"—")+"\n\n";});
    }
  });
  var q=calcQuinta(cartas);
  if(q){var p=parsearQuinta(textoQuinta(q.nombre)||txt(q,false));md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n";if(p.lectura) md+=p.lectura+"\n\n";if(p.consejo) md+="**Consejo de acción BATS:** "+p.consejo+"\n\n";if(p.palabraClave) md+="**Palabra clave:** "+p.palabraClave+"\n\n";if(p.antipatron) md+="**Antipatrón:** "+p.antipatron+"\n\n";}
  if(hr.accion)md+="**Acción recomendada:** "+hr.accion+"\n\n";
  if(hr.anotaciones)md+="**Anotaciones:** "+hr.anotaciones+"\n\n";
  if(hr.observado)md+="**Lo observado:** "+hr.observado+"\n\n";
  if(hr._ia)md+="_IA que ha asistido la interpretación: "+hr._ia+"_\n\n";
  md+="_Generado por BATS Tarot_";
  if(isCap()&&Capacitor.Plugins.Share){
    Capacitor.Plugins.Share.share({title:hr.titulo||hr.tipo,text:md}).catch(function(){});
  }else if(navigator.share){
    navigator.share({title:hr.titulo||hr.tipo,text:md}).catch(function(){
      downloadBlob(md,"bats-"+slugify(hr.titulo||hr.tipo)+".md","text/markdown");
    });
  }else{
    downloadBlob(md,"bats-"+slugify(hr.titulo||hr.tipo)+".md","text/markdown");
  }
}
function compartirTirada(){
  if(!window._ult)return;
  var tit=window._lastPanelTitle||"Tirada BATS";
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var md="# "+tit+"\n\n_Fecha: "+fs+"_";
  var panelId=window._lastPanel;
  var desc=document.getElementById('desc-'+panelId)?.value||'';
  var sit=document.getElementById('situacion-'+panelId)?.value||'';
  var acc=document.getElementById('accion-'+panelId)?.value||'';
  var tipo=document.getElementById('tipo-'+panelId)?.value||'';
  if(desc)md+="\n\n*"+desc+"*";
  if(tipo)md+="\n\n**Tipo de relación:** "+tipo;
  if(sit)md+="\n\n**Situación:** "+sit;
  md+="\n\n";
  window._ult.forEach(function(it,i){
    md+="### "+(it.posicion?it.posicion+": ":"")+it.carta.nombre+(it.invertida?" (invertida)":"")+"\n\n"+(it.texto||txt(it.carta,it.invertida)||"—")+"\n\n";
  });
  md+=extensionMd(window._ult);
  var q=calcQuinta(window._ult);
  if(q){var p=parsearQuinta(textoQuinta(q.nombre)||txt(q,false));md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n";if(p.lectura) md+=p.lectura+"\n\n";if(p.consejo) md+="**Consejo de acción BATS:** "+p.consejo+"\n\n";if(p.palabraClave) md+="**Palabra clave:** "+p.palabraClave+"\n\n";if(p.antipatron) md+="**Antipatrón:** "+p.antipatron+"\n\n";}
  if(window._ult._interp)md+="### ✦ Interpretación\n\n"+window._ult._interp+"\n\n";
  if(window._ult._ia)md+="_IA que ha asistido la interpretación: "+window._ult._ia+"_\n\n";
  if(acc)md+="**Acción recomendada:** "+acc+"\n\n";
  var anot=document.getElementById('anotaciones-'+panelId)?.value||'';
  var obs=document.getElementById('observado-'+panelId)?.value||'';
  if(anot)md+="**Anotaciones:** "+anot+"\n\n";
  if(obs)md+="**Lo observado:** "+obs+"\n\n";
  md+="_Generado por BATS Tarot_";
  if(isCap()&&Capacitor.Plugins.Share){
    Capacitor.Plugins.Share.share({title:tit,text:md}).catch(function(){});
  }else if(navigator.share){
    navigator.share({title:tit,text:md}).catch(function(){
      downloadBlob(md,"bats-"+slugify(tit)+".md","text/markdown");
    });
  }else{
    downloadBlob(md,"bats-"+slugify(tit)+".md","text/markdown");
  }
}
function descargarHistHTML(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=reconstruirCartasHist(hr);
  cartas._interp=hr._interp||"";
  cartas._qtext=hr._qtext||"";
  cartas._ia=hr._ia||"";
  descargarHTML(hr.titulo||hr.tipo,cartas,hr.descripcion,hr.situacion,hr.accion,hr.tipo_rel,hr.anotaciones,hr.observado);
}
function descargarHistMD(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=reconstruirCartasHist(hr);
  cartas._interp=hr._interp||"";
  cartas._qtext=hr._qtext||"";
  cartas._ia=hr._ia||"";
  descargarMD(hr.titulo||hr.tipo,cartas,hr.descripcion,hr.situacion,hr.accion,hr.tipo_rel,hr.anotaciones,hr.observado);
}
function descargarHistAI(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=reconstruirCartasHist(hr);
  descargarAI(hr.titulo||hr.tipo,cartas);
}
function limpiarHist(){
  if(!confirm("\u00bfEliminar todo el historial?")) return;
  lsDel("bats-hist");
  cargarHist();
  toast("Historial eliminado");
}
function eliminarHist(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  if(!h[i]) return;
  var hr=h[i];
  var fs=new Date(hr.fecha).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});
  var titulo=hr.titulo||hr.tipo||"lectura";
  if(!confirm("\u00bfEliminar la lectura \u00ab"+titulo+"\u00bb del "+fs+"?\n\nEsta acci\u00f3n no se puede deshacer.")) return;
  h.splice(i,1);
  lsSet("bats-hist",JSON.stringify(h));
  toast("Lectura eliminada");
  cargarHist();
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
function interpParaHTML(t){
  var h=escHTML(t);
  return h.replace(/\*\*/g,"").replace(/^#{1,6}\s*/gm,"").replace(/\*([^*]+)\*/g,"$1").replace(/\n{3,}/g,"\n\n").replace(/\n/g,"<br>");
}
function escHTML(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function _clear(el){while(el.firstChild)el.removeChild(el.firstChild);return el;}
function _mkEl(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
function _mkTxt(s){return document.createTextNode(s==null?"":s);}
function _mkOpt(val,txt,selected){var o=document.createElement("option");o.value=val;o.textContent=txt;if(selected)o.selected=true;return o;}
function _htmlToDom(html){var t=document.createElement("div");t.innerHTML=html;var f=document.createDocumentFragment();while(t.firstChild)f.appendChild(t.firstChild);return f;}
function reintentarInterp(dest){
  if(window._ult) renderInterpLarga(dest,window._ult,window._lastCtx||{});
}
function valPanel(id){
  var el=document.getElementById(id);
  return el?el.value:"";
}

var PANELES_IA=["diaria","rel","laboral","pers","aprendizaje"];
function sincronizarFlagsPaneles(){
  PANELES_IA.forEach(function(p){
    var c1=document.getElementById("ia-corta-"+p),c2=document.getElementById("ia-larga-"+p);
    if(c1) c1.checked=getFlagCorta(p);
    if(c2) c2.checked=getFlagLarga(p);
  });
}
function cambiarFlagPanel(panelId,que,chk){
  var c=getFlagCorta(panelId),l=getFlagLarga(panelId);
  if(que==="corta") c=chk.checked; else l=chk.checked;
  setFlagPanel(panelId,c,l);
}
function restablecerFlagsPanel(panelId){
  try{localStorage.removeItem(STORE_PFX+"bats-ia-"+panelId)}catch(e){}
  var c1=document.getElementById("ia-corta-"+panelId),c2=document.getElementById("ia-larga-"+panelId);
  if(c1) c1.checked=getFlagCorta(panelId);
  if(c2) c2.checked=getFlagLarga(panelId);
}

function tirarDiaria(){hacerDiaria(false)}
function tirarDiariaInv(){hacerDiaria(true)}
function hacerDiaria(inv){
  var comodin=document.getElementById("diaria-comodin")&&document.getElementById("diaria-comodin").checked;
  var pos=["Centro: energ\u00eda del d\u00eda","Izquierda: qu\u00e9 frenar o minimizar","Derecha: qu\u00e9 impulsar o hacer","Arriba: ayuda disponible","Abajo: posible salida o resultado"];
  var esSombra=[false,true,false,false,false];
  var m=barajar(añadirComodin(BARAJA.slice(),comodin));
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++){
    var invC=inv?Math.random()<.5:false;
    var it={carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSombra[i])};
    if(esComodin(m[i])){it.comodinEstado="reverso";it.comodinInvertido=invC;it.comodinImg="comodin_reverso.png";if(invC){it.texto=COMODIN_INV_TEXT;}}
    c.push(it);
  }
  window._mazoRestante=m.slice(5);
  window._ult=c;
  window._lastPanel="diaria";
  window._lastPanelTitle="Cruz Diaria";
  renderConIA(c,"r-diaria",function(){
    mostrarCruz(c,"r-diaria",{posiciones:pos});
  },{titulo:"Cruz Diaria",descripcion:valPanel("desc-diaria"),guion:"diaria",panelId:"diaria"});
}

function tirarRelacion(){
  var p1=document.getElementById("rel-p1").value||"Persona 1",p2=document.getElementById("rel-p2").value||"Persona 2";
  lsSet("bats-rel-p1",p1);
  lsSet("bats-rel-p2",p2);
  var tipoRel=document.getElementById("tipo-rel").value||"";
  lsSet("bats-rel-tipo",tipoRel);
  var inv=document.getElementById("rel-inv").checked;
  var comodin=document.getElementById("rel-comodin")&&document.getElementById("rel-comodin").checked;
  var m=barajar(añadirComodin(BARAJA.slice(),comodin));
  if(m.length<4) return;
  var pos=["Energ\u00eda del momento de la relaci\u00f3n","Energ\u00eda de "+p1,"Energ\u00eda de "+p2,"Posible salida o direcci\u00f3n"];
  var c=[];
  for(var i=0;i<4;i++){
    var invC=inv?Math.random()<.5:false;
    var it={carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,false)};
    if(esComodin(m[i])){it.comodinEstado="reverso";it.comodinInvertido=invC;it.comodinImg="comodin_reverso.png";if(invC){it.texto=COMODIN_INV_TEXT;}}
    c.push(it);
  }
  window._mazoRestante=m.slice(4);
  window._ult=c;
  window._lastPanel="rel";
  window._lastPanelTitle="Tirada de la relación";
  renderConIA(c,"r-relacion",function(){
    mostrarCompleto(c,"r-relacion",{posiciones:pos});
  },{titulo:"Tirada de la relaci\u00f3n",descripcion:valPanel("desc-rel"),p1:p1,p2:p2,tipoRel:tipoRel,guion:"rel",panelId:"rel"});
}
function tirarLaboral(){hacerLaboral(false)}
function tirarLaboralInv(){hacerLaboral(true)}
function hacerLaboral(inv){
  var comodin=document.getElementById("laboral-comodin")&&document.getElementById("laboral-comodin").checked;
  var pos=["Centro: energ\u00eda laboral del momento","Izquierda: qu\u00e9 frenar o minimizar en el trabajo","Derecha: qu\u00e9 impulsar o hacer en el trabajo","Arriba: ayuda disponible en el trabajo","Abajo: posible salida o resultado laboral"];
  var esSombra=[false,true,false,false,false];
  var m=barajar(añadirComodin(BARAJA.slice(),comodin));
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++){
    var invC=inv?Math.random()<.5:false;
    var it={carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSombra[i])};
    if(esComodin(m[i])){it.comodinEstado="reverso";it.comodinInvertido=invC;it.comodinImg="comodin_reverso.png";if(invC){it.texto=COMODIN_INV_TEXT;}}
    c.push(it);
  }
  window._mazoRestante=m.slice(5);
  window._ult=c;
  window._lastPanel="laboral";
  window._lastPanelTitle="BATS Laboral";
  renderConIA(c,"r-laboral",function(){
    mostrarCruz(c,"r-laboral",{posiciones:pos});
  },{titulo:"BATS Laboral",descripcion:valPanel("desc-laboral"),guion:"laboral",panelId:"laboral"});
}

function actPos(){
  var n=parseInt(document.getElementById("pers-cant").value);
  var cont=document.getElementById("campos-posiciones");
  var vals={};
  for(var i=1;i<=15;i++){
    var el=document.getElementById("pers-pos-"+i);
    if(el) vals[i]=el.value;
  }
  cont.textContent="";
  for(var i=1;i<=n;i++){
    var div=document.createElement("div");
    div.className="pos-field";
    var span=document.createElement("span");
    span.className="pos-num";
    span.textContent=(i<10?"0":"")+i;
    var inp=document.createElement("input");
    inp.type="text";
    inp.id="pers-pos-"+i;
    inp.value=vals[i]||'Posici\u00f3n '+i;
    div.appendChild(span);
    div.appendChild(inp);
    cont.appendChild(div);
  }
}
actPos();
function configurarComodinCorte(subsetId,comodinId){
  var radios=document.querySelectorAll('input[name="'+subsetId+'"]');
  var chk=document.getElementById(comodinId);
  if(!chk) return;
  radios.forEach(function(r){r.addEventListener("change",function(){
    if(r.value==="corte"&&r.checked){chk.checked=false;chk.disabled=true;}
    else chk.disabled=false;
  });});
}
configurarComodinCorte("aprendizaje-subset","aprendizaje-comodin");
configurarComodinCorte("pers-subset","pers-comodin");
function tirarPers(){
  var n=parseInt(document.getElementById("pers-cant").value);
  var sub=document.querySelector('input[name="pers-subset"]:checked');
  var modo=sub?sub.value:"completo";
  var inv=document.getElementById("pers-inv").checked;
  var comodin=document.getElementById("pers-comodin")&&document.getElementById("pers-comodin").checked;
  var titulo=document.getElementById("pers-titulo").value.trim()||"Tirada Personalizada";
  var mazo=crearSub(modo);
  mazo=barajar(añadirComodin(mazo,comodin));
  var c=[];
  var dealt=mazo.slice(0,n);
  for(var i=0;i<n;i++){
    var invC=inv?Math.random()<.5:false;
    var el=document.getElementById("pers-pos-"+(i+1));
    var it={carta:dealt[i],invertida:invC,posicion:el?el.value:"Posici\u00f3n "+(i+1),texto:txt(dealt[i],invC,false)};
    if(esComodin(dealt[i])){it.comodinEstado="reverso";it.comodinInvertido=invC;it.comodinImg="comodin_reverso.png";if(invC){it.texto=COMODIN_INV_TEXT;}}
    c.push(it);
  }
  window._mazoRestante=mazo.slice(n);
  window._ult=c;
  window._lastPanel="pers";
  window._lastPanelTitle=titulo;
  renderConIA(c,"r-pers",function(){
    mostrarCompleto(c,"r-pers");
  },{titulo:titulo,descripcion:valPanel("desc-pers"),guion:"pers",panelId:"pers"});
}

function tirarAprendizaje(){hacerAprendizaje(document.getElementById("aprendizaje-inv").checked)}
function hacerAprendizaje(inv){
  var sub=document.querySelector('input[name="aprendizaje-subset"]:checked');
  var modo=sub?sub.value:"completo";
  var comodin=document.getElementById("aprendizaje-comodin")&&document.getElementById("aprendizaje-comodin").checked;
  var mazo=crearSub(modo);
  var sit=document.getElementById("situacion-aprendizaje").value.trim();
  if(!sit){toast("Describe la situación que quieres comprender",true);return}
  var m=barajar(añadirComodin(mazo,comodin));
  if(m.length<6) return;
  var pos=[
    "El Hecho — ¿Qué ha ocurrido realmente?",
    "El Maestro — ¿Qué me está mostrando realmente esta experiencia?",
    "El Punto Ciego — ¿Qué no estoy viendo o qué interpretación me impide aprender?",
    "La Integración — ¿Qué comprensión quiere integrarse en mí?",
    "El Don Transformador — ¿Qué capacidad, virtud o cambio nace cuando integro esta verdad?",
    "El Resultado Posible — ¿Qué transformación ocurrirá en mi experiencia si integro la lección?"
  ];
  var esSom=[false,false,true,false,false,false];
  var c=[];
  for(var i=0;i<6;i++){
    var invC=inv?Math.random()<.5:false;
    var it={carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSom[i])};
    if(esComodin(m[i])){it.comodinEstado="reverso";it.comodinInvertido=invC;it.comodinImg="comodin_reverso.png";if(invC){it.texto=COMODIN_INV_TEXT;}}
    c.push(it);
  }
  window._mazoRestante=m.slice(6);
  window._ult=c;
  window._lastPanel="aprendizaje";
  window._lastPanelTitle="El Aprendizaje";
  renderConIA(c,"r-aprendizaje",function(){
    mostrarCompleto(c,"r-aprendizaje",{posiciones:pos});
  },{titulo:"El Aprendizaje",situacion:sit,guion:"aprendizaje",panelId:"aprendizaje"});
}

function tirarVisitante(){
  var fnac=document.getElementById("av-fecha-nac").value.trim();
  var nombre=document.getElementById("av-nombre").value.trim();
  if(!fnac){toast("Introduce tu fecha de nacimiento (DD/MM/AAAA)",true);return}
  if(!nombre){toast("Introduce tu nombre completo",true);return}
  var fnacParts=fnac.split("/");
  if(fnacParts.length!==3||fnacParts[0].length!==2||fnacParts[1].length!==2||fnacParts[2].length!==4){
    toast("Formato de fecha: DD/MM/AAAA",true);return;
  }
  var testDate=new Date(fnacParts[2],fnacParts[1]-1,fnacParts[0]);
  if(isNaN(testDate.getTime())||testDate.getDate()!=fnacParts[0]||testDate.getMonth()!=fnacParts[1]-1){
    toast("Fecha de nacimiento no válida",true);return;
  }
  lsSet("av-nacimiento",fnac);
  lsSet("av-nombre",nombre);
  var hoy=new Date();
  var dd=z(hoy.getDate())+"/"+z(hoy.getMonth()+1)+"/"+hoy.getFullYear();
  var num=calcArcanoNum(fnac,dd,nombre);
  if(!num){toast("No se pudo calcular el arcano",true);return}
  var carta=TABLA_78[num-1];
  if(!carta){toast("Error en la tabla de arcanos",true);return}
  var d=batsDe(carta);
  var pos="El Arcano Visitante del día";
  var c=[{carta:carta,invertida:false,posicion:pos,texto:txt(carta,false)}];
  window._ult=c;
  window._lastPanel="arcano-visitante";
  window._lastPanelTitle="El Arcano Visitante";
  window._lastCtx={guion:"arcano",titulo:"El Arcano Visitante",fecha:new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"}),numero:num};
  if(typeof getAIMode!=="undefined"&&getAIMode()!=="off"){
    var rres=document.getElementById("r-arcano-visitante");
    _clear(rres);var ld=document.createElement("div");ld.className="ai-cargando";var sp=document.createElement("span");sp.className="ai-spinner";ld.appendChild(sp);ld.appendChild(document.createTextNode("Interpretando con IA\u2026"));rres.appendChild(ld);
    generarIAVisitante(carta).then(function(t){
      c._avtexts=t;
      renderAV(carta,num,d,fnac,nombre,dd,t);
      try{renderInterpLarga("r-arcano-visitante",c,window._lastCtx)}catch(e){console.error("renderInterpLarga AV:",e);toast("Error al iniciar la interpretaci\u00f3n larga: "+(e&&e.message||e),true)}
    }).catch(function(e){
      toast((e&&e.message||"Error de IA")+". Se muestran los textos BATS.",true);
      renderAV(carta,num,d,fnac,nombre,dd,null);
      try{renderInterpLarga("r-arcano-visitante",c,window._lastCtx)}catch(e2){console.error("renderInterpLarga AV:",e2)}
    });
  }else{
    renderAV(carta,num,d,fnac,nombre,dd,null);
  }
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
function descargarAV(fmt){
  var anot=document.getElementById('anotaciones-arcano-visitante')?.value||'';
  var obs=document.getElementById('observado-arcano-visitante')?.value||'';
  if(!window._ult||!window._ult[0])return;
  var c=window._ult[0].carta;
  var num=null;
  for(var i=0;i<TABLA_78.length;i++){if(TABLA_78[i]===c){num=i+1;break}}
  var d=batsDe(c);
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fnac=document.getElementById("av-fecha-nac")?.value||lsGet("av-nacimiento")||"";
  var nombre=document.getElementById("av-nombre")?.value||lsGet("av-nombre")||"";
  var inAV=window._ult._interp||"";
  if(fmt==="md"){
    var md="# El Arcano Visitante\n\n_Fecha: "+fs+"_";
    md+="\n\n**Arcano:** "+num+" — "+c.nombre;
    md+="\n\n**Fecha de nacimiento:** "+fnac;
    md+="\n\n**Nombre:** "+nombre;
    md+="\n\n---\n\n";
    var ts=c._avtexts||null;
    md+="### ¿Qué vienes a mostrarme hoy?\n\n"+(ts&&ts.q1?ts.q1:(d?d.normal:"—"))+"\n\n";
    md+="### ¿Qué patrón conocido me estás ayudando a no repetir hoy?\n\n"+(ts&&ts.q2?ts.q2:(d?d.sombra||d.normal:"—"))+"\n\n";
    md+="### ¿Qué acción consciente me ayuda a escucharte?\n\n"+(ts&&ts.q3?ts.q3:(d?d.ayuda||d.normal:"—"))+"\n\n";
    if(inAV)md+="### ✦ Interpretación\n\n"+inAV+"\n\n";
    if(window._ult._ia)md+="_IA que ha asistido la interpretación: "+window._ult._ia+"_\n\n";
    if(anot)md+="**Anotaciones:** "+anot+"\n\n";
    if(obs)md+="**Lo observado:** "+obs+"\n\n";
    md+="_Generado por BATS Tarot_";
    downloadBlob(md,"bats-arcano-visitante.md","text/markdown");
  }else{
    var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>El Arcano Visitante - BATS</title>';
    html+='<style>body{font-family:sans-serif;background:#0d0a13;color:#e8dcc8;padding:20px;max-width:800px;margin:0 auto}h1{color:#d4a847}h3{color:#d4a847;margin-top:16px}.ct{color:#b8a898;font-size:.9rem;line-height:1.5;margin:4px 0 12px}.ia{color:#8a7f6a;font-size:.72rem;margin:4px 0 12px}.foot{color:#666;font-size:.8rem;text-align:center;margin-top:24px}img{width:120px;border-radius:8px;border:2px solid #2a1a3e}</style></head><body>';
    html+='<h1>El Arcano Visitante</h1><p style="color:#b8a898"><em>'+fs+'</em></p>';
    html+='<p><strong>'+escHTML(num+" — "+c.nombre)+'</strong></p><p style="color:#b8a898">Nacimiento: '+escHTML(fnac)+' · Nombre: '+escHTML(nombre)+'</p>';
    html+='<img src="'+BATS_BASE+c.img+'" alt="'+escHTML(c.nombre)+'">';
    var ts=c._avtexts||null;
    html+='<h3>¿Qué vienes a mostrarme hoy?</h3><div class="ct">'+escHTML(ts&&ts.q1?ts.q1:(d?d.normal:"—"))+'</div>';
    html+='<h3>¿Qué patrón conocido me estás ayudando a no repetir hoy?</h3><div class="ct">'+escHTML(ts&&ts.q2?ts.q2:(d?d.sombra||d.normal:"—"))+'</div>';
    html+='<h3>¿Qué acción consciente me ayuda a escucharte?</h3><div class="ct">'+escHTML(ts&&ts.q3?ts.q3:(d?d.ayuda||d.normal:"—"))+'</div>';
    if(inAV)html+='<h3>✦ Interpretación</h3><div class="ct">'+interpParaHTML(inAV)+'</div>';
    if(window._ult._ia)html+='<p class="ia">IA que ha asistido la interpretación: '+escHTML(window._ult._ia)+'</p>';
    if(anot)html+='<h3>Anotaciones</h3><div class="ct">'+escHTML(anot)+'</div>';
    if(obs)html+='<h3>Lo observado</h3><div class="ct">'+escHTML(obs)+'</div>';
    html+='<p class="foot">Generado por BATS Tarot</p></body></html>';
    downloadBlob(html,"bats-arcano-visitante.html","text/html");
  }
}
function compartirAV(){
  var anot=document.getElementById('anotaciones-arcano-visitante')?.value||'';
  var obs=document.getElementById('observado-arcano-visitante')?.value||'';
  if(!window._ult||!window._ult[0])return;
  var c=window._ult[0].carta;
  var num=null;
  for(var i=0;i<TABLA_78.length;i++){if(TABLA_78[i]===c){num=i+1;break}}
  var d=batsDe(c);
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var md="# El Arcano Visitante\n\n_Fecha: "+fs+"_";
  md+="\n\n**Arcano:** "+num+" — "+c.nombre;
  md+="\n\n### ¿Qué vienes a mostrarme hoy?\n\n"+(c._avtexts&&c._avtexts.q1?c._avtexts.q1:(d?d.normal:"—"))+"\n\n";
  md+="### ¿Qué patrón conocido me estás ayudando a no repetir hoy?\n\n"+(c._avtexts&&c._avtexts.q2?c._avtexts.q2:(d?d.sombra||d.normal:"—"))+"\n\n";
  md+="### ¿Qué acción consciente me ayuda a escucharte?\n\n"+(c._avtexts&&c._avtexts.q3?c._avtexts.q3:(d?d.ayuda||d.normal:"—"))+"\n\n";
  if(window._ult._interp)md+="### ✦ Interpretación\n\n"+window._ult._interp+"\n\n";
  if(window._ult._ia)md+="_IA que ha asistido la interpretación: "+window._ult._ia+"_\n\n";
  if(anot)md+="**Anotaciones:** "+anot+"\n\n";
  if(obs)md+="**Lo observado:** "+obs+"\n\n";
  md+="_Generado por BATS Tarot_";
  if(isCap()&&Capacitor.Plugins.Share){Capacitor.Plugins.Share.share({title:"El Arcano Visitante",text:md}).catch(function(){})}
  else if(navigator.share){navigator.share({title:"El Arcano Visitante",text:md}).catch(function(){downloadBlob(md,"bats-arcano-visitante.md","text/markdown")})}
  else{downloadBlob(md,"bats-arcano-visitante.md","text/markdown")}
}

function buscarAyuda(){
  var q=document.getElementById("ayuda-q").value.toLowerCase().trim();
  var cont=document.getElementById("r-ayuda");
  if(!q){mostrarTodas();return}
  var res=[];
  BARAJA.forEach(function(c){
    var d=batsDe(c);if(!d)return;
    var txts=(c.nombre+" "+(c.nucleo||"")+" "+c.tipo).toLowerCase();
    var enc=txts.indexOf(q)>=0;
    if(!enc) enc=!!(["normal","sombra","ayuda","invertida"].filter(function(cp){return d[cp]&&d[cp].toLowerCase().indexOf(q)>=0}).length);
    if(enc) res.push({carta:c,datos:d});
  });
  _clear(cont);
  if(!res.length){
    var p=document.createElement('p');p.className='subtle';p.textContent='No se encontraron cartas con "'+q+'".';cont.appendChild(p);return;
  }
  var cnt=document.createElement("p");cnt.className="subtle";cnt.textContent=res.length+" carta(s):";cont.appendChild(cnt);
  res.forEach(function(r){
    var c=r.carta,d=r.datos;
    var item=document.createElement("div");item.className="resultado-ayuda-item";
    var top=document.createElement("div");top.style.cssText="display:flex;gap:10px;align-items:start;margin-bottom:6px";
    top.appendChild(imgCard(c));
    var info=document.createElement("div");
    var h3=document.createElement("h3");h3.textContent=c.nombre;info.appendChild(h3);
    var sub=document.createElement("span");sub.className="subtle";sub.textContent=c.tipo==="arcano"?"Arcano Mayor":c.nucleo;info.appendChild(sub);
    top.appendChild(info);item.appendChild(top);
      if(d.normal){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Normal";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.normal;f.appendChild(pp);item.appendChild(f);}
      if(d.sombra){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Sombra";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.sombra;f.appendChild(pp);item.appendChild(f);}
      if(d.ayuda){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Ayuda";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.ayuda;f.appendChild(pp);item.appendChild(f);}
      if(d.invertida){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Invertida";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.invertida;f.appendChild(pp);item.appendChild(f);}
    cont.appendChild(item);
  });
}
function mostrarTodas(){
  var cont=document.getElementById("r-ayuda");_clear(cont);
  var grps={arcano:"Arcanos Mayores",bastos:"Bastos",copas:"Copas",espadas:"Espadas",oros:"Oros"};
  Object.keys(grps).forEach(function(tipo){
    var cartas=BARAJA.filter(function(c){return tipo==="arcano"?c.tipo==="arcano":c.tipo===tipo});
    if(!cartas.length) return;
    var h3=document.createElement("h3");h3.style.cssText="color:var(--gold);margin:12px 0 6px;font-size:1rem";h3.textContent=grps[tipo];cont.appendChild(h3);
    cartas.forEach(function(c){
      var d=batsDe(c);if(!d)return;
      var item=document.createElement("div");item.className="resultado-ayuda-item";
      var top=document.createElement("div");top.style.cssText="display:flex;gap:10px;align-items:start;margin-bottom:6px";
      top.appendChild(imgCard(c));
      var info=document.createElement("div");
      var h3=document.createElement("h3");h3.textContent=c.nombre;info.appendChild(h3);
      top.appendChild(info);item.appendChild(top);
      if(d.normal){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Normal";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.normal;f.appendChild(pp);item.appendChild(f);}
      if(d.sombra){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Sombra";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.sombra;f.appendChild(pp);item.appendChild(f);}
      if(d.ayuda){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Ayuda";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.ayuda;f.appendChild(pp);item.appendChild(f);}
      if(d.invertida){var f=document.createElement("div");f.className="campo";var st=document.createElement("strong");st.textContent="Invertida";f.appendChild(st);var pp=document.createElement("p");pp.textContent=d.invertida;f.appendChild(pp);item.appendChild(f);}
      cont.appendChild(item);
    });
  });
}

function compVersiones(a,b){
  var pa=a.split(".").map(Number),pb=b.split(".").map(Number);
  for(var i=0;i<3;i++){
    var x=pa[i]||0,y=pb[i]||0;
    if(x!==y) return x>y?1:-1;
  }
  return 0;
}
function checkNovedades(){
  fetch('novedades.json?t='+Date.now()).then(function(r){return r.json()}).then(function(d){
    var visto=lsGet('bats-novedades-vista')||'';
    if(!d.ultima||d.ultima===visto) return;
    var texto='';
    if(d.historial){
      var claves=Object.keys(d.historial).sort(function(a,b){return compVersiones(b,a)});
      var contado=0;
      claves.forEach(function(v){
        if(contado>=2) return;
        if(visto===''||compVersiones(v,visto)>0){
          var h=d.historial[v];
          if(contado>0) texto+='<div class="nov-sep"></div>';
          texto+='<h4>'+escHTML(h.titulo)+'</h4><div>'+escHTML(h.texto)+'</div>';
          contado++;
        }
      });
    }
    if(!texto) texto=escHTML(d.texto||'');
    var m=document.createElement('div');
    m.className='novedades-modal';
    var box=document.createElement('div');box.className='novedades-box';
    var h3=document.createElement('h3');h3.textContent=d.titulo||'Novedades';box.appendChild(h3);
    var txt=document.createElement('div');txt.className='novedades-texto';txt.innerHTML=texto;box.appendChild(txt);
    var btn=document.createElement('button');btn.className='btn btn-gold';btn.textContent='Entendido';
    btn.onclick=function(){m.remove();marcarNovedadesVista(d.ultima)};
    box.appendChild(btn);m.appendChild(box);
    document.body.appendChild(m);
  }).catch(function(){});
}

function marcarNovedadesVista(v){lsSet("bats-novedades-vista",v)}

function initSW(){
  checkNovedades();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').then(function(reg){
      reg.addEventListener('updatefound', function(){
        var sw = reg.installing;
        sw.addEventListener('statechange', function(){
          if(sw.state === 'installed' && navigator.serviceWorker.controller){
            var banner = document.createElement('div');
            banner.className = 'update-banner';
            var txt=document.createElement('span');txt.textContent='Nueva versi\u00f3n disponible ';banner.appendChild(txt);
            var ubtn=document.createElement('button');ubtn.textContent='Actualizar';ubtn.onclick=function(){location.reload()};banner.appendChild(ubtn);
            document.body.appendChild(banner);
          }
        });
      });
    });
  }
}

var ADMIN_URL_KEY="b3a2b557191caaaf8e5c246b";
var _adminState={config:null,defaults:null,available:null,systemDefaults:null,pendingOrder:null,pendingOn:null,aiFlags:null};
var ADMIN_SISTEMAS_CFGKEY={
  diaria:"systemDiaria",
  rel:"systemRel",
  laboral:"systemLaboral",
  aprendizaje:"systemAprendizaje",
  pers:"systemPers",
  av:"systemAV",
  larga:"systemLarga"
};

function initAdmin(){
  var box=document.getElementById("admin-box");
  if(!box) return;
  var params=new URLSearchParams(location.search);
  if(params.get("admin")!==ADMIN_URL_KEY) return;
  box.style.display="block";
  var tok=adminGetToken();
  if(tok) adminEntrar(tok);
}
function adminDesbloquear(){
  var pass=document.getElementById("admin-pass").value.trim();
  if(!pass){adminMsg("Escribe la contrase\u00f1a de administrador.",true);return}
  adminEntrar(pass);
}
function adminEntrar(token){
  adminMsg("Entrando\u2026");
  adminGetConfig(token).then(function(data){
    adminSetToken(token);
    _adminState.config=data.config||{};
    _adminState.defaults=data.defaults||["groq","sambanova","google","openrouter","nvidia"];
    _adminState.available=data.available||[];
    _adminState.systemDefaults=data.systemDefaults||{};
    _adminState.aiFlags=data.aiFlags||{useCorta:true,useLarga:true};
    _adminState.pendingOrder=null;
    _adminState.pendingOn=null;
    document.getElementById("admin-box").style.display="none";
    document.getElementById("admin-pass").value="";
    document.getElementById("admin-panel").style.display="block";
    adminPoblar();
    adminMsg("Sesi\u00f3n iniciada como administradora. Edita y pulsa \u00abGuardar cambios\u00bb.");
  },function(e){
    adminClearToken();
    adminMsg((e&&e.message)||"No se pudo entrar. Comprueba la contrase\u00f1a.",true);
  });
}
function adminCerrar(){
  adminClearToken();
  _adminState.config=null;
  _adminState.pendingOrder=null;
  _adminState.pendingOn=null;
  document.getElementById("admin-panel").style.display="none";
  document.getElementById("admin-box").style.display="block";
  adminMsg("");
  toast("Sesi\u00f3n de administraci\u00f3n cerrada");
}
function adminMsg(msg,err){
  var el=document.getElementById("admin-msg");
  if(!el) return;
  el.textContent=msg;
  el.style.color=err?"var(--danger,#e74c3c)":"var(--gold,#c9a45c)";
}
function adminTab(id){
  var bas=id==="basico";
  document.getElementById("admin-tab-basico").style.display=bas?"block":"none";
  document.getElementById("admin-tab-avanzado").style.display=bas?"none":"block";
  document.getElementById("admin-tab-btn-basico").classList.toggle("active",bas);
  document.getElementById("admin-tab-btn-avanzado").classList.toggle("active",!bas);
}
function adminTempVal(){
  var el=document.getElementById("admin-temp");
  var v=parseFloat(el.value);
  document.getElementById("admin-temp-val").textContent=v.toFixed(1);
}
function adminNombres(){
  var names={};
  (_adminState.available||[]).forEach(function(p){names[p.id]=p.nombre||p.name||p.id});
  return names;
}
function adminLeerActivos(){
  var on={};
  (_adminState.available||[]).forEach(function(p){
    var el=document.getElementById("admin-on-"+p.id);
    if(el) on[p.id]=el.checked;
  });
  return on;
}
function adminOrdenActual(){
  var o=_adminState.pendingOrder||(Array.isArray(_adminState.config&&_adminState.config.providerOrder)&&_adminState.config.providerOrder.length?_adminState.config.providerOrder:null)||_adminState.defaults;
  return o.slice();
}
function adminPoblar(){
  var cfg=_adminState.config||{};
  var order=adminOrdenActual();
  var on=_adminState.pendingOn||cfg.providersOn||{};
  var names=adminNombres();
  var cont=document.getElementById("admin-proveedores");_clear(cont);
  order.forEach(function(id,i){
    var row=document.createElement("div");row.className="admin-prov";row.style.cssText="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08)";
    var num=document.createElement("span");num.style.cssText="opacity:.5;width:16px";num.textContent=i+1;row.appendChild(num);
    var chk=document.createElement("input");chk.type="checkbox";chk.id="admin-on-"+id;if(on[id]!==false)chk.checked=true;chk.style.width="auto";chk.onchange=adminCambio;row.appendChild(chk);
    var nm=document.createElement("span");nm.style.cssText="flex:1;text-align:left";nm.textContent=names[id]||id;row.appendChild(nm);
    var upBtn=document.createElement("button");upBtn.className="btn btn-outline btn-sm";upBtn.textContent="\u25B2";if(i===0)upBtn.disabled=true;upBtn.onclick=(function(ii){return function(){adminMover(ii,-1)}})(i);row.appendChild(upBtn);
    var dnBtn=document.createElement("button");dnBtn.className="btn btn-outline btn-sm";dnBtn.textContent="\u25BC";if(i===order.length-1)dnBtn.disabled=true;dnBtn.onclick=(function(ii){return function(){adminMover(ii,1)}})(i);row.appendChild(dnBtn);
    cont.appendChild(row);
  });
  document.getElementById("admin-temp").value=cfg.temperature!=null?cfg.temperature:0.7;
  adminTempVal();
  document.getElementById("admin-len").value=cfg.lenDefault||"media";
  document.getElementById("admin-maxtok").value=cfg.maxTokens||4096;
  var af=_adminState.aiFlags||{useCorta:true,useLarga:true};
  var elUC=document.getElementById("admin-use-corta"),elUL=document.getElementById("admin-use-larga");
  if(elUC) elUC.checked=af.useCorta!==false;
  if(elUL) elUL.checked=af.useLarga!==false;
  for(var g in ADMIN_SISTEMAS_CFGKEY){
    var elS=document.getElementById("admin-sys-"+g);
    if(!elS) continue;
    elS.value=cfg[ADMIN_SISTEMAS_CFGKEY[g]]!=null?cfg[ADMIN_SISTEMAS_CFGKEY[g]]:((_adminState.systemDefaults||{})[g]||"");
  }
}
function adminCambio(){
  _adminState.pendingOn=adminLeerActivos();
}
function adminMover(i,dir){
  var order=adminOrdenActual();
  var j=i+dir;
  if(j<0||j>=order.length) return;
  var t=order[i];order[i]=order[j];order[j]=t;
  _adminState.pendingOrder=order;
  adminPoblar();
}
function adminGuardar(){
  var cfg={};
  cfg.providerOrder=adminOrdenActual();
  cfg.providersOn=adminLeerActivos();
  cfg.temperature=parseFloat(document.getElementById("admin-temp").value);
  cfg.maxTokens=parseInt(document.getElementById("admin-maxtok").value,10)||4096;
  cfg.lenDefault=document.getElementById("admin-len").value;
  var elUC=document.getElementById("admin-use-corta"),elUL=document.getElementById("admin-use-larga");
  cfg.useCorta=elUC?elUC.checked:true;
  cfg.useLarga=elUL?elUL.checked:true;
  for(var g in ADMIN_SISTEMAS_CFGKEY){
    var elS=document.getElementById("admin-sys-"+g);
    if(!elS) continue;
    var val=elS.value;
    if(val!==(_adminState.systemDefaults||{})[g]) cfg[ADMIN_SISTEMAS_CFGKEY[g]]=val;
  }
  var tok=adminGetToken();
  adminMsg("Guardando\u2026");
  adminSaveConfig(tok,cfg).then(function(data){
    _adminState.config=data.config||cfg;
    _adminState.pendingOrder=null;
    _adminState.pendingOn=null;
    if(data.config){
      _adminState.aiFlags={useCorta:data.config.useCorta!==false,useLarga:data.config.useLarga!==false};
    }
    if(typeof setAIFlagsLocal==="function") setAIFlagsLocal(_adminState.aiFlags);
    adminPoblar();
    adminMsg("\u2713 Cambios guardados. Ya est\u00e1n aplicados para todas las tiradas.");
  },function(e){
    adminMsg((e&&e.message)||"No se pudieron guardar los cambios.",true);
  });
}
function adminRestaurarSistema(g){
  var el=document.getElementById("admin-sys-"+g);
  if(el){el.value=(_adminState.systemDefaults||{})[g]||"";toast("Instrucciones originales restauradas")}
}
function adminRestaurarTodo(){
  if(!confirm("\u00bfVolver a los valores originales de f\u00e1brica para la IA de todos los usuarios?")) return;
  var tok=adminGetToken();
  adminSaveConfig(tok,{}).then(function(){
    _adminState.config={};
    _adminState.pendingOrder=null;
    _adminState.pendingOn=null;
    _adminState.aiFlags={useCorta:true,useLarga:true};
    if(typeof setAIFlagsLocal==="function") setAIFlagsLocal({useCorta:true,useLarga:true});
    adminPoblar();
    adminMsg("\u2713 Valores originales restaurados.");
  },function(e){
    adminMsg((e&&e.message)||"No se pudieron restaurar los valores.",true);
  });
}

/* ============ LECTURA POR VOZ → moved to js/tts.js ============ */

setTimeout(function(){
  var vd=document.getElementById("vers-app");
  if(vd) vd.textContent="BATS Tarot v"+BATS_VERSION;
  console.log("[BATS] version cargada:",BATS_VERSION);
  var rp1=document.getElementById("rel-p1"),rp2=document.getElementById("rel-p2");
  if(rp1){rp1.value=lsGet("bats-rel-p1")||"Persona 1"}
  if(rp2){rp2.value=lsGet("bats-rel-p2")||"Persona 2"}
  var rtipo=document.getElementById("tipo-rel");
  if(rtipo){rtipo.value=lsGet("bats-rel-tipo")||""}
  var avFNac=document.getElementById("av-fecha-nac"),avNom=document.getElementById("av-nombre");
  if(avFNac){avFNac.value=lsGet("av-nacimiento")||""}
  if(avNom){avNom.value=lsGet("av-nombre")||""}
  if(document.getElementById("r-ayuda")) mostrarTodas();
  if(document.getElementById("r-historial")) cargarHist();
  if(typeof actualizarUI_AI==="function") actualizarUI_AI();
  if(document.getElementById("cfg-provider")) cargarPanelConfig();
  if(typeof cargarAIFlags==="function") cargarAIFlags(sincronizarFlagsPaneles);
  if(typeof initAdmin==="function") initAdmin();
  if(typeof vozCargar==="function"){vozCargar();vozTasa(vozTasaActual())}
  initSW();
},100);
