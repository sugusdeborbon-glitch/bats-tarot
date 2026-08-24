var STORE_PFX=(function(){return location.pathname.indexOf("/bats-tarot-dev/")!==-1?"dev_":""})();
function lsGet(k){try{return localStorage.getItem(STORE_PFX+k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(STORE_PFX+k,v)}catch(e){}}
function lsDel(k){try{localStorage.removeItem(STORE_PFX+k)}catch(e){}}

var AI_MODE_KEY="bats-ai-mode";
var AI_CFG_KEY="bats-ai-cfg";
var AI_WORKER_URL_KEY="bats-ai-worker";
var AI_KEY_SEED="BATS_2026_v1";
var AI_WORKER_DEFAULT="https://bats-tarot-ai.bats-tarot.workers.dev";
var AI_WORKER_DEFAULT_DEV="https://bats-tarot-ai-dev.bats-tarot.workers.dev";
var AI_WORKER_TOKEN="cc983d628f91dd472207d8b210489722e6d6";

var AI_PROVIDERS=[
  {id:"openai",nombre:"OpenAI",base:"https://api.openai.com/v1",modelo:"gpt-4o-mini"},
  {id:"groq",nombre:"Groq",base:"https://api.groq.com/openai/v1",modelo:"llama-3.3-70b-versatile"},
  {id:"nvidia",nombre:"NVIDIA build.nvidia.com",base:"https://integrate.api.nvidia.com/v1",modelo:"meta/llama-3.1-8b-instruct"},
  {id:"openrouter",nombre:"OpenRouter",base:"https://openrouter.ai/api/v1",modelo:"deepseek/deepseek-chat"},
  {id:"mistral",nombre:"Mistral",base:"https://api.mistral.ai/v1",modelo:"mistral-small-latest"},
  {id:"ollama",nombre:"Ollama (local)",base:"http://localhost:11434/v1",modelo:"llama3"}
];

function getAIMode(){return lsGet(AI_MODE_KEY)||"off"}
function setAIMode(m){lsSet(AI_MODE_KEY,m)}
function modoDesc(m){
  if(m==="estandar") return "Interpretaci\u00f3n con IA BATS \u2014 textos generados al momento.";
  if(m==="propia") return "Interpretaci\u00f3n con tu propia clave de IA (proveedor compatible con OpenAI).";
  return "Textos fijos del sistema BATS (sin conexi\u00f3n).";
}

function aiXor(s){
  var r="";
  for(var i=0;i<s.length;i++) r+=String.fromCharCode(s.charCodeAt(i)^AI_KEY_SEED.charCodeAt(i%AI_KEY_SEED.length));
  return r;
}
function aiEncr(s){return btoa(aiXor(s))}
function aiDecr(s){try{return aiXor(atob(s))}catch(e){return ""}}

function getAICfg(){try{return JSON.parse(lsGet(AI_CFG_KEY))||{}}catch(e){return {}}}
function saveAICfg(o){lsSet(AI_CFG_KEY,JSON.stringify(o))}

function defaultWorkerURL(){
  if(location.pathname.indexOf("/bats-tarot-dev/")!==-1||/bats-tarot-dev/i.test(location.hostname||"")) return AI_WORKER_DEFAULT_DEV;
  return AI_WORKER_DEFAULT;
}
function getWorkerURL(){return lsGet(AI_WORKER_URL_KEY)||defaultWorkerURL()}
function setWorkerURL(u){lsSet(AI_WORKER_URL_KEY,u)}

function getProvider(id){
  for(var i=0;i<AI_PROVIDERS.length;i++) if(AI_PROVIDERS[i].id===id) return AI_PROVIDERS[i];
  return AI_PROVIDERS[0];
}
function getAIPropia(){
  var c=getAICfg(),p=getProvider(c.provider||"openai");
  return {provider:p.id,base:c.base||p.base,modelo:c.modelo||p.modelo,key:c.key?aiDecr(c.key):""};
}
function guardarAIPropia(){
  var provider=document.getElementById("cfg-provider").value;
  var base=document.getElementById("cfg-endpoint").value.trim().replace(/\/$/,"");
  var modelo=document.getElementById("cfg-modelo").value.trim();
  var key=document.getElementById("cfg-key").value.trim();
  if(!base){toast("Introduce el endpoint del proveedor",true);return}
  if(!modelo){toast("Introduce el modelo",true);return}
  var cfg=getAICfg();
  cfg.provider=provider;
  cfg.base=base;
  cfg.modelo=modelo;
  if(key) cfg.key=aiEncr(key);
  saveAICfg(cfg);
  document.getElementById("cfg-key").value="";
  cargarPanelConfig();
  toast("\u2713 Configuraci\u00f3n de IA guardada");
}
function borrarAIPropia(){
  if(!confirm("\u00bfEliminar tu clave de IA guardada?")) return;
  var cfg=getAICfg();
  delete cfg.key;
  saveAICfg(cfg);
  cargarPanelConfig();
  toast("Clave eliminada");
}
function guardarWorkerURL(){
  var u=document.getElementById("cfg-worker").value.trim().replace(/\/$/,"");
  if(!u){toast("Introduce la URL del Worker",true);return}
  setWorkerURL(u);
  toast("\u2713 URL del Worker guardada");
}
function cambioProveedor(){
  var p=getProvider(document.getElementById("cfg-provider").value);
  document.getElementById("cfg-endpoint").value=p.base;
  document.getElementById("cfg-modelo").value=p.modelo;
}
function cargarPanelConfig(){
  var cfg=getAICfg(),p=getProvider(cfg.provider||"openai");
  var elSel=document.getElementById("cfg-provider");
  if(elSel) elSel.value=cfg.provider||"openai";
  var elEp=document.getElementById("cfg-endpoint");
  if(elEp) elEp.value=cfg.base||p.base;
  var elM=document.getElementById("cfg-modelo");
  if(elM) elM.value=cfg.modelo||p.modelo;
  var elW=document.getElementById("cfg-worker");
  if(elW) elW.value=lsGet(AI_WORKER_URL_KEY)||defaultWorkerURL();
  var st=document.getElementById("cfg-key-status");
  if(st) st.innerHTML=cfg.key?'<span style="color:var(--gold)">\u2713 Clave guardada</span>':'<span class="subtle">Sin clave guardada</span>';
  cargarAIInterpretacion();
}

function llamarIA(payload,tipo){
  var mode=getAIMode();
  var esMensajes=Array.isArray(payload);
  var body=esMensajes?{messages:payload,tipo:tipo||""}:{tipo:tipo||"",user:payload.user};
  if(mode==="estandar"){
    var url=getWorkerURL();
    if(!url||!/^https:\/\//i.test(url)) return Promise.reject(new Error("URL del Worker de IA inv\u00e1lida o vac\u00eda. Rev\u00edsala en Configuraci\u00f3n."));
    return fetchConTimeout(url,body,{token:AI_WORKER_TOKEN});
  }
  if(mode==="propia"){
    var cfg=getAIPropia();
    if(!cfg.key) return Promise.reject(new Error("No hay clave configurada"));
    var url2=getWorkerURL();
    if(!url2||!/^https:\/\//i.test(url2)) return Promise.reject(new Error("URL del Worker de IA inv\u00e1lida o vac\u00eda. Rev\u00edsala en Configuraci\u00f3n."));
    body.mode="propia";
    body.base=cfg.base;
    body.model=cfg.modelo;
    return fetchConTimeout(url2,body,{token:AI_WORKER_TOKEN,key:cfg.key});
  }
  return Promise.reject(new Error("Modo IA desactivado"));
}
function fetchConTimeout(url,body,extra){
  var ctrl=("AbortController" in window)?new AbortController():null;
  var timer=ctrl?setTimeout(function(){ctrl.abort()},60000):null;
  function limpiar(){if(timer) clearTimeout(timer)}
  function status(s){try{if(window._iaStatus) window._iaStatus(s)}catch(e){}}
  var opts={
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  };
  if(extra&&extra.key) opts.headers["Authorization"]="Bearer "+extra.key;
  if(extra&&extra.token) opts.headers["X-BATS-Token"]=extra.token;
  if(ctrl) opts.signal=ctrl.signal;
  status("Enviando petici\u00f3n al servidor de IA\u2026");
  var p;
  try{ p=fetch(url,opts); }
  catch(e){ limpiar(); return Promise.reject(new Error("URL del servidor de IA inv\u00e1lida. Rev\u00edsala en Configuraci\u00f3n.")); }
  return p.then(function(r){status("Respuesta recibida, procesando\u2026");return parseAIRespuesta(r)}).then(function(v){limpiar();return v},function(e){
    limpiar();
    status("error");
    if(e&&e.name==="AbortError") throw new Error("La IA tard\u00f3 demasiado. Reintenta.");
    throw e;
  });
}
function parseAIRespuesta(r){
  return r.text().then(function(txt){
    var data;
    try{data=JSON.parse(txt)}catch(e){throw new Error("Respuesta no v\u00e1lida del servidor IA")}
    if(!r.ok) throw new Error(data.error||"Error del servidor IA");
    var content=data.content||(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"";
    if(!content) throw new Error("Respuesta IA vac\u00eda");
    _ultimaIA={provider:(data.provider||""),modelo:(data.modelo||"")};
    return content;
  });
}
var _ultimaIA={provider:"",modelo:""};
function esEntornoDev(){
  return location.pathname.indexOf("/bats-tarot-dev/")!==-1||/bats-tarot-dev/i.test(location.hostname||"");
}
function etiquetaIA(){
  if(getAIMode()==="propia") return _ultimaIA.modelo||_ultimaIA.provider||"";
  if(esEntornoDev()) return _ultimaIA.modelo||_ultimaIA.provider||"";
  return _ultimaIA.provider||_ultimaIA.modelo||"";
}
function extraerJSON(texto){
  var t=texto.trim();
  var m=t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(m) t=m[1].trim();
  var ini=t.indexOf("{"),fin=t.lastIndexOf("}");
  if(ini>=0&&fin>ini) t=t.substring(ini,fin+1);
  return JSON.parse(t);
}
function construirUserContent(cartas,ctx){
  var lines=[];
  if(ctx.titulo) lines.push("Tirada: "+ctx.titulo);
  if(ctx.fecha) lines.push("Fecha: "+ctx.fecha);
  if(ctx.descripcion) lines.push("Descripci\u00f3n: "+ctx.descripcion);
  if(ctx.situacion) lines.push("Situaci\u00f3n: "+ctx.situacion);
  if(ctx.p1) lines.push("Persona 1: "+ctx.p1);
  if(ctx.p2) lines.push("Persona 2: "+ctx.p2);
  if(ctx.tipoRel) lines.push("Tipo de relaci\u00f3n: "+ctx.tipoRel);
  if(ctx.accion) lines.push("Acci\u00f3n recomendada (contexto del consultante): "+ctx.accion);
  if(ctx.anotaciones) lines.push("Anotaciones: "+ctx.anotaciones);
  if(ctx.observado) lines.push("Lo observado: "+ctx.observado);
  lines.push("");
  lines.push("Posiciones y cartas (con referencia BATS):");
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    lines.push((i+1)+". ["+i+"] "+(it.posicion||"Posici\u00f3n "+(i+1))+": "+c.nombre+(inv?" (INVERTIDA)":""));
    var ref=(it.texto||txt(c,inv,false)||"").replace(/\s+/g," ").trim();
    if(ref) lines.push("   Referencia BATS: "+ref);
  });
  var q=cartas._q;
  if(q){
    lines.push("");
    lines.push("Quintaesencia calculada: "+q.nombre);
    var refQ=(typeof QUINTA_BATS!=="undefined"&&QUINTA_BATS[q.nombre])?QUINTA_BATS[q.nombre]:null;
    if(refQ) lines.push("Referencia BATS de la quintaesencia: "+refQ.replace(/\s+/g," ").trim());
  }
  return lines.join("\n");
}
function generarTextosIA(cartas,ctx){
  ctx=ctx||{};
  if(typeof comodinPendiente==="function"&&comodinPendiente(cartas)){
    cartas._q=null;cartas._qtext="";
  } else {
    var q=calcQuinta(cartas);
    if(q) cartas._q=q;
  }
  return llamarIA({user:construirUserContent(cartas,ctx)},ctx.guion||"corta").then(extraerJSON).then(function(data){
    var pos=data.posiciones||[],map={};
    pos.forEach(function(p){if(p&&p.i!=null) map[p.i]=p.texto});
    cartas.forEach(function(it,i){if(map[i]) it.texto=map[i]});
    cartas._qtext=data.quintaesencia||"";
    return cartas;
  });
}
function generarIAVisitante(carta){
  var d=batsDe(carta);
  var user="El Arcano Visitante del d\u00eda es: "+carta.nombre+" (Arcano Mayor).";
  if(d&&d.normal) user+="\nReferencia BATS (lectura normal): "+d.normal;
  if(d&&(d.sombra||d.normal)) user+="\nReferencia BATS (sombra): "+(d.sombra||d.normal);
  if(d&&(d.ayuda||d.normal)) user+="\nReferencia BATS (ayuda): "+(d.ayuda||d.normal);
  return llamarIA({user:user},"av").then(extraerJSON);
}
function probarConexionIA(btn){
  var b=btn||null;
  var orig=b?b.textContent:"";
  if(b){b.disabled=true;b.textContent="Probando\u2026"}
  llamarIA([
    {role:"system",content:"Eres una IA de tarot. Responde en espa\u00f1ol con una frase completa y natural."},
    {role:"user",content:"\u00bfQu\u00e9 representa El Mago en una tirada?"}
  ]).then(function(){
    if(b){b.disabled=false;b.textContent=orig}
    toast("\u2713 Conexi\u00f3n con la IA correcta");
  },function(e){
    if(b){b.disabled=false;b.textContent=orig}
    toast((e&&e.message||"Error de conexi\u00f3n")+". Revisa la configuraci\u00f3n.",true);
  });
}
function elegirAIModo(m,btn){
  setAIMode(m);
  actualizarUI_AI();
}
function actualizarUI_AI(){
  var mode=getAIMode();
  document.querySelectorAll(".ai-opt").forEach(function(b){
    b.classList.toggle("active",b.getAttribute("data-ai")===mode);
  });
  var d=document.getElementById("ai-desc-inicio");
  if(d) d.textContent=modoDesc(mode);
  var r=document.getElementById("cfg-"+mode);
  if(r) r.checked=true;
  var eb=document.getElementById("cfg-estandar-box");
  if(eb) eb.style.display=(mode==="estandar")?"block":"none";
  var pb=document.getElementById("cfg-propia-box");
  if(pb) pb.style.display=(mode==="propia")?"block":"none";
}

var AI_LONG_KEY="bats-ai-long";


function getAILong(){try{return JSON.parse(lsGet(AI_LONG_KEY))||{}}catch(e){return {}}}
function saveAILong(o){lsSet(AI_LONG_KEY,JSON.stringify(o))}
function guardarAILong(){
  var elLen=document.getElementById("cfg-interp-len");
  var len=elLen?elLen.value:"media";
  var enfoque=(document.getElementById("cfg-interp-enfoque")||{}).value;
  enfoque=(enfoque||"").trim();
  var o=getAILong();
  o.len=len;
  if(enfoque) o.enfoque=enfoque; else delete o.enfoque;
  saveAILong(o);
  cargarPanelConfig();
  toast("\u2713 Interpretaci\u00f3n larga guardada");
}
function cargarAIInterpretacion(){
  var o=getAILong();
  var elLen=document.getElementById("cfg-interp-len");
  if(elLen) elLen.value=o.len||"media";
  var elEnf=document.getElementById("cfg-interp-enfoque");
  if(elEnf) elEnf.value=o.enfoque||"";
}
function interpLenInstruccion(){
  var o=getAILong();
  if(o.len==="corta") return "Extensi\u00f3n: breve, alrededor de 500 caracteres (1 p\u00e1rrafo).";
  if(o.len==="larga") return "Extensi\u00f3n: extensa, alrededor de 3000 caracteres (5-7 p\u00e1rrafos).";
  return "Extensi\u00f3n: media, alrededor de 1500 caracteres (3-4 p\u00e1rrafos).";
}
function construirUserContentLargo(cartas,ctx){
  var lines=[];
  if(ctx.titulo) lines.push("Tirada: "+ctx.titulo);
  if(ctx.fecha) lines.push("Fecha: "+ctx.fecha);
  if(ctx.descripcion) lines.push("Descripci\u00f3n: "+ctx.descripcion);
  if(ctx.situacion) lines.push("Situaci\u00f3n: "+ctx.situacion);
  if(ctx.p1) lines.push("Persona 1: "+ctx.p1);
  if(ctx.p2) lines.push("Persona 2: "+ctx.p2);
  if(ctx.tipoRel) lines.push("Tipo de relaci\u00f3n: "+ctx.tipoRel);
  if(ctx.numero) lines.push("Arcano n\u00famero: "+ctx.numero);
  lines.push("");
  lines.push("Lista de cartas con nombre de posici\u00f3n y Referencia BATS:");
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    lines.push((i+1)+". "+(it.posicion||"Posici\u00f3n "+(i+1))+": "+c.nombre+(inv?" (INVERTIDA)":""));
    var ref=(it.texto||(typeof txt==="function"?txt(c,inv,false):"")||"").replace(/\s+/g," ").trim();
    if(ref) lines.push("   Referencia BATS: "+ref);
  });
  var q=cartas._q;
  if(q){
    lines.push("");
    lines.push("Quintaesencia calculada: "+q.nombre);
    var refQ=(typeof QUINTA_BATS!=="undefined"&&QUINTA_BATS[q.nombre])?QUINTA_BATS[q.nombre]:null;
    if(refQ) lines.push("Referencia BATS de la quintaesencia: "+refQ.replace(/\s+/g," ").trim());
  }
  var o=getAILong();
  if(o.enfoque){lines.push("");lines.push("Enfoque solicitado por el consultante: "+o.enfoque);}
  lines.push("");
  lines.push("Formato de respuesta: texto plano en espa\u00f1ol, sin markdown (sin *, # ni **). Usa l\u00edneas en blanco para separar secciones.");
  lines.push(interpLenInstruccion());
  return lines.join("\n");
}
function construirUserContentComodinLargo(cartas,extCartas,ctx){
  var lines=[];
  if(ctx.titulo) lines.push("Tirada: "+ctx.titulo);
  if(ctx.fecha) lines.push("Fecha: "+ctx.fecha);
  if(ctx.descripcion) lines.push("Descripci\u00f3n: "+ctx.descripcion);
  if(ctx.situacion) lines.push("Situaci\u00f3n: "+ctx.situacion);
  if(ctx.p1) lines.push("Persona 1: "+ctx.p1);
  if(ctx.p2) lines.push("Persona 2: "+ctx.p2);
  if(ctx.tipoRel) lines.push("Tipo de relaci\u00f3n: "+ctx.tipoRel);
  lines.push("");
  lines.push("IMPORTANTE: Esta tirada incluye un COMOD\u00cdN que ya fue resuelto con una extensi\u00f3n de 3 cartas.");
  lines.push("Debes generar DOS secciones en tu respuesta:");
  lines.push("");
  lines.push("--- SECCI\u00d3N 1: Lectura de la extensi\u00f3n del Comod\u00edn ---");
  lines.push("Interpreta solo las 3 cartas de la extensi\u00f3n (NO la tirada completa).");
  lines.push("Cada carta responde a una pregunta espec\u00edfica. Interpreta cada una individualmente.");
  lines.push("");
  lines.push("Cartas de la extensi\u00f3n:");
  extCartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    lines.push((i+1)+". "+it.posicion+": "+c.nombre+(inv?" (INVERTIDA)":""));
    var ref=(it.texto||(typeof txt==="function"?txt(c,inv,false):"")||"").replace(/\s+/g," ").trim();
    if(ref) lines.push("   Referencia BATS: "+ref);
  });
  lines.push("");
  lines.push("--- SECCI\u00d3N 2: Lectura integrada de la tirada completa ---");
  lines.push("Interpreta la tirada completa. La Salida (la tercera carta de la extensi\u00f3n) reemplaza al Comod\u00edn en su posici\u00f3n original.");
  lines.push("La quintaesencia ya fue recalculada con La Salida.");
  lines.push("");
  lines.push("Tirada completa (Comod\u00edn \u2192 La Salida):");
  cartas.forEach(function(it,i){
    var c=it.carta,inv=it.invertida;
    lines.push((i+1)+". "+(it.posicion||"Posici\u00f3n "+(i+1))+": "+c.nombre+(inv?" (INVERTIDA)":""));
    var ref=(it.texto||(typeof txt==="function"?txt(c,inv,false):"")||"").replace(/\s+/g," ").trim();
    if(ref) lines.push("   Referencia BATS: "+ref);
  });
  var q=cartas._q;
  if(q){
    lines.push("");
    lines.push("Quintaesencia calculada: "+q.nombre);
    var refQ=(typeof QUINTA_BATS!=="undefined"&&QUINTA_BATS[q.nombre])?QUINTA_BATS[q.nombre]:null;
    if(refQ) lines.push("Referencia BATS de la quintaesencia: "+refQ.replace(/\s+/g," ").trim());
  }
  var o=getAILong();
  if(o.enfoque){lines.push("");lines.push("Enfoque solicitado por el consultante: "+o.enfoque);}
  lines.push("");
  lines.push("Formato de respuesta: texto plano en espa\u00f1ol, sin markdown (sin *, # ni **).");
  lines.push("Separa las dos secciones claramente con un t\u00edtulo visible para cada una.");
  lines.push(interpLenInstruccion());
  return lines.join("\n");
}
function generarInterpretacionLargaComodin(cartas,extCartas,ctx){
  return llamarIA({user:construirUserContentComodinLargo(cartas,extCartas,ctx)},"larga").then(function(t){return (t||"").trim()});
}
function generarInterpretacionLarga(cartas,ctx){
  return llamarIA({user:construirUserContentLargo(cartas,ctx)},"larga").then(function(t){return (t||"").trim()});
}

function adminGetToken(){try{return sessionStorage.getItem(STORE_PFX+"bats-admin-token")}catch(e){return null}}
function adminSetToken(t){try{sessionStorage.setItem(STORE_PFX+"bats-admin-token",t)}catch(e){}}
function adminClearToken(){try{sessionStorage.removeItem(STORE_PFX+"bats-admin-token")}catch(e){}}
function adminFetch(method,token,cfg){
  return fetch(getWorkerURL()+"/api/config",{
    method:method,
    headers:{"Content-Type":"application/json","X-Admin-Token":token},
    body:cfg?JSON.stringify(cfg):undefined
  }).then(function(r){
    return r.text().then(function(txt){
      var data;
      try{data=JSON.parse(txt)}catch(e){throw new Error("Respuesta no v\u00e1lida del servidor")}
      if(!r.ok) throw new Error(data.error||"Error del servidor ("+r.status+")");
      return data;
    });
  });
}
function adminGetConfig(token){return adminFetch("GET",token)}
function adminSaveConfig(token,cfg){return adminFetch("PUT",token,cfg)}
