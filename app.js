var BATS_VERSION="1.5.1";

var PALOS=[["bastos","Wands"],["copas","Cups"],["espadas","Swords"],["oros","Pentacles"]];
var NOMPALO={bastos:"Bastos",copas:"Copas",espadas:"Espadas",oros:"Oros"};
var BARAJA=[];
var MAYORES=[
  [0,"El Loco","TheFool"],[1,"El Mago","TheMagician"],[2,"La Sacerdotisa","TheHighPriestess"],
  [3,"La Emperatriz","TheEmpress"],[4,"El Emperador","TheEmperor"],[5,"El Hierofante","TheHierophant"],
  [6,"Los Enamorados","TheLovers"],[7,"El Carro","TheChariot"],[8,"La Fuerza","Strength"],
  [9,"El Ermitaño","TheHermit"],[10,"La Rueda de la Fortuna","WheelOfFortune"],[11,"La Justicia","Justice"],
  [12,"El Colgado","TheHangedMan"],[13,"La Muerte","Death"],[14,"La Templanza","Temperance"],
  [15,"El Diablo","TheDevil"],[16,"La Torre","TheTower"],[17,"La Estrella","TheStar"],
  [18,"La Luna","TheMoon"],[19,"El Sol","TheSun"],[20,"El Juicio","Judgement"],[21,"El Mundo","TheWorld"]
];
MAYORES.forEach(function(a){
  BARAJA.push({nombre:a[1],valor:a[0],tipo:"arcano",img:"cartas/"+z(a[0])+"-"+a[2]+".jpg",nucleo:"Arcano Mayor",letras:ini(a[1])});
});
var NUMES=["","As","Dos","Tres","Cuatro","Cinco","Seis","Siete","Ocho","Nueve","Diez"];
var FIGURAS=["Sota","Caballo","Reina","Rey"];
PALOS.forEach(function(p){
  var pa=p[0],pi=p[1],np=NOMPALO[pa];
  for(var v=1;v<=14;v++){
    var nom=(v<=10?NUMES[v]:FIGURAS[v-11])+" de "+np;
    BARAJA.push({nombre:nom,valor:v,tipo:pa,img:"cartas/"+pi+z(v)+".jpg",nucleo:np,letras:ini(nom)});
  }
});

var TABLA_78=[];
(function(){
  for(var i=1;i<=21;i++)TABLA_78.push(BARAJA[i]);
  TABLA_78.push(BARAJA[0]);
  for(var i=22;i<=77;i++)TABLA_78.push(BARAJA[i]);
})();

function z(n){return n<10?"0"+n:""+n}
function ini(s){return s.replace(/^(La|Los|El|Las|As|Sota|Caballo|Reina|Rey)\s+(de\s+)?/i,"").substring(0,2).toUpperCase()}

var PITO={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};
function normalizarNombre(s){return s.toUpperCase().replace(/[ÁÉÍÓÚÜ]/g,function(m){return{"Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U","Ü":"U"}[m]}).replace(/[^A-Z\s]/g,"")}
function sumaDigitos(n){var s=0;for(var i=0;i<n.length;i++)s+=parseInt(n[i])||0;return s}
function sumaNombre(s){var n=normalizarNombre(s),sum=0;for(var i=0;i<n.length;i++)if(PITO[n[i]])sum+=PITO[n[i]];return sum}
function calcArcanoNum(fechaNac,fechaDia,nombre){
  var dn=fechaNac.replace(/\//g,""),dd=fechaDia.replace(/\//g,"");
  if(dn.length!==8||dd.length!==8)return null;
  var sn=sumaDigitos(dn),sd=sumaDigitos(dd),snn=sumaNombre(nombre);
  var total=sn+sd+snn;
  if(total===0)return null;
  if(total>=1&&total<=78)return total;
  while(total>78){var s=0,t=total;while(t>0){s+=t%10;t=Math.floor(t/10)}total=s}
  return total>0&&total<=78?total:null;
}

function barajar(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a}
function crearSub(m){
  if(!m||m==="completo") return BARAJA.slice();
  if(m==="mayores") return BARAJA.filter(function(c){return c.tipo==="arcano"});
  if(m==="menores") return BARAJA.filter(function(c){return c.tipo!=="arcano"&&c.valor>=1&&c.valor<=10});
  if(m==="corte") return BARAJA.filter(function(c){return c.tipo!=="arcano"&&c.valor>=11&&c.valor<=14});
  return BARAJA.slice();
}
function repartir(n,inv,mazo){
  var d=barajar(mazo.slice()),r=[];
  for(var i=0;i<n&&i<d.length;i++) r.push({carta:d[i],invertida:inv?Math.random()<.5:false});
  return r;
}
function batsDe(c){
  if(typeof DATOS_BATS!=="undefined"&&DATOS_BATS[c.nombre]) return DATOS_BATS[c.nombre];
  return null;
}
function txt(c,inv,sombra){
  var d=batsDe(c);
  if(!d) return "\u2014";
  if(sombra&&d.sombra) return d.sombra;
  if(inv&&d.invertida) return d.invertida;
  if(d.normal) return d.normal;
  if(d.prof) return d.prof;
  return c.nucleo||"\u2014";
}

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

function imgCard(c){
  return '<img src="'+c.img+'" alt="'+c.nombre+'" loading="lazy" onclick="abrirLightbox(this.src,this.alt)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="card-placeholder" style="display:none"><div class="cp-name">'+c.letras+'</div><div class="cp-suit">'+(c.tipo==="arcano"?"AM":c.nucleo)+'</div></div>';
}
function abrirLightbox(src,alt){
  var o=document.createElement('div');
  o.className='lightbox';
  o.innerHTML='<div class="lightbox-bg" onclick="this.parentElement.remove()"></div><div class="lightbox-content" onclick="this.parentElement.remove()"><img src="'+src+'" alt="'+alt+'"><div class="lightbox-nombre">'+alt+'</div></div>';
  document.body.appendChild(o);
}

function calcQuinta(cartas){
  var suma=0;
  cartas.forEach(function(it){suma+=it.carta.valor});
  while(suma>22){
    var s=0,t=suma;
    while(t>0){s+=t%10;t=Math.floor(t/10)}
    suma=s;
  }
  if(suma<1||suma>22) return null;
  if(suma===22) return BARAJA[0];
  return BARAJA[suma];
}
function textoQuinta(nombre){
  if(typeof QUINTA_BATS!=="undefined"&&QUINTA_BATS[nombre]) return QUINTA_BATS[nombre];
  return null;
}
var PROMPT_AI="Eres un intérprete profesional de tarot Rider-Waite-Smith. Recibirás una tirada con posiciones ya definidas y sus cartas asignadas, incluyendo la quintaesencia ya calculada.\nPara cada posición:\n* Describe brevemente la imagen simbólica de la carta (RWS).\n* Interpreta su significado filtrado por el sentido de esa posición específica.\nAl final, interpreta la quintaesencia como síntesis arquetípica de fondo (nunca como mandato de acción ni predicción).\nNo inventes datos biográficos ni asumas circunstancias no proporcionadas. Si falta información necesaria, indícala explícitamente en vez de suponerla.";
function qHTML(cartas){
  var q=calcQuinta(cartas);
  if(!q) return '<div class="q-box"><div class="q-label">✦ QUINTAESENCIA</div><div class="q-inner"><div style="color:var(--text2)">No calculada</div></div></div>';
  var tq=cartas._qtext||textoQuinta(q.nombre)||txt(q,false);
  return '<div class="q-box"><div class="q-label">✦ QUINTAESENCIA: '+q.nombre+'</div><div class="q-inner">'+imgCard(q)+'<div><div class="q-name">'+q.nombre+'</div><div class="q-text">'+tq+'</div></div></div></div>';
}

function mostrarCompleto(cartas,dest,opts){
  opts=opts||{};
  var html='<div class="card-container">';
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    var pos=it.posicion||(opts.posiciones?opts.posiciones[i]:null);
    var texto=it.texto||txt(c,inv);
    html+='<div class="card-view'+(inv?" invertida":"")+'">'+imgCard(c);
    html+='<div class="card-name">'+c.nombre+'</div>';
    if(pos) html+='<div style="font-size:.72rem;color:var(--gold2);margin-top:2px">'+pos+'</div>';
    if(texto&&opts.mostrarTexto!==false) html+='<div class="card-field">'+texto+'</div>';
    html+='</div>';
  });
  html+='</div>';
  if(opts.mostrarQ!==false) html+=qHTML(cartas);
  document.getElementById(dest).innerHTML=html;
}

function mostrarCruz(cartas,dest,opts){
  opts=opts||{};
  var cls=["cross-center","cross-left","cross-right","cross-top","cross-bottom"];
  var html='<div class="cross-container">';
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida,pos=it.posicion;
    var texto=it.texto||txt(c,inv);
    html+='<div class="card-view'+(inv?" invertida":"")+' '+cls[i]+'">'+imgCard(c);
    html+='<div class="card-name">'+c.nombre+'</div>';
    if(pos) html+='<div style="font-size:.65rem;color:var(--gold2);margin-top:1px;line-height:1.2">'+pos+'</div>';
    if(texto&&opts.mostrarTexto!==false) html+='<div class="card-field" style="font-size:.7rem">'+texto+'</div>';
    html+='</div>';
  });
  html+='</div>';
  if(opts.mostrarQ!==false) html+=qHTML(cartas);
  document.getElementById(dest).innerHTML=html;
}

function guardarHist(tipo,cartas,descripcion,titulo){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var sit=document.getElementById('situacion-'+window._lastPanel)?.value||'';
  var acc=document.getElementById('accion-'+window._lastPanel)?.value||'';
  var tipo_rel=document.getElementById('tipo-'+window._lastPanel)?.value||'';
  var anot=document.getElementById('anotaciones-'+window._lastPanel)?.value||'';
  var obs=document.getElementById('observado-'+window._lastPanel)?.value||'';
  h.unshift({fecha:new Date().toISOString(),tipo:tipo,descripcion:descripcion||"",titulo:titulo||"",situacion:sit,accion:acc,tipo_rel:tipo_rel,anotaciones:anot,observado:obs,cartas:cartas.map(function(it){
    return {nombre:it.carta.nombre,img:it.carta.img,valor:it.carta.valor,tipo:it.carta.tipo,nucleo:it.carta.nucleo,letras:it.carta.letras,invertida:it.invertida,posicion:it.posicion,texto:it.texto||txt(it.carta,it.invertida)};
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
  return '<button class="btn btn-outline btn-sm" onclick="guardarHist(\''+tipo.replace(/'/g,"\\'")+'\',window._ult,document.getElementById(\'desc-\'+window._lastPanel)&&document.getElementById(\'desc-\'+window._lastPanel).value||\'\',document.getElementById(\'titulo-\'+window._lastPanel)&&document.getElementById(\'titulo-\'+window._lastPanel).value||\'\');return false">Guardar en historial</button>';
}
function btnMD(titulo,panelId){
  var esc=titulo.replace(/'/g,"\\'");
  return '<button class="btn btn-outline btn-sm" onclick="descargarMD(\''+esc+'\',window._ult,document.getElementById(\'desc-'+panelId+'\')&&document.getElementById(\'desc-'+panelId+'\').value||\'\',document.getElementById(\'situacion-'+panelId+'\')&&document.getElementById(\'situacion-'+panelId+'\').value||\'\',document.getElementById(\'accion-'+panelId+'\')&&document.getElementById(\'accion-'+panelId+'\').value||\'\',document.getElementById(\'tipo-'+panelId+'\')&&document.getElementById(\'tipo-'+panelId+'\').value||\'\',document.getElementById(\'anotaciones-'+panelId+'\')&&document.getElementById(\'anotaciones-'+panelId+'\').value||\'\',document.getElementById(\'observado-'+panelId+'\')&&document.getElementById(\'observado-'+panelId+'\').value||\'\')">Descargar MD</button>';
}
function btnHTML(titulo,panelId){
  var esc=titulo.replace(/'/g,"\\'");
  return '<button class="btn btn-outline btn-sm" onclick="descargarHTML(\''+esc+'\',window._ult,document.getElementById(\'desc-'+panelId+'\')&&document.getElementById(\'desc-'+panelId+'\').value||\'\',document.getElementById(\'situacion-'+panelId+'\')&&document.getElementById(\'situacion-'+panelId+'\').value||\'\',document.getElementById(\'accion-'+panelId+'\')&&document.getElementById(\'accion-'+panelId+'\').value||\'\',document.getElementById(\'tipo-'+panelId+'\')&&document.getElementById(\'tipo-'+panelId+'\').value||\'\',document.getElementById(\'anotaciones-'+panelId+'\')&&document.getElementById(\'anotaciones-'+panelId+'\').value||\'\',document.getElementById(\'observado-'+panelId+'\')&&document.getElementById(\'observado-'+panelId+'\').value||\'\')">Descargar HTML</button>';
}
function btnAI(titulo,panelId){
  var esc=titulo.replace(/'/g,"\\'");
  return '<button class="btn btn-outline btn-sm" onclick="descargarAI(\''+esc+'\',window._ult)">Descargar IA</button>';
}
function btnCompartir(titulo){
  return '<button class="btn btn-outline btn-sm" onclick="compartirTirada()">Compartir</button>';
}
function cuadernoHTML(panelId){
  var cntId='cnt-'+panelId;
  return '<div class="cuaderno-section"><h4 style="color:var(--gold);margin:0 0 8px;font-size:.9rem">Cuaderno de reflexiones</h4><div class="form-group"><label for="anotaciones-'+panelId+'">Anotaciones</label><div class="char-counter"><textarea id="anotaciones-'+panelId+'" class="input-desc" maxlength="300" placeholder="Escribe lo que consideres sobre esta tirada..." oninput="updateCounter(this,\''+cntId+'\')"></textarea><span class="counter-text" id="'+cntId+'">0/300</span></div></div><div class="form-group"><label for="observado-'+panelId+'">Lo observado</label><textarea id="observado-'+panelId+'" class="input-desc" maxlength="500" placeholder="Escribe después lo que has visto o vivido respecto a lo que entendiste..."></textarea></div></div>';
}
function ponerBotones(dest,titulo,panelId){
  var el=document.getElementById(dest);
  el.innerHTML+=cuadernoHTML(panelId)+'<div class="btn-group mt-8">'+btnMD(titulo,panelId)+btnHTML(titulo,panelId)+btnAI(titulo,panelId)+btnCompartir(titulo)+btnGuardar(titulo)+'</div>';
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
  var q=calcQuinta(cartas);
  if(q) md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n"+(cartas._qtext||textoQuinta(q.nombre)||txt(q,false))+"\n\n";
  if(cartas._interp) md+="### ✦ Interpretación\n\n"+cartas._interp+"\n\n";
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
    cardsHTML+='<img src="'+BATS_BASE+c.img+'" alt="'+c.nombre+'">';
    cardsHTML+='<div class="cn">'+c.nombre+(inv?' <small>(inv)</small>':'')+'</div>';
    if(pos) cardsHTML+='<div class="cp">'+pos+'</div>';
    cardsHTML+='<div class="ct">'+txts+'</div></div>';
  });
  var q=calcQuinta(cartas);
  var qH="";
  if(q){
    qH='<div class="q"><div class="ql">✦ QUINTAESENCIA: '+q.nombre+'</div>';
    qH+='<img src="'+BATS_BASE+q.img+'" alt="'+q.nombre+'">';
    qH+='<div class="cn">'+q.nombre+'</div><div class="ct">'+(cartas._qtext||textoQuinta(q.nombre)||txt(q,false))+'</div></div>';
  }
  var wrap=esCruz?"cross-container":"cards";
  var extraCSS=esCruz?".cross-container{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;gap:12px;max-width:520px;margin:16px auto;justify-items:center;align-items:start}.cross-center{grid-column:2;grid-row:2}.cross-left{grid-column:1;grid-row:2}.cross-right{grid-column:3;grid-row:2}.cross-top{grid-column:2;grid-row:1}.cross-bottom{grid-column:2;grid-row:3}.cross-container .card{width:140px}":"";
  var interpH=cartas._interp?'<div class="interp"><div class="ql">✦ INTERPRETACIÓN</div><div class="ct">'+interpParaHTML(cartas._interp)+'</div></div>':"";
  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+titulo+' - BATS</title>';
  html+='<style>body{font-family:sans-serif;background:#0d0a13;color:#e8dcc8;padding:20px;max-width:800px;margin:0 auto}h1{color:#d4a847}.cards{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:16px 0}.card{width:160px;text-align:center;background:#1a1225;border-radius:8px;padding:8px;border:1px solid #2a1a3e}.card.inv img,.card.invertida img{transform:rotate(180deg)}.card img,.q img{width:100%;border-radius:6px}.cn{color:#d4a847;font-weight:600;margin-top:4px;font-size:.9rem}.cp{color:#f0d080;font-size:.75rem;margin-top:2px}.ct{color:#b8a898;font-size:.8rem;margin-top:4px;text-align:left}.q{margin:20px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;text-align:center;max-width:320px}.ql{color:#f0d080;font-weight:600;margin-bottom:8px}.q img{width:80px}.interp{margin:20px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;max-width:620px;text-align:left}.interp .ct{white-space:pre-wrap}.foot{color:#666;font-size:.8rem;text-align:center;margin-top:24px}'+extraCSS+'</style></head><body>';
  html+='<h1>'+titulo+'</h1><p style="color:#b8a898"><em>'+fs+'</em></p>';
  if(descripcion) html+='<p style="font-style:italic;color:#b8a898;margin-bottom:12px">'+descripcion+'</p>';
  if(tipo) html+='<p style="font-style:italic;color:#f0d080;margin-bottom:12px"><strong>Tipo de relación:</strong> '+tipo+'</p>';
  if(situacion) html+='<p style="font-style:italic;color:#f0d080;margin-bottom:12px"><strong>Situación:</strong> '+situacion+'</p>';
  html+='<div class="'+wrap+'">'+cardsHTML+'</div>'+qH+interpH;
  if(accion) html+='<p style="font-style:italic;color:#b8a898;margin-top:12px"><strong>Acción recomendada:</strong> '+accion+'</p>';
  if(anotaciones) html+='<p style="color:#b8a898;margin-top:8px"><strong>Anotaciones:</strong> '+anotaciones+'</p>';
  if(observado) html+='<p style="color:#b8a898;margin-top:8px"><strong>Lo observado:</strong> '+observado+'</p>';
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
  var q=calcQuinta(cartas);
  if(q) md+="\nQuintaesencia: "+q.nombre+"\n";
  if(cartas._interp) md+="\nInterpretación:\n"+cartas._interp+"\n";
  if(acc) md+="\nAcción recomendada: "+acc+"\n";
  if(anot) md+="\nAnotaciones: "+anot+"\n";
  if(obs) md+="\nLo observado: "+obs+"\n";
  downloadBlob(md,"ia-"+slug+"-"+fn+".md","text/markdown");
}

function cargarHist(){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var c=document.getElementById("r-historial");
  var htm='<div class="priv-notice">Las lecturas se guardan solo en este navegador y no se sincronizan. Para conservarlas o trasladarlas a otro dispositivo, usa Exportar.</div>';
  htm+='<div class="hist-controls"><div class="hist-search-row"><input type="text" id="hist-search" placeholder="Palabra clave..." onkeydown="if(event.key===\'Enter\')buscarHist()"><button class="btn btn-outline btn-sm" onclick="buscarHist()">Buscar</button><button class="btn btn-outline btn-sm" onclick="limpiarFiltros()">Limpiar</button></div><div class="hist-filters-row"><select id="hist-tipo"><option value="">Todos los tipos</option><option value="Cruz Diaria">Cruz Diaria</option><option value="Tirada de la relación">Relación</option><option value="BATS Laboral">BATS Laboral</option><option value="El Aprendizaje">Aprendizaje</option><option value="Tirada Personalizada">Personalizada</option><option value="El Arcano Visitante">Arcano Visitante</option></select><label>Desde: <input type="date" id="hist-desde"></label><label>Hasta: <input type="date" id="hist-hasta"></label></div></div>';
  htm+='<div id="hist-listado"></div>';
  c.innerHTML=htm;
  renderHistCards(h);
}
function renderHistCards(arr,fullArr){
  fullArr=fullArr||arr;
  var c=document.getElementById("hist-listado");
  if(!c) return;
  if(!arr.length){c.innerHTML='<p class="subtle">No hay lecturas guardadas.</p>';return}
  var htm='<div class="historial-grid">';
  arr.forEach(function(hr){
    var origIdx=fullArr.indexOf(hr);
    var d=new Date(hr.fecha),fs=d.toLocaleDateString("es-ES",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    var previewImgs=hr.cartas.slice(0,4).map(function(ca){return '<img src="'+ca.img+'" alt="" loading="lazy">'}).join("");
    htm+='<div class="historial-card" onclick="verHist('+origIdx+')">';
    if(previewImgs) htm+='<div class="hc-preview">'+previewImgs+'</div>';
    htm+='<div class="h-fecha">'+fs+'</div><div class="h-tipo">'+(hr.titulo||hr.tipo)+(hr.descripcion?' <span style="font-weight:normal;font-size:.75rem;opacity:.7"> · '+hr.descripcion+'</span>':'')+'</div><div class="h-cartas">'+hr.resumen+'</div></div>';
  });
  htm+='</div>';
  c.innerHTML=htm;
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
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  var htm='<div class="result-box"><h3 style="color:var(--gold);margin-bottom:6px">'+(hr.titulo||hr.tipo)+'</h3>';
  var fs=new Date(hr.fecha).toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  htm+='<p style="color:var(--text-muted);margin-bottom:8px;font-size:.85rem">'+fs+'</p>';
  if(hr.descripcion) htm+='<p style="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem">'+(hr.titulo?hr.tipo+": ":"")+hr.descripcion+'</p>';
  if(hr.tipo_rel) htm+='<p style="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem"><strong>Tipo de relación:</strong> '+hr.tipo_rel+'</p>';
  if(hr.situacion) htm+='<p style="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem"><strong>Situación:</strong> '+hr.situacion+'</p>';
  if(hr.accion) htm+='<p style="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem"><strong>Acción:</strong> '+hr.accion+'</p>';
  if(hr.cartas[0]&&hr.cartas[0].posicion){
    cartas.forEach(function(it){
      var c=it.carta;
      htm+='<div class="card-result"><div class="pos-name">'+(it.posicion||"")+'</div>';
      htm+='<div class="card-name-r">'+c.nombre+(it.invertida?" (inv)":"")+'</div>';
      htm+='<div class="card-msg">'+(it.texto||"\u2014")+'</div></div>';
    });
  }else{
    htm+='<div class="card-container">';
    cartas.forEach(function(it){
      var c=it.carta,inv=it.invertida?" invertida":"";
      htm+='<div class="card-view'+inv+'">'+imgCard(c)+'<div class="card-name">'+c.nombre+(it.invertida?' <span style="color:var(--danger);font-size:.7rem">(inv)</span>':'')+'</div>';
      if(it.texto) htm+='<div class="card-field">'+it.texto+'</div>';
      htm+='</div>';
    });
    htm+='</div>';
  }
  htm+=qHTML(cartas);
  htm+='<div class="cuaderno-section"><h4 style="color:var(--gold);margin:12px 0 6px;font-size:.9rem">Cuaderno de reflexiones</h4>';
  htm+='<div class="form-group"><label for="c-anot-'+i+'">Anotaciones</label><div class="char-counter"><textarea id="c-anot-'+i+'" class="input-desc" maxlength="300" oninput="var c=document.getElementById(\'cnt-'+i+'\');if(c)c.textContent=this.length+\'/300\'" placeholder="Escribe lo que consideres sobre esta tirada...">'+(hr.anotaciones||"")+'</textarea><span class="counter-text" id="cnt-'+i+'">'+(hr.anotaciones||"").length+'/300</span></div></div>';
  htm+='<div class="form-group"><label for="c-obs-'+i+'">Lo observado</label><textarea id="c-obs-'+i+'" class="input-desc" maxlength="500" placeholder="Escribe después lo que has visto o vivido respecto a lo que entendiste...">'+(hr.observado||"")+'</textarea></div>';
  htm+='<div class="btn-group"><button class="btn btn-outline btn-sm" onclick="guardarCuaderno('+i+')">Guardar cambios</button></div></div>';
  htm+='<div class="btn-group mt-8"><button class="btn btn-outline btn-sm" onclick="compartirHist('+i+')">Compartir</button><button class="btn btn-outline btn-sm" onclick="descargarHistMD('+i+')">MD</button><button class="btn btn-outline btn-sm" onclick="descargarHistHTML('+i+')">HTML</button><button class="btn btn-outline btn-sm" onclick="descargarHistAI('+i+')">IA</button><button class="btn btn-outline btn-sm" onclick="cargarHist()">← Volver</button></div></div>';
  document.getElementById("r-historial").innerHTML=htm;
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
  });
  var q=calcQuinta(cartas);
  if(q)md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n"+(textoQuinta(q.nombre)||txt(q,false))+"\n\n";
  if(hr.accion)md+="**Acción recomendada:** "+hr.accion+"\n\n";
  if(hr.anotaciones)md+="**Anotaciones:** "+hr.anotaciones+"\n\n";
  if(hr.observado)md+="**Lo observado:** "+hr.observado+"\n\n";
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
  var q=calcQuinta(window._ult);
  if(q)md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n"+(textoQuinta(q.nombre)||txt(q,false))+"\n\n";
  if(window._ult._interp)md+="### ✦ Interpretación\n\n"+window._ult._interp+"\n\n";
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
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  descargarHTML(hr.titulo||hr.tipo,cartas,hr.descripcion,hr.situacion,hr.accion,hr.tipo_rel,hr.anotaciones,hr.observado);
}
function descargarHistMD(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  descargarMD(hr.titulo||hr.tipo,cartas,hr.descripcion,hr.situacion,hr.accion,hr.tipo_rel,hr.anotaciones,hr.observado);
}
function descargarHistAI(i){
  var h=JSON.parse(lsGet("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  descargarAI(hr.titulo||hr.tipo,cartas);
}
function limpiarHist(){
  if(!confirm("\u00bfEliminar todo el historial?")) return;
  lsDel("bats-hist");
  cargarHist();
  toast("Historial eliminado");
}

function renderConIA(cartas,dest,renderFn,ctx){
  ctx=ctx||{};
  ctx.fecha=ctx.fecha||new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});
  window._lastCtx=ctx;
  var panelId=ctx.panelId||window._lastPanel||"tirada";
  var titulo=ctx.titulo||window._lastPanelTitle||"Tirada";
  if(typeof getAIMode==="undefined"||getAIMode()==="off"){
    renderFn();
    ponerBotones(dest,titulo,panelId);
    return;
  }
  var el=document.getElementById(dest);
  if(el) el.innerHTML='<div class="ai-cargando"><span class="ai-spinner"></span>Interpretando con IA\u2026</div>';
  generarTextosIA(cartas,ctx).then(function(){
    renderFn();
    renderInterpLarga(dest,cartas,ctx);
    ponerBotones(dest,titulo,panelId);
  }).catch(function(e){
    console.error("Error textos IA:",e);
    toast((e&&e.message||"Error de IA")+". Se muestran los textos BATS.",true);
    renderFn();
    renderInterpLarga(dest,cartas,ctx);
    ponerBotones(dest,titulo,panelId);
  });
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
    el.appendChild(cont);
  }
  cont.style.display="";
  cont.innerHTML='<h4 class="ai-interp-title">\u2726 Interpretaci\u00f3n</h4><div class="ai-interp-body"><div class="ai-cargando"><span class="ai-spinner"></span>Generando interpretaci\u00f3n\u2026</div></div>';
  var body=cont.querySelector(".ai-interp-body");
  generarInterpretacionLarga(cartas,ctx).then(function(t){
    cartas._interp=t;
    body.innerHTML='<div class="ai-interp-texto">'+interpParaHTML(t)+'</div>';
  }).catch(function(e){
    console.error("Error interpretacion larga:",e);
    body.innerHTML='<p class="subtle">No se pudo generar la interpretaci\u00f3n'+(e&&e.message?": "+e.message:"")+'</p><div class="ai-interp-btns"><button class="btn btn-outline btn-sm" onclick="reintentarInterp(\''+dest+'\')">Reintentar</button></div>';
  });
}
function interpParaHTML(t){
  return (t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\n{3,}/g,"\n\n").replace(/\n/g,"<br>");
}
function reintentarInterp(dest){
  if(window._ult) renderInterpLarga(dest,window._ult,window._lastCtx||{});
}
function valPanel(id){
  var el=document.getElementById(id);
  return el?el.value:"";
}

function tirarDiaria(){hacerDiaria(false)}
function tirarDiariaInv(){hacerDiaria(true)}
function hacerDiaria(inv){
  var pos=["Centro: energ\u00eda del d\u00eda","Izquierda: qu\u00e9 frenar o minimizar","Derecha: qu\u00e9 impulsar o hacer","Arriba: ayuda disponible","Abajo: posible salida o resultado"];
  var esSombra=[false,true,false,false,false];
  var m=barajar(BARAJA.slice());
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++){var invC=inv?Math.random()<.5:false;c.push({carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSombra[i])});}
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
  var m=barajar(BARAJA.slice());
  if(m.length<4) return;
  var pos=["Energ\u00eda del momento de la relaci\u00f3n","Energ\u00eda de "+p1,"Energ\u00eda de "+p2,"Posible salida o direcci\u00f3n"];
  var c=[];
  for(var i=0;i<4;i++){var invC=inv?Math.random()<.5:false;c.push({carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,false)});}
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
  var pos=["Centro: energ\u00eda laboral del momento","Izquierda: qu\u00e9 frenar o minimizar en el trabajo","Derecha: qu\u00e9 impulsar o hacer en el trabajo","Arriba: ayuda disponible en el trabajo","Abajo: posible salida o resultado laboral"];
  var esSombra=[false,true,false,false,false];
  var m=barajar(BARAJA.slice());
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++){var invC=inv?Math.random()<.5:false;c.push({carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSombra[i])});}
  window._ult=c;
  window._lastPanel="laboral";
  window._lastPanelTitle="BATS Laboral";
  renderConIA(c,"r-laboral",function(){
    mostrarCruz(c,"r-laboral",{posiciones:pos});
  },{titulo:"BATS Laboral",descripcion:valPanel("desc-laboral"),guion:"laboral",panelId:"laboral"});
}

function actPos(){
  var n=parseInt(document.getElementById("pers-cant").value);
  var cont=document.getElementById("campos-posiciones"),h="",vals={};
  for(var i=1;i<=15;i++){var el=document.getElementById("pers-pos-"+i);if(el) vals[i]=el.value}
  for(var i=1;i<=n;i++) h+='<div class="pos-field"><span class="pos-num">'+(i<10?"0":"")+i+'</span><input type="text" id="pers-pos-'+i+'" value="'+(vals[i]||'Posici\u00f3n '+i)+'"></div>';
  cont.innerHTML=h;
}
actPos();
function tirarPers(){
  var n=parseInt(document.getElementById("pers-cant").value);
  var sub=document.querySelector('input[name="pers-subset"]:checked');
  var modo=sub?sub.value:"completo";
  var inv=document.getElementById("pers-inv").checked;
  var titulo=document.getElementById("pers-titulo").value.trim()||"Tirada Personalizada";
  var mazo=crearSub(modo);
  var c=repartir(n,inv,mazo);
  for(var i=1;i<=n;i++){
    var el=document.getElementById("pers-pos-"+i);
    c[i-1].posicion=el?el.value:"Posici\u00f3n "+i;
    c[i-1].texto=txt(c[i-1].carta,c[i-1].invertida,false);
  }
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
  var mazo=crearSub(modo);
  var sit=document.getElementById("situacion-aprendizaje").value.trim();
  if(!sit){toast("Describe la situación que quieres comprender",true);return}
  var m=barajar(mazo.slice());
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
  for(var i=0;i<6;i++){var invC=inv?Math.random()<.5:false;c.push({carta:m[i],invertida:invC,posicion:pos[i],texto:txt(m[i],invC,esSom[i])});}
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
    rres.innerHTML='<div class="ai-cargando"><span class="ai-spinner"></span>Interpretando con IA\u2026</div>';
    generarIAVisitante(carta).then(function(t){
      c._avtexts=t;
      renderAV(carta,num,d,fnac,nombre,dd,t);
      renderInterpLarga("r-arcano-visitante",c,window._lastCtx);
    }).catch(function(e){
      toast((e&&e.message||"Error de IA")+". Se muestran los textos BATS.",true);
      renderAV(carta,num,d,fnac,nombre,dd,null);
      renderInterpLarga("r-arcano-visitante",c,window._lastCtx);
    });
  }else{
    renderAV(carta,num,d,fnac,nombre,dd,null);
  }
}
function renderAV(carta,num,d,fnac,nombre,dd,texts){
  texts=texts||null;
  var res=document.getElementById("r-arcano-visitante");
  var html='<div class="result-box">';
  html+='<div class="q-box"><div class="q-label">✦ TU ARCANO DEL DÍA</div><div class="q-inner">'+imgCard(carta)+'<div><div class="q-name">'+(num<=21?"XIIII".substring(0,num).replace(/^(X*)(I{0,3})(IV|V|VI{0,3})$/,"$1$2$3"):num===22?"0/XXII":num)+" — "+carta.nombre+'</div></div></div></div>';
  html+='<div class="av-calc"><strong>Cálculo:</strong> '+fnac.replace(/\//g,"+").replace(/\+/g," + ")+" + "+dd.replace(/\//g,"+").replace(/\+/g," + ")+" + "+normalizarNombre(nombre)+" = <strong>"+num+"</strong></div>";
  html+='<div class="av-questions">';
  html+='<div class="card-result"><div class="pos-name">¿Qué vienes a mostrarme hoy?</div><div class="card-msg">'+(texts?(texts.q1||"—"):(d?d.normal:"—"))+'</div></div>';
  html+='<div class="card-result"><div class="pos-name">¿Qué patrón conocido me estás ayudando a no repetir hoy?</div><div class="card-msg">'+(texts?(texts.q2||"—"):(d?d.sombra||d.normal:"—"))+'</div></div>';
  html+='<div class="card-result"><div class="pos-name">¿Qué acción consciente me ayuda a escucharte?</div><div class="card-msg">'+(texts?(texts.q3||"—"):(d?d.ayuda||d.normal:"—"))+'</div></div>';
  html+='</div>';
  html+='<div class="ai-interp" id="ai-interp-r-arcano-visitante"></div>';
  html+='<div class="cuaderno-section"><h4 style="color:var(--gold);margin:12px 0 6px;font-size:.9rem">Cuaderno de reflexiones</h4>';
  html+='<div class="form-group"><label for="anotaciones-arcano-visitante">Anotaciones</label><div class="char-counter"><textarea id="anotaciones-arcano-visitante" class="input-desc" maxlength="300" placeholder="Escribe lo que consideres..." oninput="var c=document.getElementById(\'cnt-av\');if(c)c.textContent=this.length+\'/300\'"></textarea><span class="counter-text" id="cnt-av">0/300</span></div></div>';
  html+='<div class="form-group"><label for="observado-arcano-visitante">Lo observado</label><textarea id="observado-arcano-visitante" class="input-desc" maxlength="500" placeholder="Escribe después lo que has visto o vivido..."></textarea></div>';
  html+='</div>';
  html+='<div class="av-disclaimer">El tarot no predice el futuro. Muestra patrones. La decisión siempre es tuya.</div>';
  html+='</div>';
  res.innerHTML=html;
  var btns='<div class="btn-group mt-8">';
  btns+='<button class="btn btn-outline btn-sm" onclick="descargarAV(\'md\')">Descargar MD</button>';
  btns+='<button class="btn btn-outline btn-sm" onclick="descargarAV(\'html\')">Descargar HTML</button>';
  btns+='<button class="btn btn-outline btn-sm" onclick="compartirAV()">Compartir</button>';
  btns+='<button class="btn btn-outline btn-sm" onclick="guardarHist(\'El Arcano Visitante\',window._ult,\'\',\'El Arcano Visitante\')">Guardar</button>';
  btns+='</div>';
  res.innerHTML+=btns;
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
    if(anot)md+="**Anotaciones:** "+anot+"\n\n";
    if(obs)md+="**Lo observado:** "+obs+"\n\n";
    md+="_Generado por BATS Tarot_";
    downloadBlob(md,"bats-arcano-visitante.md","text/markdown");
  }else{
    var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>El Arcano Visitante - BATS</title>';
    html+='<style>body{font-family:sans-serif;background:#0d0a13;color:#e8dcc8;padding:20px;max-width:800px;margin:0 auto}h1{color:#d4a847}h3{color:#d4a847;margin-top:16px}.ct{color:#b8a898;font-size:.9rem;line-height:1.5;margin:4px 0 12px}.foot{color:#666;font-size:.8rem;text-align:center;margin-top:24px}img{width:120px;border-radius:8px;border:2px solid #2a1a3e}</style></head><body>';
    html+='<h1>El Arcano Visitante</h1><p style="color:#b8a898"><em>'+fs+'</em></p>';
    html+='<p><strong>'+num+" — "+c.nombre+'</strong></p><p style="color:#b8a898">Nacimiento: '+fnac+' · Nombre: '+nombre+'</p>';
    html+='<img src="'+BATS_BASE+c.img+'" alt="'+c.nombre+'">';
    var ts=c._avtexts||null;
    html+='<h3>¿Qué vienes a mostrarme hoy?</h3><div class="ct">'+(ts&&ts.q1?ts.q1:(d?d.normal:"—"))+'</div>';
    html+='<h3>¿Qué patrón conocido me estás ayudando a no repetir hoy?</h3><div class="ct">'+(ts&&ts.q2?ts.q2:(d?d.sombra||d.normal:"—"))+'</div>';
    html+='<h3>¿Qué acción consciente me ayuda a escucharte?</h3><div class="ct">'+(ts&&ts.q3?ts.q3:(d?d.ayuda||d.normal:"—"))+'</div>';
    if(inAV)html+='<h3>✦ Interpretación</h3><div class="ct">'+interpParaHTML(inAV)+'</div>';
    if(anot)html+='<h3>Anotaciones</h3><div class="ct">'+anot+'</div>';
    if(obs)html+='<h3>Lo observado</h3><div class="ct">'+obs+'</div>';
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
  if(!res.length){cont.innerHTML='<p class="subtle">No se encontraron cartas con "'+q+'".</p>';return}
  var htm='<p class="subtle">'+res.length+' carta(s):</p>';
  res.forEach(function(r){
    var c=r.carta,d=r.datos;
    htm+='<div class="resultado-ayuda-item"><div style="display:flex;gap:10px;align-items:start;margin-bottom:6px">'+imgCard(c)+'<div><h3>'+c.nombre+'</h3><span class="subtle">'+(c.tipo==="arcano"?"Arcano Mayor":c.nucleo)+'</span></div></div>';
    if(d.normal) htm+='<div class="campo"><strong>Normal</strong><p>'+d.normal+'</p></div>';
    if(d.sombra) htm+='<div class="campo"><strong>Sombra</strong><p>'+d.sombra+'</p></div>';
    if(d.ayuda) htm+='<div class="campo"><strong>Ayuda</strong><p>'+d.ayuda+'</p></div>';
    if(d.invertida) htm+='<div class="campo"><strong>Invertida</strong><p>'+d.invertida+'</p></div>';
    htm+='</div>';
  });
  cont.innerHTML=htm;
}
function mostrarTodas(){
  var cont=document.getElementById("r-ayuda"),htm="";
  var grps={arcano:"Arcanos Mayores",bastos:"Bastos",copas:"Copas",espadas:"Espadas",oros:"Oros"};
  Object.keys(grps).forEach(function(tipo){
    var cartas=BARAJA.filter(function(c){return tipo==="arcano"?c.tipo==="arcano":c.tipo===tipo});
    if(!cartas.length) return;
    htm+='<h3 style="color:var(--gold);margin:12px 0 6px;font-size:1rem">'+grps[tipo]+'</h3>';
    cartas.forEach(function(c){
      var d=batsDe(c);if(!d)return;
      htm+='<div class="resultado-ayuda-item"><div style="display:flex;gap:10px;align-items:start;margin-bottom:6px">'+imgCard(c)+'<div><h3>'+c.nombre+'</h3></div></div>';
      if(d.normal) htm+='<div class="campo"><strong>Normal</strong><p>'+d.normal+'</p></div>';
      if(d.sombra) htm+='<div class="campo"><strong>Sombra</strong><p>'+d.sombra+'</p></div>';
      if(d.ayuda) htm+='<div class="campo"><strong>Ayuda</strong><p>'+d.ayuda+'</p></div>';
      if(d.invertida) htm+='<div class="campo"><strong>Invertida</strong><p>'+d.invertida+'</p></div>';
      htm+='</div>';
    });
  });
  cont.innerHTML=htm;
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
        if(visto===''||compVersiones(v,visto)>0){
          var h=d.historial[v];
          if(contado>0) texto+='<div class="nov-sep"></div>';
          texto+='<h4>'+h.titulo+'</h4><div>'+h.texto+'</div>';
          contado++;
        }
      });
    }
    if(!texto) texto=d.texto||'';
    var m=document.createElement('div');
    m.className='novedades-modal';
    m.innerHTML='<div class="novedades-box"><h3>'+(d.titulo||'Novedades')+'</h3><div class="novedades-texto">'+texto+'</div><button class="btn btn-gold" onclick="this.closest(\'.novedades-modal\').remove();marcarNovedadesVista(\''+d.ultima+'\')">Entendido</button></div>';
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
            banner.innerHTML = 'Nueva versi\u00f3n disponible <button onclick="location.reload()">Actualizar</button>';
            document.body.appendChild(banner);
          }
        });
      });
    });
  }
}

setTimeout(function(){
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
  initSW();
},100);
