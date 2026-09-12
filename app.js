// State initialized by js/state.js (window._* backed by BATS.state)
// Card data & deck operations now in js/deck.js (window.BATS.deck)
// Numerology & quintessence now in js/numerology.js (window.BATS.numerology)
// AI interpretation pipeline now in js/ai-pipeline.js (window.BATS.aiPipeline)
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

/* ============ RENDER CARDS → moved to js/render-cards.js ============ */

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

/* ============ EXPORT / SHARE → moved to js/export-share.js ============ */

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

function valPanel(id){
  var el=document.getElementById(id);
  return el?el.value:"";
}

/* ============ AI PIPELINE → moved to js/ai-pipeline.js ============ */
function escHTML(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function _clear(el){while(el.firstChild)el.removeChild(el.firstChild);return el;}
function _mkEl(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
function _mkTxt(s){return document.createTextNode(s==null?"":s);}
function _mkOpt(val,txt,selected){var o=document.createElement("option");o.value=val;o.textContent=txt;if(selected)o.selected=true;return o;}
function _htmlToDom(html){var t=document.createElement("div");t.innerHTML=html;var f=document.createDocumentFragment();while(t.firstChild)f.appendChild(t.firstChild);return f;}

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

function tirarDiaria(){hacerDiaria(document.getElementById("diaria-inv")&&document.getElementById("diaria-inv").checked)}
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
function tirarLaboral(){hacerLaboral(document.getElementById("laboral-inv")&&document.getElementById("laboral-inv").checked)}
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
    var txtEl=document.createElement('div');txtEl.className='novedades-texto';txtEl.innerHTML=texto;box.appendChild(txtEl);
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
            var txtEl=document.createElement('span');txtEl.textContent='Nueva versi\u00f3n disponible ';banner.appendChild(txtEl);
            var ubtn=document.createElement('button');ubtn.textContent='Actualizar';ubtn.onclick=function(){location.reload()};banner.appendChild(ubtn);
            document.body.appendChild(banner);
          }
        });
      });
    });
  }
}

/* ============ ADMIN PANEL → moved to js/admin.js ============ */

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
