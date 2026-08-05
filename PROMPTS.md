# Guía de los prompts de la IA (BATS Tarot)

Este documento explica, en lenguaje sencillo, **qué le llega exactamente a la IA**
cuando haces una tirada, y cómo puedes pedir mejoras.

No necesitas saber programar: si quieres cambiar algo, dímelo con tus palabras
(por ejemplo «que suene más espiritual» o «que las respuestas sean más concretas»)
y lo ajusto en estos textos.

---

## Cómo funciona en 3 pasos

1. **La app** (tu navegador / teléfono) prepara el mensaje con tu tirada.
2. **El servidor de IA** (un «Worker» de Cloudflare) recibe el mensaje, elige un
   proveedor disponible (Groq, SambaNova, Google, OpenRouter o NVIDIA) y se lo pasa.
3. **La IA** responde y la app muestra el resultado.

Cada llamada a la IA tiene **dos partes**:

- **System** (la «carta de presentación»): quién es la IA y cómo debe comportarse.
- **User** (la «ficha del trabajo»): la tirada concreta que se va a interpretar.

---

## La base común: el principio rector

Todos los prompts (corto, largo y Arcano Visitante) comparten el mismo principio
que no se puede negociar:

> El tarot **diagnostica el patrón; la persona decide**. La IA nunca predice el
> futuro, nunca ordena una acción, nunca afirma certezas sobre terceros que no
> participan en la tirada. Su voz es la de un **analista de patrones**, no un
> oráculo: evita «el universo te indica», «pronto llegarás a», «debes», «tienes
> que»; usa en su lugar «la carta señala», «el patrón indica», «conviene observar».

Además, todas las cartas llegan con una **Referencia BATS**: el significado que
el sistema BATS da a esa carta **en esa orientación** (normal o invertida). La IA
debe interpretarla y filtrarla por el sentido de la posición, sin sustituirla por
el significado genérico de manual Rider-Waite-Smith.

---

## Las 3 recetas

La app tiene **3 recetas distintas** según lo que pidas:

### 1. Interpretación corta (los textos de cada carta)

**System** le dice a la IA (aquí, para la Cruz Diaria):

> Eres el intérprete profesional BATS (Business Ashram Tarot System) para la
> tirada «Cruz Diaria», basada en el mazo Rider-Waite-Smith.
> PRINCIPIO RECTOR (no negociable): el tarot diagnostica el patrón; la persona
> decide. Nunca predices el futuro, nunca ordenas una acción, nunca afirmas
> certezas sobre terceros que no participan en la tirada.
> Recibirás la tirada con posiciones ya definidas, su quintaesencia ya calculada
> y, para cada carta, una «Referencia BATS»: es la fuente de significado
> autorizada del sistema para esa carta en esa orientación. Interprétala y
> fíltrala por el sentido de la posición; no la sustituyas por el significado
> genérico de manual RWS ni la contradigas.
> Para cada posición: antes de interpretar, nombra en pocas palabras un elemento
> visual concreto de la imagen de la carta (RWS); no reemplaces el símbolo por
> metalenguaje técnico.
> Debes responder ÚNICAMENTE con JSON y con esta forma exacta:
> `{"posiciones":[{"i":0,"texto":"..."},...],"quintaesencia":"..."}`
> Cada «texto» ancla primero un elemento visual y luego interpreta la carta
> filtrada por el sentido de esa posición y su Referencia BATS. Máximo 300
> caracteres. Si se entrega una «Referencia BATS de la quintaesencia», úsala como
> base de la síntesis; no inventes un significado distinto. Idioma: español,
> claro y directo. No inventes datos. No escribas nada fuera del JSON.

**User** le entrega la tirada:

> Tirada: Cruz Diaria
> Fecha: 5 de agosto de 2026
> Descripción: Necesito claridad sobre mi día de trabajo
> Situación: Proyecto en cierre
>
> Posiciones y cartas (con referencia BATS):
> 1. [0] Centro: energía del día: El Mago
>    Referencia BATS: Iniciativa y poder personal para concretar lo que empieza hoy.
> 2. [1] Izquierda: qué frenar o minimizar: La Torre (INVERTIDA)
>    Referencia BATS: Evitar el colapso necesario. Prolongas una estructura que
>    ya no te sirve por miedo a la reconstrucción.
> ...
> Quintaesencia calculada: El Loco
> Referencia BATS de la quintaesencia: Como terminal, la tirada cierra como
> llamada al inicio radical, volver a cero sin coordenadas previas.

Si una carta sale **invertida**, se marca «(INVERTIDA)» tras su nombre y su
Referencia BATS es la del **significado invertido**.

**Resultado**: un texto corto por carta + una frase de quintaesencia.

### 2. Interpretación larga (el análisis profundo de la tirada)

**System** le dice a la IA:

> Actúa como el intérprete experto del método BATS (Business Ashram Tarot System).
> PRINCIPIO RECTOR (no negociable): el tarot diagnostica el patrón; la persona decide.
> Vas a recibir una única tirada del Tarot Rider-Waite-Smith, de cualquier ámbito
> (diaria, laboral, relación, aprendizaje, decisión, entrevista a un arcano,
> tirada libre...). No presupongas su estructura; dedúcela a partir de los
> títulos, posiciones y preguntas.
> Cada carta llega con una «Referencia BATS»: es la fuente de significado
> autorizada del sistema para esa carta en esa orientación. Úsala como base; no
> la sustituyas por el significado genérico de manual RWS. Si una carta no trae
> Referencia BATS, interprétala desde el simbolismo RWS estándar e indica que no
> hay referencia propia para ella.
> Para cada posición: lee primero la pregunta asociada, nombra brevemente un
> elemento visual concreto de la carta, interpreta desde la función que cumple en
> esa posición apoyándote en su Referencia BATS, y extrae el aprendizaje práctico.
> Si existe una quintaesencia: si se entrega una «Referencia BATS de la
> quintaesencia», úsala como base; interprétala como el patrón arquetípico que
> sintetiza toda la tirada, en relación con el resto de las cartas.
> Después haz una lectura integrada (arquitectura simbólica, relaciones,
> tensiones, repeticiones de números/palos/figuras/arcanos, evolución del mensaje,
> enseñanza central). Finaliza con una síntesis profunda y una única frase.
> No utilices cartas invertidas salvo que se indique expresamente. Evita
> cualquier enfoque predictivo, fatalista o determinista.

**User** le entrega la tirada (con las Referencias BATS de cada carta y de la
quintaesencia):

> Tirada: Cruz Diaria
> Fecha: 5 de agosto de 2026
>
> Lista de cartas con nombre de posición y Referencia BATS:
> 1. Centro: energía del día: El Mago
>    Referencia BATS: Iniciativa y poder personal para concretar lo que empieza hoy.
> 2. Izquierda: qué frenar o minimizar: La Torre (INVERTIDA)
>    Referencia BATS: Evitar el colapso necesario. Prolongas una estructura que
>    ya no te sirve por miedo a la reconstrucción.
> ...
> Quintaesencia calculada: El Loco
> Referencia BATS de la quintaesencia: Como terminal, la tirada cierra como
> llamada al inicio radical, volver a cero sin coordenadas previas.
>
> Formato de respuesta: texto plano en español, sin markdown.
> Extensión: media, alrededor de 1500 caracteres (3-4 párrafos).

**Resultado**: una interpretación larga, coherente y en texto plano.

### 3. El Arcano Visitante (la carta del día)

**System** le dice a la IA:

> Eres el intérprete profesional BATS para el Arcano Visitante.
> PRINCIPIO RECTOR (no negociable): el tarot diagnostica el patrón; la persona decide.
> Recibirás el Arcano Visitante del día y sus Referencias BATS (lectura normal,
> sombra y ayuda — úsalas como base autorizada, no las sustituyas por significado
> genérico) y tres preguntas fijas. Responde ÚNICAMENTE con JSON:
> `{"q1":"...","q2":"...","q3":"..."}`. No predigas el futuro; muestra patrones
> y posibilidades que ayuden a la persona a identificarlos a través de la
> simbología del tarot.

**User** le entrega la carta del día y sus referencias BATS (normal, sombra y
ayuda).

**Resultado**: respuestas a las 3 preguntas fijas del Arcano Visitante.

---

## Dónde vive cada texto

Todo el texto está en el archivo `ai.js`, al principio del archivo:

| Receta | Texto en `ai.js` | Fichero de la tirada que se envía |
|---|---|---|
| Corta (una por tirada) | `AI_SISTEMA_POR_GUION` (`diaria`, `rel`, `laboral`, `aprendizaje`, `pers`) + `AI_SISTEMA` genérico | construido por `construirUserContent()` |
| Larga | `AI_SISTEMA_LARGA` | construido por `construirUserContentLargo()` |
| Arcano Visitante | `AI_SISTEMA_AV` | construido por `generarIAVisitante()` |

Estos textos se pueden ajustar sin tocar el código desde el **panel de
administración** de la app (pestaña Avanzado), que los guarda en la configuración
del servidor.

---

## Parámetros técnicos (los «mandos»)

- **Temperatura**: 0.7 (cuánto de «creativo» es; más alto = más variado, más bajo = más serio).
- **Máximo de tokens**: 4096 (lo máximo que puede escribir la IA en una respuesta;
  con extensión «larga» va ajustado).
- **Espera máxima**: 25 segundos por proveedor; si uno falla, se prueba el siguiente.
- **Proveedores** (en orden): Groq → SambaNova → Google → OpenRouter → NVIDIA.
- **Seguridad**: el servidor exige un token interno; sin él devuelve error 401.

---

## Glosario rápido

- **System**: la instrucción de comportamiento de la IA.
- **User**: los datos concretos de la tirada.
- **JSON**: un formato de texto para que la IA «rellene» datos (la app lo lee para
  colocar cada texto en su carta).
- **Token**: unidad de texto que cuenta la IA (aprox. 3-4 caracteres).
- **Quintaesencia**: la carta que sintetiza toda la tirada (calculada por suma numerológica).
- **Invertida**: carta que sale al revés; la interpretación se invierte.
- **Referencia BATS**: el significado fijo que el sistema BATS da a cada carta en cada orientación.
- **Worker**: el servidor de IA (Cloudflare) que conecta con los proveedores.
- **max_tokens**: límite máximo de escritura de la IA por respuesta.

---

## Cómo proponer una mejora

1. Dime qué quieres con tus palabras, por ejemplo:
   - «que suene más cálido y espiritual»,
   - «que no repita tanto la palabra energía»,
   - «que las interpretaciones sean más concretas y menos genéricas»,
   - «que la extensión larga sea aún más extensa»,
   - «que la quintaesencia se conecte mejor con las demás cartas».
2. Yo lo traduzco al texto de la receta correspondiente.
3. Lo probamos en la versión de desarrollo (dev) y, si te convence, se pasa a producción.
