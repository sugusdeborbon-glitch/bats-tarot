/* ============ ADMIN PANEL (extracted from app.js) ============ */
/* Depends on: _clear (deck.js), toast (app.js), adminGetToken/adminSetToken/adminClearToken/adminGetConfig/adminSaveConfig (ai.js) */

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

function isNativeApp(){return !!(window.Capacitor&&Capacitor.Plugins)}

function initAdmin(){
  if(isNativeApp())return;
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

/* ============ ADMIN EXPORT / IMPORT (AES-GCM) ============ */

function adminExportarConfig(){
  var pass=prompt("Contraseña para cifrar la configuración exportada:");
  if(!pass||pass.length<4){toast("La contraseña debe tener al menos 4 caracteres",true);return}
  var cfg=_adminState.config||{};
  var exportData={
    format:"bats-admin-config",
    version:1,
    exported:new Date().toISOString(),
    config:cfg
  };
  var plaintext=JSON.stringify(exportData);
  var crypto=(window.BATS&&BATS.crypto)?BATS.crypto:null;
  if(!crypto){toast("Error: módulo de cifrado no disponible",true);return}
  adminMsg("Cifrando configuración\u2026");
  crypto.encrypt(plaintext,pass).then(function(envelope){
    var filename="bats-config-"+new Date().toISOString().slice(0,10)+".json";
    crypto.downloadJSON(envelope,filename);
    adminMsg("\u2713 Configuración exportada y cifrada: "+filename);
    toast("Configuración exportada correctamente");
  }).catch(function(e){
    adminMsg("Error al exportar: "+(e&&e.message||"desconocido"),true);
  });
}

function adminImportarConfig(){
  var input=document.createElement("input");
  input.type="file";
  input.accept=".json";
  input.onchange=function(){
    var file=input.files&&input.files[0];
    if(!file)return;
    var pass=prompt("Contraseña para descifrar la configuración:");
    if(!pass){toast("Se necesita la contraseña para importar",true);return}
    var crypto=(window.BATS&&BATS.crypto)?BATS.crypto:null;
    if(!crypto){toast("Error: módulo de cifrado no disponible",true);return}
    adminMsg("Descifrando configuración\u2026");
    crypto.readFileAsText(file).then(function(envelope){
      return crypto.decrypt(envelope,pass);
    }).then(function(plaintext){
      var data;
      try{data=JSON.parse(plaintext)}catch(e){throw new Error("Contenido no válido")}
      if(!data||data.format!=="bats-admin-config"||data.version!==1){
        throw new Error("Formato de fichero desconocido");
      }
      if(!data.config||typeof data.config!=="object"){
        throw new Error("El fichero no contiene configuración válida");
      }
      if(!confirm("\u00bfAplicar la configuración importada? Esto reemplazará la configuración actual.")) return;
      var tok=adminGetToken();
      return adminSaveConfig(tok,data.config);
    }).then(function(result){
      if(!result)return;
      _adminState.config=result.config||{};
      _adminState.pendingOrder=null;
      _adminState.pendingOn=null;
      if(result.config){
        _adminState.aiFlags={useCorta:result.config.useCorta!==false,useLarga:result.config.useLarga!==false};
      }
      if(typeof setAIFlagsLocal==="function") setAIFlagsLocal(_adminState.aiFlags);
      adminPoblar();
      adminMsg("\u2713 Configuración importada y aplicada correctamente.");
      toast("Configuración importada correctamente");
    }).catch(function(e){
      adminMsg("Error al importar: "+(e&&e.message||"desconocido"),true);
    });
  };
  input.click();
}
