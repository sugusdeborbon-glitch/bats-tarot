# INFORME DE DIRECCIÓN — BATS Tarot

**Autor:** Director Técnico / Jefe de Producto
**Fecha:** 2026-10-05
**Alcance:** auditoría de dirección de proyecto. No es una auditoría de incidencia.
**Baseline verificado:** `HEAD = c0665d4` (rama `master`), 93 commits, `npx vitest run` → 9 ficheros / 281 tests / 0 fallos.

> Documento de referencia de la nueva dirección. Sustituye a la práctica de "entregar sin cerrar".
> El código de este informe es solo lectura; las intervenciones derivadas se ejecutan con el
> protocolo A–F descrito en el apartado 11.

---

## 1. Diagnóstico ejecutivo

El producto no está empeorando por un bug concreto. Está empeorando por un **fallo de gobierno
del proyecto**, y ese fallo es anterior a cualquiera de los problemas técnicos catalogados aquí.

**El hallazgo central: BATS tiene tres versiones de sí mismo, ninguna declarada como la buena.**

| Copia | Estado | Versionado |
|---|---|---|
| Raíz del repo | H-01 + H-04 + H-04.A + Provider Manager | parcial (8 modificados sin commit) |
| Rama `dev` local | solo H-01 + bump SW v36 | sí, **nunca pusheada** (`e3c09cb`) |
| `www/` + `android/app/src/main/assets/public/` | anterior a H-01 y H-04.A | **no** (ambas en `.gitignore`) |
| **Producción en vivo** | `bats-v35`, con el backdoor de test activo | — |

**El último commit de la historia de producción (`c0665d4`) se titula
`test: forzar Comodín a posición 0 con _BATS_TEST_COMODIN`.** La última entrega a usuarios
reales fue un mecanismo de pruebas. Y seguía ahí.

Verificado por HTTP contra `https://sugusdeborbon-glitch.github.io/bats-tarot/`:

- `js/deck.js` líneas 82 y 116 → `window._BATS_TEST_COMODIN`
- `js/state.js` línea 75 → `Object.defineProperty(window, "_BATS_TEST_COMODIN", …)`
- `service-worker.js` en vivo → `var CACHE = "bats-v35"`
- `android/app/build/intermediates/assets/debug/mergeDebugAssets/public/js/deck.js:82` → mismo backdoor

**Corrección de precisión sobre el APK (verificada el 2026-10-05):** el APK
distribuido (`bats-tarot.apk`, 16,4 MB, fechado 2026-09-10) **no** contiene
`js/deck.js`: es un build *anterior* a la extracción en módulos, con el `app.js`
monolítico, y por tanto carece también de `js/` entero, de H-04.A y de todo lo
posterior. El backdoor sí está en él, dentro de `assets/public/app.js`:

```
3:var _BATS_TEST_COMODIN=false; // TODO: remove after testing
37:function añadirComodin(mazo,activo){if(!activo&&!window._BATS_TEST_COMODIN)return mazo;...}
```

Es decir: **el APK no es una copia atrasada del producto, es otra versión
entera del producto**, y lleva 7 semanas sin recibir nada de las últimas fases.
El backdoor está tanto en la web como en el APK, pero por rutas distintas.

Tres versiones de service worker coexistían: **v35 en producción**, **v36 en la rama `dev` local
sin pushear**, **v37 en el working tree**. Ninguna era un release. El número de caché había
dejado de ser un mecanismo de versión y era un contador de intentos.

**Conclusión de dirección:** el proyecto no tiene un problema de código. Tiene un problema de
*trazabilidad de qué es el producto*. Mientras eso no se arregle, cualquier trabajo nuevo —
incluido el de esta dirección — añade valor a una base cuyo contenido real se desconoce.

---

## 2. Estado real del producto

### Lo que funciona

- El núcleo de lectura de tiradas está íntegro: 52 tests de mazo, 28 de Comodín, 10 de cripto,
  21 de migración. Sin fallos.
- La gestión de claves con AES-GCM y su migración desde XOR están implementadas y probadas
  (`tests/migration.test.js`, `tests/crypto.test.js`).
- El panel de administración está correctamente gateado por `X-Admin-Token`
  (`worker/worker.js:212`). Buena decisión, bien implementada.
- El fallo de proveedores y el contrato temporal tienen una arquitectura razonable: deadline
  único, `AbortController`, backoff.

### Lo que está roto o en riesgo

| # | Hecho verificado | Impacto en producto |
|---|---|---|
| P1 | Backdoor `_BATS_TEST_COMODIN` activo en producción web y en el APK construido | El Comodín puede forzarse desde la consola. Integridad de lectura falsificable |
| P2 | `redactConfig` captura `maxTokens` vía `/(key\|secret\|token…)/i` (`worker/provider-manager.js:19`) → devuelve `"[redactado]"` | `js/admin.js:118` lo pinta y `js/admin.js:157` hace `parseInt("[redactado]")\|\|4096` → **escribe 4096 en KV, destruyendo el valor real** |
| P3 | `www/` y `android/…/public/` divergen de la raíz justo en los 4 ficheros de H-01 y H-04.A, y ambas carpetas están en `.gitignore` | El artefacto que se distribuye **no está versionado**. La divergencia es invisible para git |
| P4 | `index.html` mezcla 12 referencias `?v=1.10.0` y 4 `?v=1.11.0`; `version.json` y `package.json` en 1.10.0; SW en v35/v36/v37 | No existe identidad de versión. Un usuario puede ejecutar por caché una mezcla de dos builds |
| P5 | Doble fuente de verdad del contrato temporal: `js/ai/contrato-temporal.js` no lo carga nadie; los 60/90 s reales están hardcodeados en `ai.js:169` | El módulo que "define" los timeouts no define nada. El SW lo precachea con justificación falsa |
| P6 | Sin CSP. 77 `onclick=` inline en `index.html` | Contradice `AGENTS.md`, que afirma que los onclick inline fueron refactorizados. La documentación ya no describe el código |
| P7 | Rate limit en `Map` de memoria de instancia (`worker/worker.js:134`), 5/60 s | Se evade reiniciando instancia |
| P8 | Token de worker embebido en `ai.js` | Se distribuye al navegador con cada build. Hay una credencial de servidor en el cliente |

**Veredicto:** el producto no está roto. Está **indeterminado**. No sabemos con certeza qué build
usa cada usuario, y una parte de lo que sabemos es que tiene un defecto de integridad.

---

## 3. Estado de la arquitectura

La arquitectura es *más complicada de lo que el producto necesita, y no de una forma que sirva
al producto*.

**Origen:** 7 commits consecutivos de extracción (`fase0`…`fase6`), todos con el mismo patrón —
extraer funciones de `app.js` a un módulo nuevo, subir el número de service worker, commit.
Ninguno menciona pruebas funcionales de aceptación. Resultado: `app.js` de 743 líneas repartido
en 13 módulos, con `www/` y `android/` copiados a mano.

1. **Tres copias del producto, dos sin control de versiones.** `capacitor.config.json` declara
   `webDir: "www"`, así que el APK se construye desde una carpeta que git ignora. La
   sincronización es manual (`npx cap sync`) y no se había ejecutado desde H-01.

2. **Configuración de IA en tres sitios** con valores que deben coincidir y no coinciden:
   `ai.js:169` (60/90), `worker/worker.js:395` y `:441` (`40000`), `js/ai/contrato-temporal.js`
   (que nadie carga).

3. **Import que cruza directorios**: el worker importa `../js/ai/contrato-temporal.js`, fuera de
   su directorio. Ya motivó el commit `e3c09cb` (bump v36 sin otra justificación). Señal de que
   la estructura ya no encaja.

4. **Provider Manager: 489 líneas y 67 tests para un producto que casi no lo usa.** El único
   consumidor (`js/admin.js`) solo lee `.id` y `.name`. Se construyó una capa de abstracción
   sobre un catálogo fijo y en el proceso se introdujo P2. Es exactamente el patrón que el
   principio rector prohíbe.

5. **Seguridad de datos concentrada en el cliente.** Encriptación de claves (correcta) en el
   navegador; autorización de admin (correcta) en el worker. El punto intermedio —quién puede
   leer qué— es implícito y depende de la disciplina del código.

---

## 4. Estado de la calidad

**Lo que hay:**
- 9 suites, 281 tests, 0 fallos, ~1,3 s. Infraestructura sana.
- 2 838 líneas de test para 6 037 de código de aplicación. Ratio 0,47. Aceptable.
- Tests que ejecutan el módulo real (`tests/h04a-concurrencia.test.js` carga
  `js/ai-pipeline.js` con `new Function`), no reimplementaciones. Decisión correcta.

**Lo que no hay:**

1. **No hay una sola prueba funcional automatizada de la aplicación.** Ningún test hace: abrir la
   app → hacer una tirada → pedir interpretación → ver resultado. Todo lo que hay prueba
   unidades, y las unidades son exactamente donde los errores no se ven. **P2 es invisible a los
   281 tests**: los 67 del Provider Manager verifican que `redactConfig` redacta; ninguno
   verifica que el panel pueda leer lo que `redactConfig` devuelve.

2. **4 de las 9 suites no están en ningún commit** (`h01-comodin`, `h04-contrato-temporal`,
   `h04a-concurrencia`, `provider-manager`). Un `git clean` destruye 1 586 líneas de tests y
   2 módulos de código.

3. **Tests que verifican la existencia del defecto en lugar del comportamiento.** B-11/B-12 del
   H-04 usan `readFileSync` + regex: comprueban que `90000` aparece en una cadena, no que el
   timeout llegue al `AbortController`.

4. **La documentación describe un código que ya no existe.** `AGENTS.md` afirma
   `insertAdjacentHTML` eliminado y onclick inline refactorizados; el código real tiene 4
   `innerHTML` y 77 `onclick=`.

---

## 5. Complejidad acumulada

- 13 módulos en `js/`, 2 grandes en raíz (`app.js` 743, `ai.js` 597), 2 en `worker/`.
  **25 unidades de código para una PWA de una sola página.**
- 1 857 líneas de test sobre código nunca publicado (H-04, H-04.A, PM, H-01) frente a 0 líneas
  de ese mismo código en producción.
- 3 números de service worker circulando.
- 4 informes de auditoría (1D, 2C-1, 2C-3, H-04.A) y 1 sin redactar (Fase 2A); ninguno en el repo.
- 274 MB de backups en `_backups/` (7 copias), carpeta que **no estaba en `.gitignore`**. Un
  `git add -A` — el comando que la documentación del proyecto sugiere en cada despliegue —
  habría subido 274 MB al repositorio.
- **Cero excise lines.** 93 commits, ninguno de los últimos 6 elimina código.

**La métrica que preocupa:** la relación entre *código escrito para el producto* y *código que
llega al producto* es aproximadamente 0. Igual para los tests: 281 tests, y los que cubren el
trabajo reciente no protegen nada que esté en producción.

---

## 6. Zonas de riesgo

**R1 — Integridad del producto (CRÍTICO, activo).** Backdoor de test en producción web y APK.
Un usuario puede forzar el Comodín desde la consola. BATS promete integridad de lectura; el
producto publicado permite manipularla.

**R2 — Pérdida de trabajo (CRÍTICO, activo).** Todo el trabajo de las últimas 4 fases existe
únicamente en el working tree de una máquina. Un fallo de disco, un `git clean`, un `checkout`
equivocado, y se pierden 2 módulos, 1 586 líneas de test y 4 informes. H-01 está además
**duplicado**: commiteado en `dev` local sin pushear y sin commitear en `master`.

**R3 — Corrupción silenciosa de configuración (ALTO).** P2. Cada vez que un administrador abre
el panel y guarda, `maxTokens` se convierte en 4096 en KV. Sin error, sin aviso. El síntoma
aparecerá semanas después como "las interpretaciones salían cortadas".

**R4 — Producto no reproducible (ALTO).** Con `www/` y `android/` en `.gitignore`, es imposible
reconstruir el APK distribuido desde el repositorio.

**R5 — Deuda con apariencia de progreso (MEDIO).** 2 838 líneas de tests y 489 líneas de
Provider Manager dan impresión de avance. El producto no ha cambiado. Este riesgo produce la
percepción de "el proyecto progresa" sin que progrese, y es el que motivó el cambio de dirección.

**R6 — Regresión silenciosa por triple copia (MEDIO).** Un cambio en la raíz sin copiar a `www/`
produce un APK con comportamiento distinto de la web. Nadie lo detecta.

**R7 — Credencial en el cliente (MEDIO, a medio plazo).** El token del worker viaja en `ai.js`.

---

## 7. Qué estabilizar

1. **El canal de entrega.** Hoy no hay camino determinista de "código" a "producto". Tres ramas,
   tres carpetas, tres versiones. Mientras no exista un solo camino, ninguna mejora es medible.
2. **La integridad de la tirada.** El Comodín y la exportación deben ser inalterables por el usuario.
3. **El panel de administración.** Única vía por la que se cambia el comportamiento del producto.
   Un fallo ahí (P2) es un fallo silencioso y persistente.
4. **La configuración de tiempos de IA.** Tres fuentes, valores distintos. Un lugar, un valor.
5. **La paridad raíz ↔ `www/` ↔ `android/`**, verificada mecánicamente, no por disciplina.

## 8. Qué simplificar

1. **El contrato temporal: dos opciones, no tres.** O se carga en el frontend y pasa a ser la
   fuente de verdad, o se retira del frontend y deja de precachearse. Mantener un módulo que nadie
   carga es peor que no tenerlo.
2. **La supresión de versiones `?v=` en `index.html`.** 16 referencias con dos números distintos.
3. **El Provider Manager**, si se confirma que su único valor real es ordenar proveedores: 489
   líneas de abstracción sobre un catálogo estático.
4. **`_backups/`** — 274 MB dentro del árbol de trabajo. Fuera o ignorado.
5. **La documentación duplicada** de prompts y el `AGENTS.md` desalineado, ya identificado como
   fuente de error en auditorías.

## 9. Qué trabajo debe detenerse

- **Nuevas funcionalidades.** Inmediatamente. Sin excepción.
- **Nuevas extracciones o modularizaciones de `app.js`.** El patrón "faseN" generó la
  complejidad actual. Se detiene.
- **Bumps de service worker sin motivo funcional.**
- **Refactorizaciones de la capa de proveedores** más allá de corregir el defecto bloqueante.
- **Trabajo sobre CSP, rate-limit global, unificación de prompts, credenciales en cliente**
  mientras P1–P3 estén abiertos. No son malos: son el trabajo equivocado ahora.
- **`git add -A`** como práctica de entrega.

## 10. Qué trabajo debe priorizarse

| Prio | Acción | Por qué |
|---|---|---|
| **P0** | Cerrar el backdoor en producción (web + APK) | Integridad del producto. Lo único que ve el usuario |
| **P0** | Recuperar el control del repositorio: un commit por bloque, con tests, staging selectivo | Sin esto el resto no es recuperable |
| **P0** | Corregir `maxTokens` (`SENSITIVE_KEY_RE`) | Defecto que daña datos de configuración en silencio |
| **P0** | Unificar la identidad de versión | Requisito para medir cualquier mejora posterior |
| **P1** | Redactar y cerrar el informe de Fase 2A | Deuda de proceso abierta; falta la línea base |
| **P1** | Decidir el destino del Provider Manager y del contrato temporal | 742 líneas de complejidad con un defecto dentro |
| **P1** | Verificar paridad de las 3 copias | Sostiene todo lo demás |
| **P2** | CSP, rate-limit global, credencial en cliente | Importantes, no urgentes |

---

## 11. Principios de nueva dirección

### Los siete principios (del encargo, normativa vinculante)

1. Estabilidad antes que evolución.
2. Preservación antes que refactorización.
3. Cambios pequeños y reversibles.
4. **Tests ≠ aceptación.**
5. No arreglar una cosa rompiendo otra.
6. No desarrollar a ciegas.
7. El usuario decide el producto.

### Los cuatro añadidos por la experiencia de este repositorio

**8 — La entrega es parte del producto.** Un cambio que no está commiteado, identificado por
versión y publicado no es un cambio: es trabajo perdido. No está terminado hasta que es reversible
con un solo comando.

**9 — Una sola fuente de verdad por dato.** Si un valor aparece en más de un sitio, uno de los
dos está mal. Antes de añadir un valor, hay que decidir dónde vive y eliminar el otro.

**10 — El diff se mide, no se valora.** Cada intervención declara antes de empezar cuántas líneas
y cuántos archivos va a tocar. Si el diff real supera lo previsto, es señal de STOP.

**11 — La documentación es parte del código.** Si `AGENTS.md` afirma algo que el código
contradice, es un defecto abierto con la misma prioridad que un fallo de ejecución.

### Las 5 preguntas, obligatorias antes de aprobar cualquier cambio

1. ¿Qué problema real del producto resuelve?
2. ¿Qué comportamiento existente modifica?
3. ¿Qué comportamiento existente debe conservarse?
4. ¿Cómo demostramos que la modificación mejora el producto?
5. ¿Cómo demostramos que no empeora otras partes?

Una propuesta que no responde las cinco no entra en fase D.

### Los 4 niveles de evidencia (materialización de "tests ≠ aceptación")

| Nivel | Qué es | Ejemplo | Peso |
|---|---|---|---|
| **L1** Test automático | Código aislado, 281 casos | `redactConfig` redacta `maxTokens` | Necesario, no suficiente |
| **L2** Verificación de código | Lectura del diff, grep, análisis estático | "`maxTokens` casa con la regex" | Detecta, no prueba |
| **L3** Prueba funcional | El flujo real, extremo a extremo | Admin abre panel → lee valor → guarda → KV conserva el valor | **Requerido para aceptar** |
| **L4** Aceptación de producto | El usuario hace lo que quiere hacer | La tirada con Comodín sale con el Comodín en su posición | **Requerido para decir APTO** |

**Regla derivada:** ningún cambio se declara APTO sin L3. Ningún cambio con impacto visible se
declara APTO sin L4.

### Protocolo A–F

- **A COMPRENDER** — auditar el estado actual.
- **B DECIDIR** — qué cambia y qué queda intacto.
- **C PLANIFICAR** — plan pequeño y reversible, con diff declarado.
- **D IMPLEMENTAR** — exclusivamente lo aprobado.
- **E VALIDAR** — tests, regresiones, comportamiento funcional, alcance real del diff.
- **F ACEPTAR o RECHAZAR** — solo APTO con evidencia suficiente.

**Condición de salida de E añadida:** si el diff real excede lo declarado en C → STOP y volver a B.

### REGLA DE STOP

Si en cualquier fase aparece una regresión, un comportamiento inesperado o **incertidumbre
relevante** sobre qué está pasando: **STOP**. No compensar automáticamente con otro cambio.
Primero comprender. Criterio explícito: si en fase A no soy capaz de decir con certeza qué build
está usando un usuario, eso es incertidumbre relevante y bloquea.

---

## 12. Criterios de aceptación (norma del proyecto)

Un cambio se acepta solo si cumple **los seis**:

1. **Problema real identificado** — las 5 preguntas respondidas por escrito.
2. **Alcance respetado** — diff real ⊆ diff declarado. Si no, STOP.
3. **L1 verde** — la suite pasa, incluida la nueva cobertura si el cambio lo requiere.
4. **L3 verde** — existe prueba funcional del flujo afectado, ejecutada y vista. Sin L3 el
   cambio está *verificado*, no *terminado*.
5. **L4 si hay impacto de usuario** — comprobado sobre el producto, no sobre el código.
6. **Reversible en un comando** — commit único, mensaje que explique el porqué, `git revert` que
   devuelve al estado anterior sin efectos colaterales.

---

## 13. Estrategia de estabilización

**No construir nada nuevo hasta que P0 esté cerrado.**

- **Fase 0 — Recuperar el control.** Publicar la corrección de integridad; recuperar el trabajo no
  versionado decidiendo qué se conserva; unificar la versión.
  *Salida: existe un único estado del proyecto, identificable y reversible.*
- **Fase 1 — Cerrar lo que daña.** `maxTokens`, contrato temporal, paridad de copias, informe 2A.
  *Salida: no queda ningún defecto conocido abierto.*
- **Fase 2 — Reducir superficie.** Provider Manager, deuda H-04 B–G, `www/`/`android/` generados,
  `_backups/` fuera. *Salida: menos código que antes y el mismo producto.*
- **Fase 3 — Base de aceptación.** Un smoke test funcional (L3) que cubra tirada + IA + admin.
- **Fase 4 — Entonces, producto.** El roadmap de funcionalidad se decide con el usuario después
  de la Fase 3.

---

## 14. Roadmap inmediato (Fase 0)

| Intervención | Contenido | Criterio de cierre |
|---|---|---|
| **0.1** Integridad | Publicar la eliminación del backdoor. Web y APK | L3: el Comodín opt-in sigue funcionando y la vía no documentada ya no existe. L4: comprobado por el usuario |
| **0.2** Control del repo | Un commit por bloque (H-01, H-04.A, Provider Manager corregido), staging selectivo, `_backups/` ignorado | Todo el trabajo de las 4 fases versionado; nada recuperable solo en working tree |
| **0.3** Configuración | `SENSITIVE_KEY_RE` deja de capturar `maxTokens` + test del ciclo admin → KV | L3: abrir panel → leer → guardar → el valor persiste |
| **0.4** Versión | Un número, un origen. SW alineado con una releases | L2: `index.html`, `service-worker.js`, `version.json`, `package.json` coinciden |
| **0.5** Documental | Informe Fase 2A, registro de deuda viva, corregir `AGENTS.md` | Cero afirmaciones de documentación contradichas por el código |

Fases 1 y 2 se planifican al cerrar la 0.

---

## 14 bis. Estado de la Fase 0 tras la ejecucion (2026-10-05)

Todo lo de esta seccion se **ejecuto y se verifico**. Se separa del resto del
informe, que es diagnostico prospectivo.

### Ejecutado y verificado

| Ítem | Resultado |
|---|---|
| 0.1 Integridad | Backdoor eliminado del código. Verificado ausente en raíz, `www/` y `android/…/public/`. **Pendiente de publicación en producción** |
| 0.2 Control del repo | 5 commits por bloque, staging selectivo. `_backups/` (274 MB) y ficheros personales añadidos a `.gitignore` |
| 0.3 Configuración | `maxTokens` corregido. Test L3 nuevo que **falla (5 de 8) al revertir el arreglo** |
| 0.4 Versión | 1.11.0 unificada en los 5 puntos. Caché del SW pasa de contador `bats-v37` a `bats-1.11.0` |
| 0.4b Paridad | 108 ficheros idénticos en las 3 copias, verificado por script. **Detectó la divergencia oculta antes de corregirla** |
| 0.5 Coherencia cliente/Worker | Duplicación de 60/90 s convertida en invariante verificada mecánicamente |

### Verificaciones

- `npx vitest run` → **11 ficheros, 295 tests, 0 fallos** (antes: 9 ficheros, 281).
- `npm run verify` (versión + paridad + suite) → correcto.
- `node tools/version.js --check` → coherente en los 5 puntos.
- `node tools/sync-assets.js --check` → paridad OK en las 3 copias.

### Lo que NO se ha hecho y por qué

- **No se ha publicado en producción.** Push y merge a `dev` quedan pendientes de
  autorización explícita, porque escriben en el sitio que usan los usuarios.
- **No se ha desplegado el Worker.** El defecto D-T1 solo afectaba a código que
  nunca estuvo desplegado, así que no hay urgencia operativa. La corrección
  entra en el siguiente despliegue del Worker.
- **No se ha unificado de verdad el contrato temporal.** Requiere convertir el
  frontend a módulos ES (15 etiquetas `<script>` y todo el sistema de globales).
  Riesgo de producto alto, beneficio bajo mientras la invariante esté verificada.
  La decisión es de Fase 2.
- **No se ha tocado NVIDIA (D-T11).** Es decisión de producto, no técnica.
- **No se han versionado** `docs/`, `FASE_1D_INFORME_VALIDACION.md`,
  `BATS_TECHNICAL_AUDIT_CURRENT_STATE.md` ni el contrato en HTML: son
  documentos previos sin revisar y quedan fuera del alcance acordado.

### Deuda que este trabajo ha REDUCIDO

- P1 (backdoor en producción): cerrado en código, pendiente de publicación.
- P2 (`maxTokens`): **cerrado**.
- P3 (divergencia de copias): **cerrado** y ya no puede volver a ocurrir en
  silencio.
- P4 (desalineación de versiones): **cerrado** y verificado mecánicamente.
- P5 (doble fuente de verdad del contrato): parcialmente cerrado; la
  invariante está verificada, la unificación real queda para Fase 2.
- R2 (pérdida de trabajo): **cerrado**. Los cuatro bloques están versionados.
- D-P2 (H-01 duplicado en `dev`): cerrado al consolidar en `master`.

---

## 15. Qué se decide sobre la dirección anterior

- **Se mantiene:** encriptación de claves, gateado del admin, suite de tests, separación de
  `app.js` en módulos, el contrato temporal como concepto.
- **No se mantiene sin justificación:** el Provider Manager tal como está, la precache del módulo
  no cargado, los bumps de SW como ritual, `git add -A` como flujo, `AGENTS.md` tal como está.
- **No se descarta nada sin evaluación:** nada se borra sin pasar por fase B.

---

## 16. Registro de deuda viva

### Deuda de proceso (cerrada por Fase 0)

| Id | Deuda | Estado |
|---|---|---|
| D-P1 | 4 bloques de trabajo sin commitear desde 2026-09-27 | Abierta → Fase 0 |
| D-P2 | H-01 duplicado: en `dev` local sin pushear y sin commitear en `master` | Abierta → Fase 0 |
| D-P3 | Informe de Fase 2A sin redactar | Abierta → 0.5 |
| D-P4 | `AGENTS.md` describe un código que ya no existe | Abierta → 0.5 |

### Deuda técnica (por intervención)

| Id | Deuda | Fichero | Fase |
|---|---|---|---|
| D-T1 | `redactConfig` captura `maxTokens` → admin escribe 4096 en KV | `worker/provider-manager.js:19` | 0.3 |
| D-T2 | Doble fuente de verdad del contrato temporal (60/90 hardcodeados) | `ai.js:169` vs `js/ai/contrato-temporal.js` | 1 |
| D-T3 | Import que cruza directorio en el worker | `worker/worker.js` | 1 |
| D-T4 | `timeoutPropia` recibe `totalMs` como restante → ramas muertas | `js/ai/contrato-temporal.js` | 1 |
| D-T5 | Defaults `40000` duplicados | `worker/worker.js:395,441` | 1 |
| D-T6 | Batería B-11/B-12 usa `readFileSync`+regex, no ejecuta el bucle real | `tests/h04-contrato-temporal.test.js` | 1 |
| D-T7 | Sin CSP, 77 `onclick=` inline | `index.html` | 2 |
| D-T8 | Rate limit en memoria de instancia | `worker/worker.js:134` | 2 |
| D-T9 | Token de worker embebido en el cliente | `ai.js` | 2 |
| D-T10 | Documentación de prompts duplicada (`PROMPTS.md` vs `PROMPTS_v1.1.md`) | `worker/PROMPTS.md` | 2 |
| D-T11 | **NVIDIA sigue ofrecida en la UI y en `AI_PROVIDERS`, pero ya no existe en el catálogo del Worker** | `index.html:467`, `ai.js:17` | decisión de producto pendiente |

### Hallazgo posterior a este informe (2026-10-05, durante la Fase 0)

**D-T11 — coherencia producto/código rota en el selector de proveedor.**

El commit `f70cdf7` ("quitar SambaNova/NVIDIA — modelos obsoletos/caducados")
elimino NVIDIA del catálogo del Worker. Verificado: `grep -c nvidia
worker/provider-manager.js worker/worker.js` devuelve **0 en ambos ficheros**.
Pero la cliente sigue ofreciéndola:

- `index.html:467` — `<option value="nvidia">NVIDIA build.nvidia.com</option>`,
  **sin `disabled` y sin `hidden`**.
- `ai.js:17` — entrada en `AI_PROVIDERS` con el modelo **caducado**
  `meta/llama-3.1-8b-instruct`, que es exactamente el modelo que `42ebf30`
  había actualizado a `3.3-70b` antes de que `f70cdf7` quitara el proveedor.

Consecuencia para el usuario: la opción es seleccionable y no produce el
efecto esperado en la cadena estándar de proveedores, que ya no la incluye. Es
una opción muerta que aparenta funcionar.

`tests/ollama.test.js` incluso afirma que `nvidia` **no** debe estar
deshabilitado, de modo que el test codifica el defecto en lugar de detectarlo.

**NO se ha corregido en Fase 0 por principio 7 (el usuario decide el
producto).** La decisión es de producto y tiene dos salidas legítimas:
deshabilitar/retirar la opción de la UI, o restaurar NVIDIA en el catálogo del
Worker. Requiere una decisión explícita antes de tocar nada.

### Observaciones informativas de auditorías previas (no bloqueantes)

- `MAX_PROVIDERS = 12` y `available` constante `true` en el catálogo: por diseño actual.
- `truncated`/`exceeded` se descartan en el bucle del worker; `rollback` no está cableado a la API.
- `__proto__` en objetos planos no es alcanzable: `render-cards.js:94` hace `if(!dest||!ctx) return`.
- Cabecera de `js/ai-pipeline.js` obsoleta respecto a la API actual; falta salto de línea final.
