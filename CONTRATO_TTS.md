# Contrato del Subsistema TTS de BATS

| Campo | Valor |
|---|---|
| **Identificador** | CTTS-001 |
| **Versión** | 1.0 |
| **Última revisión** | 2026-10-13 |
| **Estado** | Vigente |
| **Ámbito** | `/api/tts` (Worker BATS) y lectura en directo (Web Speech API) |
| **Documentos relacionados** | `js/tts.js` · `worker/worker.js` · `BATS_TECHNICAL_AUDIT_CURRENT_STATE.md` |

---

## 1. Propósito

Este contrato define, de forma independiente de la implementación, cómo se produce el audio hablado en BATS y cuál es el contrato del endpoint `/api/tts`.

## 2. Decisiones de patrón (vigentes)

1. **Lectura en directo = voz del dispositivo.** "Escuchar" usa la Web Speech API (`speechSynthesis`) con las voces instaladas en el dispositivo (motor TTS de Android/Chrome, p. ej. "Google Text-to-Speech"). Velocidad seleccionable **0.75× / 1× / 1.25×** y voz persistidas en `localStorage` (`bats-voz-tasa`, `bats-voz-voice`).
2. **El MP3 es un artefacto de exportación, no un camino de reproducción.** `vozDescargarMP3()` genera el audio de forma remota y fuerza la descarga (`a.download = "lectura-bats.mp3"`). Nunca suena en la app ni sustituye a la lectura en directo.
3. **El MP3 sale de texto plano.** El endpoint `/api/tts` no recibe ni honra pausas, prosodia, tono ni volumen: el motor de generación es el endpoint de consumo de Google Translate (`translate_google.com/translate_tts`), que no expone esos parámetros. Las pausas y la prosodia pertenecen a la lectura en directo (voz local), no al export.
4. **No hay controles de volumen ni tono en la UI.** `pitch` queda fijo en `1` y el volumen usa el valor por defecto de la API (únicamente a `0` en el utterance de calentamiento de `vozCalentar()`).

## 3. Endpoint de generación de MP3

### 3.1 Ubicación

`POST {workerURL}/api/tts`

- Worker PRO: `https://bats-tarot-ai.bats-tarot.workers.dev`
- Worker DEV: `https://bats-tarot-ai-dev.bats-tarot.workers.dev`

### 3.2 Autenticación

- Header obligatorio: `X-BATS-Token`.
- El Worker compara el valor con el secreto `env.BATS_TOKEN` (`401` si no coincide o falta).
- **Nivel de defensa:** secreto compartido **débil por diseño** — el frontend de BATS lo embebe en el bundle (`AI_WORKER_TOKEN`, `ai.js`) y así está auditado. No debe considerarse una barrera de seguridad real.
- **Integradores externos (p. ej. BAP-Studio):** el token DEBE permanecer en el backend del integrador (proxy servidor a servidor) y NUNCA viajar en el bundle de un cliente. Llamadas directas desde el navegador del consumidor son un anti-patrón.

### 3.3 CORS

- `ALLOWED_ORIGINS` del Worker: `https://sugusdeborbon-glitch.github.io` y `null` (valor actual, `worker/worker.js`).
- Las llamadas **servidor a servidor** no necesitan CORS; por tanto un proxy de integración no exige ampliar la lista.
- Las llamadas directas desde navegador de terceros sí fallarían CORS salvo ampliación deliberada.

### 3.4 Rate limit

- **5 peticiones/min usuarias** por cliente/IP (ventana de 60 s) → `429` si se excede.
- Consecuencia para integradores: un backend proxy cuenta como un único IP → techo efectivo de ~5 TTS/min. Si un consumidor necesita más, se decide y se ajusta en el Worker (no en el cliente).

### 3.5 Petición

- Método: `POST` obligatorio (cualquier otro → `405`).
- Cuerpo: JSON `{ "text": string, "voice": "es" | "es-US" }`.
  - `text`: obligatorio, no vacío tras trim → `400` si falta; máx. **20 000 caracteres** (`TTS_MAX_TEXT`) → `413` si excede.
  - `voice`: opcional; cualquier valor distinto de `es-US` se normaliza a `es`.
- Pseudocódigo de referencia (cliente BATS, `js/tts.js`):

```js
POST getWorkerURL() + "/api/tts"
Headers: { "Content-Type": "application/json", "X-BATS-Token": <token> }
Body:    { text, voice }        // voice "es" | "es-US"
```

### 3.6 Respuestas

| Código | Caso |
|---|---|
| `200` | `audio/mpeg`; header `Content-Disposition: attachment; filename="lectura-bats.mp3"`; `Cache-Control: no-store` |
| `400` | JSON inválido, `text` vacío o no string |
| `401` | Token ausente o incorrecto |
| `405` | Método distinto de POST |
| `413` | `text` > 20 000 caracteres |
| `429` | Rate limit superado |
| `502` | Fallo del motor de audio upstream |

### 3.7 Motor de generación

- `worker/worker.js: ttsGoogle()` llama a `https://translate.google.com/translate_tts?ie=UTF-8&q=<chunk>&tl=<lang>&client=tw-ob`.
- El texto se trocea en **chunks ≤ 150 caracteres**, cada chunk se sintetiza y los MP3 se concatenan en orden.
- El audio es **plano**: sin SSML, sin parámetros de prosodia/tono/silencios. Las pausas que se perciben son las naturales del motor de Translate, no controladas.
- `voice` se mapea al parámetro `tl` (`es` | `es-US`).

## 4. Lectura en directo (Web Speech API)

- Puerto lógico: `window.BATS.tts` (`js/tts.js`).
- Flujo: `vozLeer(dest)` → toma el texto de la última tirada (`vozTextoDe`) → lo trocea en segmentos ≤ 300 caracteres por frase (`vozDividir`) → encola `SpeechSynthesisUtterance`s con la voz seleccionada.
- Controles: reproducir / pausa (`speechSynthesis.pause()`) / reanudar (el Play reanuda si estaba pausado) / parar (`speechSynthesis.cancel()`).
- Velocidad: 0.75× / 1× / 1.25×, aplicada vía `u.rate` y persistida.
- Voz: la selección de voces en español del dispositivo (`getVoices()`, prioridad `es-ES`), persistida por `voiceURI`.
- Si el dispositivo no tiene voz española: mensaje "No hay voz en español instalada en este dispositivo" y controles deshabilitados.

## 5. Fronteras del contrato

| Capacidad | Dónde vive |
|---|---|
| Velocidad de lectura | Cliente (Web Speech API) |
| Selección de voz | Cliente (voces del dispositivo) |
| Generación de MP3 | Worker (texto plano) |
| Pausas / prosodia | Solo lectura en directo (voz local); **no** en el MP3 |
| Volumen / tono | Sin control de usuario (`pitch=1` fijo, volumen por defecto) |
| TTS con SSML (prosodia controlada) | **Fuera de alcance** de `/api/tts`; requeriría un motor Cloud TTS dedicado, no este endpoint |

## 6. Integración externa (referencia)

Para BAP-Studio u otros consumidores:

1. El backend del integrador almacena el `X-BATS-Token` y llama a `POST {Worker PRO}/api/tts` en lugar del cliente.
2. No se amplía `ALLOWED_ORIGINS` salvo que se quiera permitir el navegador de un tercero (no recomendado).
3. Si el consumidor necesita prosodia/pausas/tono de verdad, la decisión es usar Google Cloud TTS (SSML) desde su propio backend — no pasar por `/api/tts`.
4. El audio devuelto se trata solo como artefacto de exportación (`Content-Disposition: attachment`).