/* ============ Crypto Utility — AES-GCM + PBKDF2 ============ */
/* Uses Web Crypto API for real encryption. No XOR. No legacy. */
/* Used by admin.js for export/import of configuration. */
/* Also provides key migration for ai.js XOR → AES-GCM. */

(function () {
  "use strict";

  var ITERATIONS = 100000;
  var SALT_LEN = 16;
  var IV_LEN = 12;
  var FORMAT_VERSION = 1;

  function getRandomBytes(n) {
    return crypto.getRandomValues(new Uint8Array(n));
  }

  function bufferToBase64(buf) {
    var bytes = new Uint8Array(buf);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ToBuffer(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function deriveKey(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (keyMaterial) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: salt, iterations: ITERATIONS, hash: "SHA-256" },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        );
      });
  }

  function encrypt(plaintext, password) {
    var enc = new TextEncoder();
    var salt = getRandomBytes(SALT_LEN);
    var iv = getRandomBytes(IV_LEN);
    return deriveKey(password, salt).then(function (key) {
      return crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(plaintext)
      );
    }).then(function (ciphertext) {
      var payload = {
        v: FORMAT_VERSION,
        algo: "AES-GCM",
        kdf: "PBKDF2",
        iter: ITERATIONS,
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv),
        data: bufferToBase64(ciphertext)
      };
      return JSON.stringify(payload);
    });
  }

  function decrypt(envelope, password) {
    var payload;
    try { payload = JSON.parse(envelope); } catch (e) {
      return Promise.reject(new Error("Formato de fichero no válido"));
    }
    if (!payload || payload.v !== FORMAT_VERSION || payload.algo !== "AES-GCM") {
      return Promise.reject(new Error("Formato de fichero desconocido o incompatible"));
    }
    var salt = new Uint8Array(base64ToBuffer(payload.salt));
    var iv = new Uint8Array(base64ToBuffer(payload.iv));
    var ciphertext = base64ToBuffer(payload.data);
    return deriveKey(password, salt).then(function (key) {
      return crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );
    }).then(function (plaintext) {
      return new TextDecoder().decode(plaintext);
    }).catch(function (e) {
      if (e.message && e.message.indexOf("formato") !== -1) throw e;
      throw new Error("Contraseña incorrecta o fichero corrupto");
    });
  }

  function downloadJSON(obj, filename) {
    var blob = new Blob([obj], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || "bats-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error("No se pudo leer el fichero")); };
      reader.readAsText(file);
    });
  }

  window.BATS = window.BATS || {};
  window.BATS.crypto = {
    encrypt: encrypt,
    decrypt: decrypt,
    downloadJSON: downloadJSON,
    readFileAsText: readFileAsText,
    FORMAT_VERSION: FORMAT_VERSION
  };
})();
