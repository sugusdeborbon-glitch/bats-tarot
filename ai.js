var AI_MODE_KEY="bats-ai-mode";
var AI_CFG_KEY="bats-ai-cfg";
var AI_WORKER_URL_KEY="bats-ai-worker";
var AI_KEY_SEED="BATS_2026_v1";
var AI_WORKER_DEFAULT="https://bats-tarot-ai.bats-tarot.workers.dev";

var AI_PROVIDERS=[
  {id:"openai",nombre:"OpenAI",base:"https://api.openai.com/v1",modelo:"gpt-4o-mini"},
  {id:"deepseek",nombre:"DeepSeek",base:"https://api.deepseek.com/v1",modelo:"deepseek-chat"},
  {id:"groq",nombre:"Groq",base:"https://api.groq.com/openai/v1",modelo:"llama-3.3-70b-versatile"},
  {id:"openrouter",nombre:"OpenRouter",base:"https://openrouter.ai/api/v1",modelo:"deepseek/deepseek-chat"},
  {id:"mistral",nombre:"Mistral",base:"https://api.mistral.ai/v1",modelo:"mistral-small-latest"},
  {id:"ollama",nombre:"Ollama (local)",base:"http://localhost:11434/v1",modelo:"llama3"}
];

var AI_SISTEMA="Eres un int\u00e9rprete profesional de tarot Rider-Waite-Smith del sistema BATS (Business Ashram Tarot System).\nRecibir\u00e1s una tirada con posiciones ya definidas y sus cartas asignadas, incluyendo la quintaesencia ya calculada.\nDebes responder \u00daNICAMENTE con JSON v\u00e1lido y con esta forma exacta:\n{\"posiciones\":[{\"i\":0,\"texto\":\"...\"},{\"i\":1,\"texto\":\"...\"},...],\"quintaesencia\":\"...\"}\nReglas:\n- Una entrada por cada posici\u00f3n. El campo i es el \u00edndice de la carta (empieza en 0).\n- Cada \"texto\" interpreta la carta filtrada por el sentido de esa posici\u00f3n concreta. M\u00e1ximo 300 caracteres.\n- \"quintaesencia\" sintetiza el arquetipo de fondo de toda la tirada, nunca como mandato de acci\u00f3n ni predicci\u00f3n. M\u00e1ximo 300 caracteres.\n- Idioma: espa\u00f1ol, claro y cercano.\n- No inventes datos biogr\u00e1ficos ni asumas circunstancias no proporcionadas. Si falta informaci\u00f3n necesaria, ind\u00edcala brevemente.\n- No escribas nada fuera del JSON: ni introducci\u00f3n, ni comentarios, ni comillas de c\u00f3digo.";

var AI_SISTEMA_AV="Eres un int\u00e9rprete profesional de tarot del sistema BATS (Business Ashram Tarot System).\nRecibir\u00e1s el Arcano Visitante del d\u00eda (una carta calculada por numerolog\u00eda) y tres preguntas fijas.\nResponde \u00daNICAMENTE con JSON v\u00e1lido de esta forma exacta:\n{\"q1\":\"...\",\"q2\":\"...\",\"q3\":\"...\"}\nReglas:\n- q1: \u00bfQu\u00e9 vienes a mostrarme hoy? M\u00e1ximo 300 caracteres.\n- q2: \u00bfQu\u00e9 patr\u00f3n conocido me est\u00e1s ayudando a no repetir hoy? M\u00e1ximo 300 caracteres.\n- q3: \u00bfQu\u00e9 acci\u00f3n consciente me ayuda a escucharte? M\u00e1ximo 300 caracteres.\n- Idioma: espa\u00f1ol. No predigas el futuro; muestra patrones y posibilidades.\n- No escribas nada fuera del JSON.";

function getAIMode(){return localStorage.getItem(AI_MODE_KEY)||"off"}
function setAIMode(m){localStorage.setItem(AI_MODE_KEY,m)}
function modoDesc(m){
  if(m==="estandar") return "Interpretaci\u00f3n con IA BATS (DeepSeek) \u2014 textos generados al momento.";
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

function getAICfg(){try{return JSON.parse(localStorage.getItem(AI_CFG_KEY))||{}}catch(e){return {}}}
function saveAICfg(o){localStorage.setItem(AI_CFG_KEY,JSON.stringify(o))}

function getWorkerURL(){return localStorage.getItem(AI_WORKER_URL_KEY)||AI_WORKER_DEFAULT}
function setWorkerURL(u){localStorage.setItem(AI_WORKER_URL_KEY,u)}

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
  if(elW) elW.value=localStorage.getItem(AI_WORKER_URL_KEY)||AI_WORKER_DEFAULT;
  var st=document.getElementById("cfg-key-status");
  if(st) st.innerHTML=cfg.key?'<span style="color:var(--gold)">\u2713 Clave guardada</span>':'<span class="subtle">Sin clave guardada</span>';
}

function llamarIA(messages){
  var mode=getAIMode();
  if(mode==="estandar"){
    var url=getWorkerURL();
    if(!url) return Promise.reject(new Error("No hay URL del Worker configurada"));
    return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:messages})}).then(parseAIRespuesta);
  }
  if(mode==="propia"){
    var cfg=getAIPropia();
    if(!cfg.key) return Promise.reject(new Error("No hay clave configurada"));
    var headers={"Content-Type":"application/json","Authorization":"Bearer "+cfg.key};
    return fetch(cfg.base+"/chat/completions",{method:"POST",headers:headers,body:JSON.stringify({model:cfg.modelo,messages:messages,temperature:0.7,max_tokens:1600})}).then(parseAIRespuesta);
  }
  return Promise.reject(new Error("Modo IA desactivado"));
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
  if(q) lines.push("");
  if(q) lines.push("Quintaesencia calculada: "+q.nombre);
  return lines.join("\n");
}
function generarTextosIA(cartas,ctx){
  var q=calcQuinta(cartas);
  if(q) cartas._q=q;
  return llamarIA([
    {role:"system",content:AI_SISTEMA},
    {role:"user",content:construirUserContent(cartas,ctx)}
  ]).then(extraerJSON).then(function(data){
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
  ]).then(extraerJSON);
}
function probarConexionIA(btn){
  var b=btn||null;
  var orig=b?b.textContent:"";
  if(b){b.disabled=true;b.textContent="Probando\u2026"}
  llamarIA([
    {role:"system",content:"Responde solo con la palabra OK."},
    {role:"user",content:"Dime OK"}
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
