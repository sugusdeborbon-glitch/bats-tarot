/* ============ EXPORT / SHARE (extracted from app.js) ============ */
/* Depends on: z, escHTML, slugify, txt, esComodin, batsDe, TABLA_78, BARAJA (deck.js)
                calcQuinta, textoQuinta, parsearQuinta, extensionMd, extensionHtml, interpParaHTML (numerology.js)
                lsGet, lsSet, toast, _clear (app.js) */

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
