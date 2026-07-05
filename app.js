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
function z(n){return n<10?"0"+n:""+n}
function ini(s){return s.replace(/^(La|Los|El|Las|As|Sota|Caballo|Reina|Rey)\s+(de\s+)?/i,"").substring(0,2).toUpperCase()}

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
function txt(c,inv){
  var d=batsDe(c);
  if(!d) return "\u2014";
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
  return '<img src="'+c.img+'" alt="'+c.nombre+'" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="card-placeholder" style="display:none"><div class="cp-name">'+c.letras+'</div><div class="cp-suit">'+(c.tipo==="arcano"?"AM":c.nucleo)+'</div></div>';
}

function calcQuinta(cartas){
  var suma=0;
  cartas.forEach(function(it){suma+=it.carta.valor});
  while(suma>22){
    var s=0,t=suma;
    while(t>0){s+=t%10;t=Math.floor(t/10)}
    suma=s;
  }
  if(suma===0||suma===22) return BARAJA[0];
  if(suma>=1&&suma<=21) return BARAJA[suma];
  return null;
}
function qHTML(cartas){
  var q=calcQuinta(cartas);
  if(!q) return '<div class="q-box"><div class="q-label">✦ QUINTAESENCIA</div><div class="q-inner"><div style="color:var(--text2)">No calculada</div></div></div>';
  return '<div class="q-box"><div class="q-label">✦ QUINTAESENCIA: '+q.nombre+'</div><div class="q-inner">'+imgCard(q)+'<div><div class="q-name">'+q.nombre+'</div><div class="q-text">'+txt(q,false)+'</div></div></div></div>';
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
  var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
  h.unshift({fecha:new Date().toISOString(),tipo:tipo,descripcion:descripcion||"",titulo:titulo||"",cartas:cartas.map(function(it){
    return {nombre:it.carta.nombre,img:it.carta.img,valor:it.carta.valor,tipo:it.carta.tipo,nucleo:it.carta.nucleo,letras:it.carta.letras,invertida:it.invertida,posicion:it.posicion,texto:it.texto||txt(it.carta,it.invertida)};
  }),resumen:cartas.map(function(it){return it.carta.nombre+(it.invertida?"(inv)":"")}).join(", ")});
  if(h.length>50) h=h.slice(0,50);
  localStorage.setItem("bats-hist",JSON.stringify(h));
  toast("\u2713 Guardado en historial");
}

function exportarHist(){
  var h=localStorage.getItem("bats-hist");
  if(!h||h==="[]"){toast("No hay historial para exportar",true);return}
  var f=new Date(),fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate());
  var b=new Blob([h],{type:"application/json;charset=utf-8"});
  var u=URL.createObjectURL(b);
  var a=document.createElement("a");a.href=u;a.download="bats-historial-"+fn+".json";
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(u);
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
        var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
        data.forEach(function(r){h.unshift(r)});
        if(h.length>100) h=h.slice(0,100);
        localStorage.setItem("bats-hist",JSON.stringify(h));
        cargarHist();
        toast("\u2713 "+data.length+" lectura(s) importadas");
      }catch(e){toast("Archivo inv\u00e1lido",true)}
    };
    reader.readAsText(file);
  };
  inp.click();
}

function btnGuardar(tipo,cartas){
  return '<button class="btn btn-outline btn-sm" onclick="guardarHist(\''+tipo.replace(/'/g,"\\'")+'\',window._ult,document.getElementById(\'desc-\'+window._lastPanel)&&document.getElementById(\'desc-\'+window._lastPanel).value||\'\',document.getElementById(\'titulo-\'+window._lastPanel)&&document.getElementById(\'titulo-\'+window._lastPanel).value||\'\');return false">Guardar en historial</button>';
}
function btnMD(titulo){
  return '<button class="btn btn-outline btn-sm" onclick="descargarMD(\''+titulo.replace(/'/g,"\\'")+'\',window._ult)">Descargar MD</button>';
}
function btnHTML(titulo){
  return '<button class="btn btn-outline btn-sm" onclick="descargarHTML(\''+titulo.replace(/'/g,"\\'")+'\',window._ult)">Descargar HTML</button>';
}
function ponerBotones(dest,titulo){
  var cartas = window._ult;
  document.getElementById(dest).innerHTML+='<div class="btn-group mt-8">'+btnMD(titulo)+btnHTML(titulo)+btnGuardar(titulo)+'</div>';
}

var BATS_BASE="https://sugusdeborbon-glitch.github.io/bats-tarot/";
function descargarMD(titulo,cartas,descripcion){
  if(descripcion===undefined){var de=document.getElementById('desc-'+window._lastPanel);descripcion=de?de.value:''}
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate())+"_"+z(f.getHours())+z(f.getMinutes());
  var md="# "+titulo+"\n\n_Fecha: "+fs+"_\n\n";
  if(descripcion) md+="*"+descripcion+"*\n\n";
  cartas.forEach(function(it){
    var c=it.carta,inv=it.invertida,pos=it.posicion;
    md+="### "+(pos?pos+": ":"")+c.nombre+(inv?" (invertida)":"")+"\n\n";
    md+=(it.texto||txt(c,inv)||"\u2014")+"\n\n";
  });
  var q=calcQuinta(cartas);
  if(q) md+="### ✦ Quintaesencia\n\n**"+q.nombre+"**\n\n"+txt(q,false)+"\n\n";
  md+="_Generado por BATS Tarot_";
  var b=new Blob([md],{type:"text/markdown;charset=utf-8"});
  var u=URL.createObjectURL(b);
  var a=document.createElement("a");a.href=u;a.download="bats-"+fn+".md";
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(u);
}
function descargarHTML(titulo,cartas,descripcion){
  if(descripcion===undefined){var de=document.getElementById('desc-'+window._lastPanel);descripcion=de?de.value:''}
  var f=new Date(),fs=f.toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  var fn=f.getFullYear()+"-"+z(f.getMonth()+1)+"-"+z(f.getDate())+"_"+z(f.getHours())+z(f.getMinutes());
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
    qH+='<div class="cn">'+q.nombre+'</div><div class="ct">'+txt(q,false)+'</div></div>';
  }
  var wrap=esCruz?"cross-container":"cards";
  var extraCSS=esCruz?".cross-container{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;gap:12px;max-width:520px;margin:16px auto;justify-items:center;align-items:start}.cross-center{grid-column:2;grid-row:2}.cross-left{grid-column:1;grid-row:2}.cross-right{grid-column:3;grid-row:2}.cross-top{grid-column:2;grid-row:1}.cross-bottom{grid-column:2;grid-row:3}.cross-container .card{width:140px}":"";
  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>'+titulo+' - BATS</title>';
  html+='<style>body{font-family:sans-serif;background:#0d0a13;color:#e8dcc8;padding:20px;max-width:800px;margin:0 auto}h1{color:#d4a847}.cards{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin:16px 0}.card{width:160px;text-align:center;background:#1a1225;border-radius:8px;padding:8px;border:1px solid #2a1a3e}.card.inv img,.card.invertida img{transform:rotate(180deg)}.card img,.q img{width:100%;border-radius:6px}.cn{color:#d4a847;font-weight:600;margin-top:4px;font-size:.9rem}.cp{color:#f0d080;font-size:.75rem;margin-top:2px}.ct{color:#b8a898;font-size:.8rem;margin-top:4px;text-align:left}.q{margin:20px auto;padding:12px;background:#1a1225;border:1px solid #d4a847;border-radius:8px;text-align:center;max-width:320px}.ql{color:#f0d080;font-weight:600;margin-bottom:8px}.q img{width:80px}.foot{color:#666;font-size:.8rem;text-align:center;margin-top:24px}'+extraCSS+'</style></head><body>';
  html+='<h1>'+titulo+'</h1><p style="color:#b8a898"><em>'+fs+'</em></p>';
  if(descripcion) html+='<p style="font-style:italic;color:#b8a898;margin-bottom:12px">'+descripcion+'</p>';
  html+='<div class="'+wrap+'">'+cardsHTML+'</div>'+qH;
  html+='<p class="foot">Generado por BATS Tarot</p></body></html>';
  var b=new Blob([html],{type:"text/html;charset=utf-8"});
  var u=URL.createObjectURL(b);
  var a=document.createElement("a");a.href=u;a.download="bats-"+fn+".html";
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(u);
}

function cargarHist(){
  var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
  var c=document.getElementById("r-historial");
  if(!h.length){c.innerHTML='<p class="subtle">No hay lecturas guardadas.</p>';return}
  var htm='<div class="historial-grid">';
  h.forEach(function(hr,i){
    var d=new Date(hr.fecha),fs=d.toLocaleDateString("es-ES",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
    var previewImgs = hr.cartas.slice(0,4).map(function(ca){return '<img src="'+ca.img+'" alt="" loading="lazy">'}).join("");
    htm+='<div class="historial-card" onclick="verHist('+i+')">';
    if(previewImgs) htm+='<div class="hc-preview">'+previewImgs+'</div>';
    htm+='<div class="h-fecha">'+fs+'</div><div class="h-tipo">'+(hr.titulo||hr.tipo)+(hr.descripcion?' <span style="font-weight:normal;font-size:.75rem;opacity:.7"> · '+hr.descripcion+'</span>':'')+'</div><div class="h-cartas">'+hr.resumen+'</div></div>';
  });
  htm+='</div>';
  c.innerHTML=htm;
}
function verHist(i){
  var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  var htm='<div class="result-box"><h3 style="color:var(--gold);margin-bottom:6px">'+(hr.titulo||hr.tipo)+'</h3>';
  if(hr.descripcion) htm+='<p style="font-style:italic;color:var(--text-muted);margin-bottom:8px;font-size:.9rem">'+(hr.titulo?hr.tipo+": ":"")+hr.descripcion+'</p>';
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
  htm+='<div class="btn-group mt-8"><button class="btn btn-outline btn-sm" onclick="descargarHistMD('+i+')">Descargar MD</button><button class="btn btn-outline btn-sm" onclick="descargarHistHTML('+i+')">Descargar HTML</button><button class="btn btn-outline btn-sm" onclick="cargarHist()">← Volver</button></div></div>';
  document.getElementById("r-historial").innerHTML=htm;
}
function descargarHistHTML(i){
  var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  descargarHTML(hr.titulo||hr.tipo,cartas,hr.descripcion);
}
function descargarHistMD(i){
  var h=JSON.parse(localStorage.getItem("bats-hist")||"[]");
  var hr=h[i];if(!hr)return;
  var cartas=hr.cartas.map(function(it){return{carta:it,invertida:it.invertida,texto:it.texto,posicion:it.posicion}});
  descargarMD(hr.titulo||hr.tipo,cartas,hr.descripcion);
}
function limpiarHist(){
  if(!confirm("\u00bfEliminar todo el historial?")) return;
  localStorage.removeItem("bats-hist");
  cargarHist();
  toast("Historial eliminado");
}

function tirarDiaria(){hacerDiaria(false)}
function tirarDiariaInv(){hacerDiaria(true)}
function hacerDiaria(inv){
  var pos=["Centro: energ\u00eda del d\u00eda","Izquierda: qu\u00e9 frenar o minimizar","Derecha: qu\u00e9 impulsar o hacer","Arriba: ayuda disponible","Abajo: posible salida o resultado"];
  var m=barajar(BARAJA.slice());
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++) c.push({carta:m[i],invertida:inv?Math.random()<.5:false,posicion:pos[i]});
  c.forEach(function(it){it.texto=txt(it.carta,it.invertida)});
  mostrarCruz(c,"r-diaria",{posiciones:pos});
  window._ult=c;
  window._lastPanel="diaria";
  ponerBotones("r-diaria","Cruz Diaria");
}

function tirarRelacion(){
  var p1=document.getElementById("rel-p1").value||"Persona 1",p2=document.getElementById("rel-p2").value||"Persona 2";
  localStorage.setItem("bats-rel-p1",p1);
  localStorage.setItem("bats-rel-p2",p2);
  var inv=document.getElementById("rel-inv").checked;
  var m=barajar(BARAJA.slice());
  if(m.length<4) return;
  var pos=["Energ\u00eda del momento de la relaci\u00f3n","Energ\u00eda de "+p1,"Energ\u00eda de "+p2,"Posible salida o direcci\u00f3n"];
  var c=[];
  for(var i=0;i<4;i++) c.push({carta:m[i],invertida:inv?Math.random()<.5:false,posicion:pos[i]});
  c.forEach(function(it){it.texto=txt(it.carta,it.invertida)});
  mostrarCompleto(c,"r-relacion",{posiciones:pos});
  window._ult=c;
  window._lastPanel="rel";
  ponerBotones("r-relacion","Tirada de la relaci\u00f3n");
}
function tirarLaboral(){hacerLaboral(false)}
function tirarLaboralInv(){hacerLaboral(true)}
function hacerLaboral(inv){
  var pos=["Centro: energ\u00eda laboral del momento","Izquierda: qu\u00e9 frenar o minimizar en el trabajo","Derecha: qu\u00e9 impulsar o hacer en el trabajo","Arriba: ayuda disponible en el trabajo","Abajo: posible salida o resultado laboral"];
  var m=barajar(BARAJA.slice());
  if(m.length<5) return;
  var c=[];
  for(var i=0;i<5;i++) c.push({carta:m[i],invertida:inv?Math.random()<.5:false,posicion:pos[i]});
  c.forEach(function(it){it.texto=txt(it.carta,it.invertida)});
  mostrarCruz(c,"r-laboral",{posiciones:pos});
  window._ult=c;
  window._lastPanel="laboral";
  ponerBotones("r-laboral","BATS Laboral");
}

function actPos(){
  var n=parseInt(document.getElementById("pers-cant").value);
  var cont=document.getElementById("campos-posiciones"),h="";
  for(var i=1;i<=n;i++) h+='<div class="pos-field"><span class="pos-num">'+(i<10?"0":"")+i+'</span><input type="text" id="pers-pos-'+i+'" value="Posici\u00f3n '+i+'"></div>';
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
    c[i-1].texto=txt(c[i-1].carta,c[i-1].invertida);
  }
  mostrarCompleto(c,"r-pers");
  window._ult=c;
  window._lastPanel="pers";
  ponerBotones("r-pers",titulo);
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

function initSW(){
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
  if(rp1){rp1.value=localStorage.getItem("bats-rel-p1")||"Persona 1"}
  if(rp2){rp2.value=localStorage.getItem("bats-rel-p2")||"Persona 2"}
  if(document.getElementById("r-ayuda")) mostrarTodas();
  if(document.getElementById("r-historial")) cargarHist();
  initSW();
},100);
