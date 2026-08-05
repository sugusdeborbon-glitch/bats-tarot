var STORE_PFX=(function(){return location.pathname.indexOf("/bats-tarot-dev/")!==-1?"dev_":""})();
function lsGet(k){try{return localStorage.getItem(STORE_PFX+k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(STORE_PFX+k,v)}catch(e){}}
function lsDel(k){try{localStorage.removeItem(STORE_PFX+k)}catch(e){}}

var AI_MODE_KEY="bats-ai-mode";
var AI_CFG_KEY="bats-ai-cfg";
var AI_WORKER_URL_KEY="bats-ai-worker";
var AI_KEY_SEED="BATS_2026_v1";
var AI_WORKER_DEFAULT="https://bats-tarot-ai.bats-tarot.workers.dev";
var AI_WORKER_TOKEN="cc983d628f91dd472207d8b210489722e6d6";

var AI_PROVIDERS=[
  {id:"openai",nombre:"OpenAI",base:"https://api.openai.com/v1",modelo:"gpt-4o-mini"},
  {id:"groq",nombre:"Groq",base:"https://api.groq.com/openai/v1",modelo:"llama-3.3-70b-versatile"},
  {id:"nvidia",nombre:"NVIDIA build.nvidia.com",base:"https://integrate.api.nvidia.com/v1",modelo:"meta/llama-3.1-8b-instruct"},
  {id:"openrouter",nombre:"OpenRouter",base:"https://openrouter.ai/api/v1",modelo:"deepseek/deepseek-chat"},
  {id:"mistral",nombre:"Mistral",base:"https://api.mistral.ai/v1",modelo:"mistral-small-latest"},
  {id:"ollama",nombre:"Ollama (local)",base:"http://localhost:11434/v1",modelo:"llama3"}
];

/* Fallback gen\u00e9rico: solo se usa si ctx.guion no coincide con ninguna clave de AI_SISTEMA_POR_GUION.
   En el flujo actual (diaria/rel/laboral/aprendizaje/pers) no deber\u00eda dispararse nunca, pero se mantiene
   alineado con la doctrina por si se a\u00f1ade un gui\u00f3n nuevo sin registrar su propio _sistemaBase. */
var AI_SISTEMA=_sistemaBase("tirada BATS","(estructura no especificada; interpreta cada posici\u00f3n por su t\u00edtulo tal como llega)");

var AI_SISTEMA_AV="Eres el int\u00e9rprete profesional BATS (Business Ashram Tarot System) para el Arcano Visitante.\nPRINCIPIO RECTOR (no negociable): el tarot diagnostica el patr\u00f3n; la persona decide. No predices el futuro ni ordenas una acci\u00f3n; tu voz es la de un analista de patrones, no un or\u00e1culo.\nRecibir\u00e1s el Arcano Visitante del d\u00eda (una carta calculada por numerolog\u00eda), sus Referencias BATS (lectura normal, sombra y ayuda \u2014 f\u00fasalas como base autorizada, no las sustituyas por significado gen\u00e9rico) y tres preguntas fijas.\nResponde \u00daNICAMENTE con JSON v\u00e1lido de esta forma exacta:\n{\"q1\":\"...\",\"q2\":\"...\",\"q3\":\"...\"}\nReglas:\n- q1: \u00bfQu\u00e9 vienes a mostrarme hoy? M\u00e1ximo 300 caracteres.\n- q2: \u00bfQu\u00e9 patr\u00f3n conocido me est\u00e1s ayudando a no repetir hoy? M\u00e1ximo 300 caracteres.\n- q3: \u00bfQu\u00e9 acci\u00f3n consciente me ayuda a escucharte? M\u00e1ximo 300 caracteres.\n- Idioma: espa\u00f1ol, claro y directo. No predigas el futuro; muestra patrones y posibilidades.\n- No escribas nada fuera del JSON: ni introducci\u00f3n, ni comentarios, ni comillas de c\u00f3digo.";

function _sistemaBase(nombre,estructura){
  return "Eres el int\u00e9rprete profesional BATS (Business Ashram Tarot System) para la tirada \u201c"+nombre+"\u201d, basada en el mazo Rider-Waite-Smith.\n"
    + "PRINCIPIO RECTOR (no negociable): el tarot diagnostica el patr\u00f3n; la persona decide. Nunca predices el futuro, nunca ordenas una acci\u00f3n, nunca afirmas certezas sobre terceros que no participan en la tirada. Tu voz es la de un analista de patrones, no un or\u00e1culo: evita expresiones como \"el universo te indica\", \"pronto llegar\u00e1s a\", \"debes\", \"tienes que\"; usa en su lugar \"la carta se\u00f1ala\", \"el patr\u00f3n indica\", \"conviene observar\".\n"
    + "Recibir\u00e1s la tirada con posiciones ya definidas, su quintaesencia ya calculada y, para cada carta, una \"Referencia BATS\": es la fuente de significado autorizada del sistema para esa carta en esa orientaci\u00f3n. Interpr\u00e9tala y f\u00edltrala por el sentido de la posici\u00f3n; no la sustituyas por el significado gen\u00e9rico de manual RWS ni la contradigas.\n"
    + "Estructura de la tirada:\n"+estructura+"\n"
    + "Para cada posici\u00f3n: antes de interpretar, nombra en pocas palabras un elemento visual concreto de la imagen de la carta (RWS); no reemplaces el s\u00edmbolo por metalenguaje t\u00e9cnico.\n"
    + "Debes responder \u00daNICAMENTE con JSON v\u00e1lido y con esta forma exacta:\n"
    + "{\"posiciones\":[{\"i\":0,\"texto\":\"...\"},{\"i\":1,\"texto\":\"...\"},...],\"quintaesencia\":\"...\"}\n"
    + "Reglas:\n"
    + "- Una entrada por cada posici\u00f3n. El campo i es el \u00edndice de la carta (empieza en 0).\n"
    + "- Cada \"texto\" ancla primero un elemento visual y luego interpreta la carta filtrada por el sentido de esa posici\u00f3n y su Referencia BATS. M\u00e1ximo 300 caracteres.\n"
    + "- Si se entrega una \"Referencia BATS de la quintaesencia\", \u00fasala como base de la s\u00edntesis; no inventes un significado distinto. \"quintaesencia\" sintetiza el arquetipo de fondo de toda la tirada, nunca como mandato de acci\u00f3n ni predicci\u00f3n. M\u00e1ximo 300 caracteres.\n"
    + "- Idioma: espa\u00f1ol, claro, directo, sin relleno m\u00edstico ni tecnicismos innecesarios.\n"
    + "- No inventes datos biogr\u00e1ficos ni asumas circunstancias no proporcionadas. Si falta informaci\u00f3n necesaria, ind\u00edcalo brevemente dentro del texto de esa posici\u00f3n, nunca fuera del JSON.\n"
    + "- No escribas nada fuera del JSON: ni introducci\u00f3n, ni comentarios, ni comillas de c\u00f3digo, ni etiquetas markdown.";
}

var AI_SISTEMA_DIARIA=_sistemaBase("Cruz Diaria","- Centro: la energ\u00eda del d\u00eda (el n\u00facleo de la jornada).\n- Izquierda: qu\u00e9 frenar o minimizar.\n- Derecha: qu\u00e9 impulsar o hacer.\n- Arriba: ayuda disponible.\n- Abajo: posible salida o resultado.");
var AI_SISTEMA_REL=_sistemaBase("Tirada de la relaci\u00f3n","- Energ\u00eda del momento de la relaci\u00f3n.\n- Energ\u00eda de la Persona 1.\n- Energ\u00eda de la Persona 2.\n- Posible salida o direcci\u00f3n.");
var AI_SISTEMA_LABORAL=_sistemaBase("BATS Laboral","- Centro: la energ\u00eda laboral del momento.\n- Izquierda: qu\u00e9 frenar o minimizar en el trabajo.\n- Derecha: qu\u00e9 impulsar o hacer en el trabajo.\n- Arriba: ayuda disponible en el trabajo.\n- Abajo: posible salida o resultado laboral.");
var AI_SISTEMA_APRENDIZAJE=_sistemaBase("El Aprendizaje","- El Hecho: qu\u00e9 ha ocurrido realmente.\n- El Maestro: qu\u00e9 me est\u00e1 mostrando realmente esta experiencia.\n- El Punto Ciego: qu\u00e9 no estoy viendo o qu\u00e9 interpretaci\u00f3n me impide aprender.\n- La Integraci\u00f3n: qu\u00e9 comprensi\u00f3n quiere integrarse en m\u00ed.\n- El Don Transformador: qu\u00e9 capacidad o cambio nace al integrar la verdad.\n- El Resultado Posible: qu\u00e9 transformaci\u00f3n ocurre si integro la lecci\u00f3n.");
var AI_SISTEMA_PERS=_sistemaBase("Tirada Personalizada","- Cada posici\u00f3n lleva el t\u00edtulo que la persona eligi\u00f3; ese t\u00edtulo define su funci\u00f3n.\n- No asumas un significado fijo de la carta: interpr\u00e9tala desde la funci\u00f3n que cumple en su posici\u00f3n.");
var AI_SISTEMA_POR_GUION={diaria:AI_SISTEMA_DIARIA,rel:AI_SISTEMA_REL,laboral:AI_SISTEMA_LABORAL,aprendizaje:AI_SISTEMA_APRENDIZAJE,pers:AI_SISTEMA_PERS};

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

function getWorkerURL(){return lsGet(AI_WORKER_URL_KEY)||AI_WORKER_DEFAULT}
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
  if(elW) elW.value=lsGet(AI_WORKER_URL_KEY)||AI_WORKER_DEFAULT;
  var st=document.getElementById("cfg-key-status");
  if(st) st.innerHTML=cfg.key?'<span style="color:var(--gold)">\u2713 Clave guardada</span>':'<span class="subtle">Sin clave guardada</span>';
  cargarAIInterpretacion();
}

function llamarIA(messages,tipo){
  var mode=getAIMode();
  if(mode==="estandar"){
    var url=getWorkerURL();
    if(!url||!/^https:\/\//i.test(url)) return Promise.reject(new Error("URL del Worker de IA inv\u00e1lida o vac\u00eda. Rev\u00edsala en Configuraci\u00f3n."));
    return fetchConTimeout(url,messages,{token:AI_WORKER_TOKEN,tipo:tipo});
  }
  if(mode==="propia"){
    var cfg=getAIPropia();
    if(!cfg.key) return Promise.reject(new Error("No hay clave configurada"));
    if(!/^https:\/\//i.test(cfg.base||"")) return Promise.reject(new Error("Endpoint de IA inv\u00e1lido. Rev\u00edsalo en Configuraci\u00f3n."));
    return fetchConTimeout(cfg.base+"/chat/completions",messages,{model:cfg.modelo,key:cfg.key});
  }
  return Promise.reject(new Error("Modo IA desactivado"));
}
function fetchConTimeout(url,messages,extra){
  var ctrl=("AbortController" in window)?new AbortController():null;
  var timer=ctrl?setTimeout(function(){ctrl.abort()},60000):null;
  function limpiar(){if(timer) clearTimeout(timer)}
  function status(s){try{if(window._iaStatus) window._iaStatus(s)}catch(e){}}
  var opts={
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:messages})
  };
  if(extra&&extra.key) opts.headers["Authorization"]="Bearer "+extra.key;
  if(extra&&extra.token) opts.headers["X-BATS-Token"]=extra.token;
  if(extra&&extra.model) opts.body=JSON.stringify({model:extra.model,messages:messages,temperature:0.7,max_tokens:4096});
  if(extra&&extra.tipo&&!extra.model) opts.body=JSON.stringify({messages:messages,tipo:extra.tipo});
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
    return content;
  });
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
  var q=calcQuinta(cartas);
  if(q) cartas._q=q;
  var sistema=(AI_SISTEMA_POR_GUION[ctx.guion])||AI_SISTEMA;
  return llamarIA([
    {role:"system",content:sistema},
    {role:"user",content:construirUserContent(cartas,ctx)}
  ],ctx.guion||"corta").then(extraerJSON).then(function(data){
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
  return llamarIA([
    {role:"system",content:AI_SISTEMA_AV},
    {role:"user",content:user}
  ],"av").then(extraerJSON);
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

var AI_SISTEMA_LARGA="Act\u00faa como el int\u00e9rprete experto del m\u00e9todo BATS (Business Ashram Tarot System).\nPRINCIPIO RECTOR (no negociable): el tarot diagnostica el patr\u00f3n; la persona decide. Nunca predices el futuro, nunca ordenas una acci\u00f3n, nunca afirmas certezas sobre terceros que no participan en la tirada. Tu voz es la de un analista de patrones, no un or\u00e1culo: evita \"el universo te indica\", \"pronto llegar\u00e1s a\", \"debes\", \"tienes que\"; usa en su lugar \"la carta se\u00f1ala\", \"el patr\u00f3n indica\", \"conviene observar\".\n\nVas a recibir una \u00fanica tirada del Tarot Rider-Waite-Smith. La tirada puede pertenecer a cualquier \u00e1mbito (diaria, laboral, relaci\u00f3n, aprendizaje, decisi\u00f3n, entrevista a un arcano, tirada libre, etc.). No presupongas su estructura; ded\u00facela a partir de los t\u00edtulos, posiciones y preguntas.\n\nCada carta llega con una \"Referencia BATS\": es la fuente de significado autorizada del sistema para esa carta en esa orientaci\u00f3n. \u00dasala como base de tu interpretaci\u00f3n; no la sustituyas por el significado gen\u00e9rico de manual RWS ni la contradigas. Si una carta no trae Referencia BATS, interp\u00e9tala desde el simbolismo RWS est\u00e1ndar e indica que no hay referencia propia para ella.\n\nPara cada posici\u00f3n:\n1. Lee primero la pregunta asociada a esa posici\u00f3n.\n2. Nombra brevemente un elemento visual concreto de la carta; no sustituyas el s\u00edmbolo por metalenguaje.\n3. Interpreta la carta desde la funci\u00f3n que cumple en esa posici\u00f3n, apoy\u00e1ndote en su Referencia BATS.\n4. Extrae el aprendizaje pr\u00e1ctico que aporta.\n\nSi existe una quintaesencia:\n- Si se entrega una \"Referencia BATS de la quintaesencia\", \u00fasala como base; no inventes un significado distinto.\n- Interpr\u00e9tala como el patr\u00f3n arquet\u00edpico que sintetiza toda la tirada.\n- Expl\u00edcala en relaci\u00f3n con el resto de las cartas, no de forma aislada.\n\nDespu\u00e9s realiza una lectura integrada de la tirada que incluya:\n- Arquitectura simb\u00f3lica de la tirada.\n- Relaciones, apoyos, tensiones y coherencias entre las cartas.\n- Repeticiones de n\u00fameros, palos, figuras o arcanos mayores cuando sean significativas.\n- Evoluci\u00f3n del mensaje desde la primera hasta la \u00faltima posici\u00f3n.\n- Ense\u00f1anza central de la tirada.\n\nFinaliza con:\n1. Una s\u00edntesis profunda de varios p\u00e1rrafos.\n2. Una \u00fanica frase que resuma el aprendizaje esencial del sistema.\n\nPrincipios metodol\u00f3gicos BATS:\n- El significado nace de la pregunta y de la posici\u00f3n, no de un significado fijo de la carta.\n- Cada carta modifica y es modificada por las dem\u00e1s.\n- La tirada constituye un \u00fanico sistema simb\u00f3lico.\n- La quintaesencia revela el patr\u00f3n profundo que organiza toda la lectura.\n- La interpretaci\u00f3n debe ser simb\u00f3lica, psicol\u00f3gica y arquet\u00edpica, orientada a la comprensi\u00f3n y a la toma de conciencia.\n- No utilices cartas invertidas salvo que se indique expresamente.\n- Evita cualquier enfoque predictivo, fatalista o determinista.";

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
function generarInterpretacionLarga(cartas,ctx){
  return llamarIA([
    {role:"system",content:AI_SISTEMA_LARGA},
    {role:"user",content:construirUserContentLargo(cartas,ctx)}
  ],"larga").then(function(t){return (t||"").trim()});
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
