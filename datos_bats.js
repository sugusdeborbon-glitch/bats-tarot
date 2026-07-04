/* ============================================================================
   DATOS_BATS — Significados universales para las 78 cartas del Tarot
   Cada carta tiene 5 campos:
     normal:    mensaje principal en posición recta
     sombra:    aspecto ciego o patrón a observar
     ayuda:     cómo apoyarse en esta energía
     invertida: mensaje cuando la carta sale invertida
     pregunta:  pregunta de indagación asociada
   ============================================================================ */
var DATOS_BATS = {

  /* ============================= ARCANOS MAYORES ============================= */

  "El Loco":{
    normal:"Salto al vacío con confianza. El camino no está trazado pero el impulso es genuino. Algo nuevo quiere nacer y el único requisito es dar el primer paso.",
    sombra:"Fingir que no se sabe lo que ya se sabe para evitar la responsabilidad de actuar. La inconsciencia como excusa.",
    ayuda:"Confía en el impulso inicial sin necesitar tenerlo todo resuelto. Lo que buscas ya está en ti.",
    invertida:"Temor a dar el paso que sabes que necesitas dar. La parálisis por exceso de análisis te mantiene en el borde sin saltar.",
    pregunta:"¿Qué paso estoy evitando dar porque no tengo todas las respuestas?"
  },
  "El Mago":{
    normal:"Tienes todas las herramientas que necesitas. El poder está en tu capacidad de combinarlas con intención y consciencia.",
    sombra:"Manipulación de recursos o personas para beneficio propio. Usar el talento para impresionar en lugar de para crear.",
    ayuda:"Reconoce lo que ya tienes disponible y actúa. No esperes más recursos, usa los que están a tu alcance ahora.",
    invertida:"Bloqueo creativo. Sabes que tienes potencial pero algo te impide canalizarlo. Falta de dirección o abuso de tu poder.",
    pregunta:"¿Qué herramienta o talento tengo disponible que no estoy utilizando?"
  },
  "La Sacerdotisa":{
    normal:"El conocimiento profundo no necesita palabras. Escucha la voz interna, la intuición que sabe antes de que entiendas.",
    sombra:"Guardar silencio cuando toca hablar. Usar el misterio para evitar mostrarte o comprometerte.",
    ayuda:"Antes de buscar fuera, consulta dentro. La respuesta ya está ahí, solo necesitas hacer silencio para oírla.",
    invertida:"Desconexión de tu intuición. Buscar respuestas solo en el exterior ignorando tu sabiduría interna.",
    pregunta:"¿Qué sé en lo más profundo que no me estoy permitiendo reconocer?"
  },
  "La Emperatriz":{
    normal:"Abundancia, fertilidad y crecimiento natural. Lo que has cuidado florece. Es tiempo de cosechar los frutos de tu dedicación.",
    sombra:"Sobreadministración. Dar tanto que terminas agotado. Cuidar a otros descuidándote a ti mismo.",
    ayuda:"Permítete recibir. La naturaleza fluye tanto en dar como en tomar. Estás sostenido por la vida misma.",
    invertida:"Bloqueo creativo o estancamiento. Dependencia emocional o falta de autocuidado. La fuente se seca si no te nutres primero.",
    pregunta:"¿Qué necesito recibir hoy para seguir dando con alegría?"
  },
  "El Emperador":{
    normal:"Estructura, orden y autoridad bien puesta. Tiempo de poner límites claros y establecer sistemas que funcionen.",
    sombra:"Rigidez o abuso de poder. Imponer tu voluntad sin escuchar. La estructura ahoga en lugar de sostener.",
    ayuda:"Tu experiencia y firmeza son necesarias. Lidera con claridad, pero sin aplastar. El orden sirve al propósito.",
    invertida:"Falta de disciplina o estructura. Autoridad débil o ausente. Necesitas poner orden antes de poder avanzar.",
    pregunta:"¿Qué estructura o límite necesito establecer para que las cosas fluyan mejor?"
  },
  "El Hierofante":{
    normal:"Sabiduría transmitida, enseñanza, mentores. Hay quien ya recorrió este camino y puede guiarte. Aprende de la tradición.",
    sombra:"Dogmatismo. Seguir reglas ciegamente sin cuestionar si siguen siendo válidas. La tradición como cárcel.",
    ayuda:"Busca el consejo de quien tiene experiencia. No necesitas inventarlo todo desde cero. La sabiduría colectiva te sostiene.",
    invertida:"Rebeldía sin causa. Rechazar toda autoridad o tradición solo por serlo. Necesitas encontrar tu propia voz sin despreciar lo aprendido.",
    pregunta:"¿Qué enseñanza antigua podría aplicarme hoy si dejara de lado mi resistencia?"
  },
  "Los Enamorados":{
    normal:"Elección desde el corazón. Una decisión importante requiere alinearte con tus valores más profundos. El amor como guía.",
    sombra:"Indecisión crónica. Querer quedarte todas las opciones sin comprometerte. Miedo a cerrar puertas.",
    ayuda:"Tu corazón ya sabe. No se trata de elegir entre bueno y malo, sino entre lo que resuena con tu verdad.",
    invertida:"Desalineamiento. Una decisión tomada desde la obligación o el miedo. Necesitas revisar tus elecciones.",
    pregunta:"¿Qué decisión estoy postergando por miedo a perder algo que ya no me pertenece?"
  },
  "El Carro":{
    normal:"Victoria por determinación. Has superado obstáculos con voluntad firme. La dirección está clara y avanzas con poder.",
    sombra:"Voluntarismo. Avanzar a toda costa sin importar a quién atropellas ni lo que destruyes. El ego al mando.",
    ayuda:"Tu determinación es tu mayor aliada. Sigue avanzando con la visión clara, pero sin aplastar lo que encuentres.",
    invertida:"Falta de dirección. Giras en círculos sin avanzar. La voluntad dispersa no lleva a ninguna parte.",
    pregunta:"¿Estoy avanzando hacia donde realmente quiero ir o solo estoy en movimiento por inercia?"
  },
  "La Fuerza":{
    normal:"Fortaleza interior, paciencia y compasión. La verdadera fuerza no es la que aplasta, sino la que sostiene con gentileza.",
    sombra:"Represión de tu poder por miedo. Domar tu fuerza en lugar de canalizarla. La mansedumbre como evitación.",
    ayuda:"Tu poder no necesita demostrarse. La confianza tranquila mueve más que la imposición violenta.",
    invertida:"Inseguridad o descontrol. La fuerza se vuelve contra ti. Necesitas reconciliarte con tu poder interno.",
    pregunta:"¿Dónde estoy usando mi fuerza para reprimir en lugar de para sostener?"
  },
  "El Ermitaño":{
    normal:"Retiro necesario, introspección, búsqueda interior. Tiempo de mirar hacia adentro para encontrar respuestas profundas.",
    sombra:"Aislamiento improductivo. Esconderte del mundo en lugar de buscar genuinamente. Soledad que no es sabiduría sino evasión.",
    ayuda:"La soledad elegida es fértil. Tómate el tiempo para escucharte sin distracciones. Allí encontrarás tu luz.",
    invertida:"Conexión forzada o miedo a la soledad. Sales al mundo sin haberte encontrado a ti mismo primero.",
    pregunta:"¿Qué necesito escuchar en el silencio que el ruido del mundo no me deja oír?"
  },
  "La Rueda de la Fortuna":{
    normal:"Cambio inevitable. El ciclo gira y trae nuevas oportunidades. Lo que estaba detenido comienza a moverse.",
    sombra:"Resistencia al cambio. Querer controlar lo que no se puede controlar. Víctima del destino en lugar de participar.",
    ayuda:"El cambio no es tu enemigo. Súbete a la rueda y fluye con el momento. La fortuna favorece a quien se mueve.",
    invertida:"Estancamiento o mala racha. El ciclo parece detenido en contra tuya. Paciencia, la rueda siempre sigue girando.",
    pregunta:"¿Qué cambio está ocurriendo ahora que me resisto a aceptar?"
  },
  "La Justicia":{
    normal:"Equilibrio, verdad y consecuencia. Cada acción tiene su resultado. Tiempo de asumir la responsabilidad de tus decisiones.",
    sombra:"Juicio sin compasión. Usar la verdad como arma. Justicia que olvida la humanidad de las personas.",
    ayuda:"Busca el equilibrio interno antes que el externo. Cuando estás alineado, el mundo también lo está.",
    invertida:"Injusticia o deshonestidad. Algo no está en orden. Negarte a ver la verdad o evadir la responsabilidad.",
    pregunta:"¿Qué verdad estoy evadiendo que ya conozco en el fondo?"
  },
  "El Colgado":{
    normal:"Pausa necesaria. Mirar desde otra perspectiva. Hay poder en soltar el control y simplemente observar.",
    sombra:"Martirio innecesario. Sacrificarte cuando no hace falta. Confundir sufrimiento con propósito.",
    ayuda:"Deja de forcejear. Cuanto más luchas, más te enredas. La solución viene cuando cambias de perspectiva.",
    invertida:"Sacrificio sin sentido o resistencia a la pausa. Sigues forcejeando cuando la única salida es soltar.",
    pregunta:"¿Qué situación gana claridad si dejo de intentar controlarla y solo la observo?"
  },
  "La Muerte":{
    normal:"Fin de un ciclo. Transformación profunda e inevitable. No es el final, es el fin de una fase para que nazca otra.",
    sombra:"Aferrarte a lo que ya murió. Negarte a soltar por miedo al vacío. Lo muerto no puede revivirse.",
    ayuda:"Suelta. Lo que termina deja espacio para lo nuevo. La transformación es dolorosa pero necesaria. Confía en el proceso.",
    invertida:"Estancamiento por resistencia. Te niegas a cambiar y el estancamiento te paraliza. El miedo al nuevo ciclo te mantiene atrapado.",
    pregunta:"¿Qué necesito dejar morir para que algo nuevo pueda nacer?"
  },
  "La Templanza":{
    normal:"Equilibrio, armonía, integración. La combinación justa de elementos opuestos. Paciencia y medida en todo.",
    sombra:"Mediocridad disfrazada de equilibrio. No tomar posición por miedo al conflicto. La tibieza como excusa.",
    ayuda:"Encuentra el punto medio sin diluirte. La verdadera maestría está en saber integrar sin perder esencia.",
    invertida:"Desequilibrio, excesos o falta de medida. Algo está fuera de proporción. Necesitas restaurar la armonía.",
    pregunta:"¿Dónde estoy sacrificando mi verdad en nombre del equilibrio?"
  },
  "El Diablo":{
    normal:"Reconocimiento de la sombra. Tus ataduras se hacen visibles para que puedas liberarte. El poder de mirar lo que niegas.",
    sombra:"Adicción, dependencia, patrones repetitivos. Esclavitud que disfrazas de elección. Lo que te ata y no quieres ver.",
    ayuda:"Reconoce tus cadenas. La conciencia es el primer paso hacia la liberación. No puedes soltar lo que no admites que te ata.",
    invertida:"Liberación o negación. Puedes estar rompiendo una atadura o, por el contrario, negando que existe.",
    pregunta:"¿A qué estoy atado que prefiero llamar 'elección'?"
  },
  "La Torre":{
    normal:"Derrumbe de lo falso. Lo que estaba construido sobre una base débil se cae. Doloroso pero liberador.",
    sombra:"Provocar crisis innecesarias. Destruir lo que funciona por intolerancia a la calma. La crisis como adicción.",
    ayuda:"Deja que caiga lo que ya no sirve. Duele, pero es mejor que seguir sosteniendo una mentira.",
    invertida:"Evitar el colapso necesario. Prolongas una estructura que ya no te sirve por miedo a la reconstrucción.",
    pregunta:"¿Qué estructura en mi vida está esperando derrumbarse y yo sigo apuntalándola?"
  },
  "La Estrella":{
    normal:"Esperanza, inspiración, renovación. Después de la tormenta llega la calma. Confianza en que todo está bien.",
    sombra:"Ingenuidad. Esperar que el universo haga lo que solo tú puedes hacer. Fe sin acción no es esperanza, es fantasía.",
    ayuda:"Conéctate con tu propósito más elevado. La luz que buscas ya está dentro de ti. Confía y actúa desde ahí.",
    invertida:"Desesperanza o desconexión. Has perdido la fe. Necesitas encontrar de nuevo tu fuente de inspiración.",
    pregunta:"¿Qué me devuelve la esperanza cuando la pierdo?"
  },
  "La Luna":{
    normal:"Misterio, ilusión, confusión. No todo es lo que parece. La verdad está velada, necesitas mirar con atención.",
    sombra:"Miedo a lo que no ves. Proyectar tus fantasmas en los demás. La paranoia como mecanismo.",
    ayuda:"No tomes decisiones apresuradas en la confusión. Espera a que la luz llegue y todo se aclare.",
    invertida:"Aclaración gradual. Lo que estaba oculto comienza a revelarse. Las ilusiones se disipan, la verdad emerge.",
    pregunta:"¿Qué miedo irracional está nublando mi visión actual?"
  },
  "El Sol":{
    normal:"Claridad absoluta, alegría, éxito. La luz ilumina todo y ves con nitidez. Es tiempo de celebrar y brillar.",
    sombra:"Ego inflado. Centrar toda la luz en ti cuando es compartida. El éxito sin humildad se vuelve soledad.",
    ayuda:"Disfruta este momento. Brilla sin miedo a deslumbrar. Tu luz también guía a otros.",
    invertida:"Falta de claridad o alegría. El sol se oculta temporalmente. La vitalidad reducida, pero volverá a brillar.",
    pregunta:"¿Qué me impide disfrutar plenamente del éxito y la claridad que ya tengo?"
  },
  "El Juicio":{
    normal:"Renacimiento, llamado superior, revisión. Un despertar te llama a un nivel más alto. Lo viejo queda atrás.",
    sombra:"Juzgar a otros en lugar de atender tu propio llamado. La crítica como distracción de tu propósito.",
    ayuda:"Escucha el llamado. Es hora de elevarte a la siguiente versión de ti mismo. No pospongas tu renacimiento.",
    invertida:"Auto-crítica paralizante. Dudas de tu valía y no respondes al llamado. El miedo al juicio ajeno te detiene.",
    pregunta:"¿A qué versión más elevada de mí mismo me está llamando la vida?"
  },
  "El Mundo":{
    normal:"Completitud, culminación, integración. Has llegado. Un ciclo se cierra con maestría y plenitud.",
    sombra:"Perfeccionismo que impide cerrar. No das por terminado lo que ya está completo. El cierre se posterga.",
    ayuda:"Celebra tu logro. Has completado el ciclo con éxito. Reconoce lo lejos que has llegado.",
    invertida:"Ciclo incompleto o interrumpido. Algo queda pendiente. Ajusta lo necesario para cerrar bien.",
    pregunta:"¿Qué necesito soltar para darme por completo y celebrar lo alcanzado?"
  },

  /* ============================= BASTOS ============================= */

  "As de Bastos":{
    normal:"Chispa inicial, inspiración pura. El impulso creativo nace. El potencial está intacto, listo para ser canalizado.",
    sombra:"Impulso sin dirección. Mucha energía inicial que no encuentra cauce. Entusiasmo que se disipa sin acción.",
    ayuda:"Atrapa esa inspiración y tradúcela en acción. El primer paso es el más importante. No lo pienses más.",
    invertida:"Bloqueo creativo o falta de motivación. La chispa no prende. Necesitas reconectar con tu deseo genuino.",
    pregunta:"¿Qué proyecto o idea está pidiendo nacer a través de mí?"
  },
  "Dos de Bastos":{
    normal:"Visión y planificación. Miras el horizonte con claridad. Tienes el mundo ante ti, elige tu dirección.",
    sombra:"Parálisis por análisis. Tantas posibilidades que no avanzas. Planificar sin ejecutar es un castillo en el aire.",
    ayuda:"Tu visión es amplia, ahora elige una dirección. El próximo paso es comprometerte con un camino.",
    invertida:"Falta de visión o miedo a expandirte. Te quedas pequeño cuando el horizonte te espera.",
    pregunta:"¿Qué dirección estoy evitando tomar por miedo a comprometerme con ella?"
  },
  "Tres de Bastos":{
    normal:"Expansión, crecimiento, preparación. Lo que empezaste cobra escala. El mundo responde a tu iniciativa.",
    sombra:"Impaciencia. Querer resultados inmediatos cuando el proceso aún se está gestando. Forzar lo que necesita tiempo.",
    ayuda:"Sigue avanzando con confianza. La semilla ya está plantada, ahora toca esperar su desarrollo natural.",
    invertida:"Retrasos o frustración. El progreso no avanza al ritmo esperado. Necesitas paciencia o ajustar tu estrategia.",
    pregunta:"¿Estoy forzando un resultado que necesita más tiempo de maduración?"
  },
  "Cuatro de Bastos":{
    normal:"Celebración, estabilidad, hogar. Has construido una base sólida. Es tiempo de festejar y recoger los frutos.",
    sombra:"Conformismo prematuro. Celebrar antes de tiempo y dormirte en los laureles. La comodidad que frena el crecimiento.",
    ayuda:"Disfruta este momento de plenitud. Has trabajado para llegar aquí. Permítete la alegría del logro compartido.",
    invertida:"Inestabilidad en casa o en tu base. Algo en los cimientos no está firme. Revisa lo que necesitas asegurar.",
    pregunta:"¿Qué logro reciente no estoy celebrando lo suficiente?"
  },
  "Cinco de Bastos":{
    normal:"Conflicto, competencia, desafío. Las fuerzas se enfrentan. La tensión te empuja a superarte o a redefinirte.",
    sombra:"Peleas sin propósito. Competir por competir. El conflicto como identidad en lugar de como herramienta.",
    ayuda:"Canaliza la tensión hacia tu crecimiento. No toda competencia es negativa; a veces te saca lo mejor de ti.",
    invertida:"Evitación del conflicto necesario. No enfrentar la discusión que necesita ocurrir. La paz falsa es más cara.",
    pregunta:"¿Estoy evitando un conflicto necesario por miedo a la confrontación?"
  },
  "Seis de Bastos":{
    normal:"Victoria, reconocimiento, éxito público. Tu esfuerzo es visto y valorado. Tiempo de recibir el aplauso.",
    sombra:"Dependencia del reconocimiento ajeno. Actuar para la validación externa. El éxito sin sustancia interior.",
    ayuda:"Acepta el reconocimiento con gratitud. Has trabajado duro para esto. Deja que otros te vean brillar.",
    invertida:"Falta de reconocimiento. Tu esfuerzo no está siendo visto. Humildad forzada o éxito no compartido.",
    pregunta:"¿Estoy buscando validación externa para sentirme valioso?"
  },
  "Siete de Bastos":{
    normal:"Defensa de tu posición. Mantienes tu terreno frente a la oposición. Tienes argumentos y determinación.",
    sombra:"Actitud defensiva crónica. Verte atacado donde no hay ataque. La paranoia te mantiene en guardia innecesaria.",
    ayuda:"Defiende lo que has construido, pero no te aísles. Tu posición es fuerte, puedes mantenerla sin agresividad.",
    invertida:"Rendición o agotamiento. Has perdido la fuerza para defender lo tuyo. Quizás toca retirarse estratégicamente.",
    pregunta:"¿Estoy defendiendo una posición que ya no merece la pena mantener?"
  },
  "Ocho de Bastos":{
    normal:"Velocidad, acción, movimiento rápido. Las cosas se aceleran. El momento es ahora, todo confluye.",
    sombra:"Apresuramiento imprudente. Moverse tan rápido que se pierde el rumbo. Velocidad sin dirección es caos.",
    ayuda:"El momento es favorable para la acción rápida. Cuando todo fluye, solo tienes que dejarte llevar.",
    invertida:"Retrasos, lentitud, obstáculos. El flujo se interrumpe. Algo requiere tu atención antes de seguir.",
    pregunta:"¿Estoy avanzando a la velocidad correcta o me estoy apresurando?"
  },
  "Nueve de Bastos":{
    normal:"Resiliencia, perseverancia, límites. Casi al final del camino, agotado pero firme. Lo último que resiste es lo que más fortalece.",
    sombra:"Agotamiento por exceso de vigilancia. No puedes bajar la guardia aunque ya no sea necesario. El estrés crónico.",
    ayuda:"El final está cerca. Un último esfuerzo y completas el ciclo. Descansa cuando termines, no antes.",
    invertida:"Abandono antes de la meta. Te rindes cuando ya casi llegas. La fatiga te nubla la visión de la meta cercana.",
    pregunta:"¿Qué reserva de fuerza me queda que no estoy reconociendo?"
  },
  "Diez de Bastos":{
    normal:"Carga completa, responsabilidad máxima. Has asumido más de lo que puedes manejar. Es tiempo de delegar.",
    sombra:"Martirio por sobrecarga. Cargar con todo por orgullo o control. El exceso de responsabilidad como identidad.",
    ayuda:"No tienes que hacerlo todo solo. Delegar no es debilidad, es inteligencia. Suelta parte de la carga.",
    invertida:"Soltar la carga o colapsar. Has llegado al límite. Necesitas priorizar y soltar lo que no es esencial.",
    pregunta:"¿Qué responsabilidad sigo cargando que podría delegar o soltar?"
  },
  "Sota de Bastos":{
    normal:"Entusiasmo, exploración, nueva aventura. Un nuevo proyecto o idea te llena de energía. El comienzo es prometedor.",
    sombra:"Entusiasmo sin compromiso. Empezar proyectos que no se terminan. Mucha energía inicial, poca sostenibilidad.",
    ayuda:"Deja que la emoción te guíe al inicio, pero prepárate para el largo plazo. El entusiasmo abre puertas.",
    invertida:"Falta de inspiración o indecisión. El entusiasmo decae. Necesitas reconectar con lo que realmente te apasiona.",
    pregunta:"¿Qué nuevo proyecto merece mi entusiasmo y compromiso real?"
  },
  "Caballo de Bastos":{
    normal:"Acción audaz, aventura, impulso imparable. Has decidido y te lanzas sin dudar. La energía te lleva.",
    sombra:"Impulsividad destructiva. Actuar sin pensar, sin medir consecuencias. El movimiento sin dirección es peligroso.",
    ayuda:"Tu audacia es tu fortaleza. Lánzate con confianza, pero mantén un ojo en el rumbo. La acción sin conciencia es riesgo.",
    invertida:"Frustración por inacción. Quieres avanzar pero algo te detiene. Energía contenida que no encuentra salida.",
    pregunta:"¿Hacia dónde me estoy lanzando sin haber medido bien las consecuencias?"
  },
  "Reina de Bastos":{
    normal:"Confianza, calidez, creatividad. Liderazgo inspirador que nace de la autenticidad. Tu fuego ilumina a otros.",
    sombra:"Exhibicionismo o arrogancia. El fuego que debería calentar termina quemando. El carisma sin sustancia.",
    ayuda:"Tu presencia inspira. Usa tu energía para elevar a otros sin perder tu centro. Brilla y deja brillar.",
    invertida:"Inseguridad disfrazada de fuerza. Tu llama titubea. Necesitas reconectar con tu fuente de confianza.",
    pregunta:"¿Estoy usando mi energía para inspirar o para impresionar?"
  },
  "Rey de Bastos":{
    normal:"Liderazgo visionario, iniciativa, emprendimiento. Tienes la madurez para guiar tu visión hacia la realidad.",
    sombra:"Autoritarismo o impaciencia con quien no sigue tu ritmo. Tu fuego intimida en lugar de motivar.",
    ayuda:"Tu visión es clara y tu experiencia te respalda. Lidera con generosidad, no con imposición.",
    invertida:"Liderazgo débil o inconsistente. Tu autoridad no se sostiene. Falta de dirección o abuso de poder.",
    pregunta:"¿Qué tipo de líder estoy siendo para quienes me rodean?"
  },

  /* ============================= COPAS ============================= */

  "As de Copas":{
    normal:"Amor, apertura emocional, nueva conexión. El corazón se abre. La energía del amor fluye sin condiciones.",
    sombra:"Vulnerabilidad sin límites. Dar el corazón sin discernimiento. Ahogarte en la emoción del momento.",
    ayuda:"Permítete sentir sin miedo. El amor que buscas también está dentro de ti. Ábrete a recibir.",
    invertida:"Bloqueo emocional. Dificultad para dar o recibir amor. El corazón cerrado por experiencias pasadas.",
    pregunta:"¿Dónde estoy cerrando mi corazón por miedo a ser herido de nuevo?"
  },
  "Dos de Copas":{
    normal:"Conexión, unión, atracción mutua. Un vínculo especial se forma o se profundiza. Encuentro de almas.",
    sombra:"Dependencia emocional. Fusionarte con el otro hasta perderte. La relación como muleta.",
    ayuda:"Disfruta la conexión sin perder tu identidad. La unión verdadera suma sin anular.",
    invertida:"Desunión o ruptura. La conexión se rompe o está desequilibrada. Algo impide la reciprocidad.",
    pregunta:"¿Esta conexión nace desde la plenitud o desde la necesidad?"
  },
  "Tres de Copas":{
    normal:"Amistad, celebración, comunidad. El gozo compartido multiplica la alegría. Tiempo de confraternizar.",
    sombra:"Excesos o superficialidad. La celebración como huida. Relaciones que solo existen en la fiesta.",
    ayuda:"Celebra con quienes te quieren. La alegría compartida es medicina para el alma.",
    invertida:"Aislamiento social o conflictos con amigos. La celebración se cancela. Necesitas revisar tus vínculos.",
    pregunta:"¿Estoy cultivando relaciones genuinas o solo encuentros superficiales?"
  },
  "Cuatro de Copas":{
    normal:"Contemplación, apatía, meditación. Algo no te satisface a pesar de tener opciones. Tiempo de mirar hacia adentro.",
    sombra:"Ingratitud o indiferencia. No valorar lo que tienes. La queja como hábito en lugar de la acción.",
    ayuda:"A veces la falta de satisfacción es una llamada a buscar más profundo. No todo lo que necesitas está en la superficie.",
    invertida:"Nuevas oportunidades. Salir de la apatía. Lo que ignorabas se vuelve relevante. Abre los ojos.",
    pregunta:"¿Qué oportunidad estoy ignorando porque no se ve como esperaba?"
  },
  "Cinco de Copas":{
    normal:"Pérdida, duelo, tristeza. Algo se ha derramado y no puede recuperarse. Permítete sentir la pérdida.",
    sombra:"Estancarte en la pérdida. Mirar solo lo que falta y no lo que queda. El duelo prolongado como identidad.",
    ayuda:"Hay dos copas aún en pie. No ignores el dolor, pero tampoco olvides lo que aún tienes.",
    invertida:"Aceptación y sanación. Empiezas a mirar adelante. Dejas de enfocarte en lo perdido y ves lo que queda.",
    pregunta:"¿Qué me estoy negando a ver que aún tengo disponible?"
  },
  "Seis de Copas":{
    normal:"Nostalgia, recuerdos, inocencia. Miras al pasado con cariño. La memoria de tiempos más simples te reconforta.",
    sombra:"Vivir en el pasado. Idealizar lo que fue y no ver lo que es. La nostalgia como resistencia al presente.",
    ayuda:"Lo vivido te dio alegría y aprendizaje. Honra tu pasado sin quedarte atrapado en él.",
    invertida:"Atrapado en el pasado o rompiendo con él. Necesitas soltar las ataduras de lo que fue.",
    pregunta:"¿Estoy viviendo en recuerdos en lugar de construir el presente?"
  },
  "Siete de Copas":{
    normal:"Imaginación, fantasía, múltiples opciones. Hay posibilidades que explorar, pero no todas son reales.",
    sombra:"Confundir fantasía con realidad. Perseguir lo imposible ignorando lo tangible. La cabeza en las nubes.",
    ayuda:"Sueña, pero manten un pie en la tierra. No todas las opciones brillantes son viables. Elige con lucidez.",
    invertida:"Claridad tras la confusión. Empiezas a distinguir las opciones reales de las ilusorias. Enfoque.",
    pregunta:"¿De qué ilusión necesito despertarme para ver la realidad claramente?"
  },
  "Ocho de Copas":{
    normal:"Retiro, búsqueda, dejar atrás. Te alejas de lo que ya no te satisface para buscar algo más profundo.",
    sombra:"Huir sin cerrar. Abandonar situaciones sin resolver. Confundir evasión con búsqueda espiritual.",
    ayuda:"Tu insatisfacción es una brújula. No te quedas donde ya no creces. El movimiento es necesario.",
    invertida:"Miedo a irte o regreso forzado. Quieres marcharte pero algo te retiene. El camino de vuelta es parte del proceso.",
    pregunta:"¿Estoy dejando atrás una situación que ya no me sirve o estoy huyendo de algo que debería enfrentar?"
  },
  "Nueve de Copas":{
    normal:"Satisfacción, cumplimiento, deseos realizados. Has alcanzado lo que querías. El contento genuino te habita.",
    sombra:"Autocomplacencia y arrogancia. Creerte superior por tus logros. La felicidad que aísla de los demás.",
    ayuda:"Disfruta tu logro con humildad. Te lo has ganado. Comparte tu alegría sin ostentación.",
    invertida:"Insatisfacción a pesar de tenerlo todo. El logro no llena el vacío interno. Algo esencial sigue faltando.",
    pregunta:"¿Qué deseo cumplido no me ha dado la felicidad que esperaba?"
  },
  "Diez de Copas":{
    normal:"Felicidad plena, armonía familiar, realización emocional. La bendición de la alegría compartida en su máxima expresión.",
    sombra:"Idealización irreal. Esperar la perfección emocional que no existe. La familia feliz como fachada.",
    ayuda:"Valora la armonía que has construido. La felicidad verdadera se comparte. Celebra el amor en tu vida.",
    invertida:"Desarmonía o conflicto familiar. La paz se rompe. Algo necesita sanarse en el ámbito doméstico.",
    pregunta:"¿Qué necesito sanar en mis relaciones más cercanas para encontrar la paz que busco?"
  },
  "Sota de Copas":{
    normal:"Intuición, mensaje emocional, nueva inspiración. El corazón te envía una señal. Abre tu sensibilidad.",
    sombra:"Inmadurez emocional. Romanticismo ingenuo. Confundir la intuición con el deseo.",
    ayuda:"Escucha los mensajes de tu corazón. La intuición te guía donde la razón no llega.",
    invertida:"Bloqueo intuitivo o inmadurez. No confías en lo que sientes. La emoción te desborda sin que puedas canalizarla.",
    pregunta:"¿Qué está tratando de decirme mi corazón que no quiero escuchar?"
  },
  "Caballo de Copas":{
    normal:"Persecución del ideal, romance, propuesta. Llegas con el corazón abierto y ofreces lo mejor de ti.",
    sombra:"Persecución de un ideal imposible. Enamorarte de la idea más que de la realidad. El príncipe azul como trampa.",
    ayuda:"Sigue tu ideal pero mantén los pies en la tierra. La pasión que te mueve puede ser real si no idealizas.",
    invertida:"Rechazo o desilusión. Tu oferta no es aceptada o el ideal se desmorona. Gestiona la frustración.",
    pregunta:"¿Estoy persiguiendo una persona o una proyección de lo que quiero que sea?"
  },
  "Reina de Copas":{
    normal:"Empatía, compasión, sabiduría emocional. Tu sensibilidad es un don. Sostienes con amor y claridad.",
    sombra:"Absorber las emociones ajenas sin límite. Ahogarte en el mar emocional de otros. La empatía sin filtro.",
    ayuda:"Tu capacidad de amar y comprender es profunda. Úsala con sabiduría, sin olvidar cuidar de ti.",
    invertida:"Desequilibrio emocional o codependencia. Absorbes o reprimes. Necesitas restaurar tu centro emocional.",
    pregunta:"¿Dónde estoy poniendo mis límites emocionales para no perderme en los demás?"
  },
  "Rey de Copas":{
    normal:"Madurez emocional, compasión serena, dominio interior. Has integrado tus emociones con sabiduría.",
    sombra:"Frialdad emocional bajo máscara de control. Reprimir para no mostrar vulnerabilidad. El control como defensa.",
    ayuda:"Tu estabilidad emocional es un ancla para otros. Comparte tu calma sin volverte distante.",
    invertida:"Inestabilidad emocional. Las emociones te desbordan. Pérdida de control o manipulación emocional.",
    pregunta:"¿Estoy procesando mis emociones genuinamente o solo aparentando que las controlo?"
  },

  /* ============================= ESPADAS ============================= */

  "As de Espadas":{
    normal:"Claridad mental, verdad, corte limpio. La mente se ilumina. Ves con total nitidez lo que antes era confuso.",
    sombra:"Frialdad excesiva. Cortar por lo sano sin considerar el impacto emocional. La verdad sin compasión hiere.",
    ayuda:"Tu claridad es un don. Úsala para tomar decisiones difíciles con valentía y honestidad.",
    invertida:"Confusión o falta de claridad. No ves con nitidez. La información está distorsionada o incompleta.",
    pregunta:"¿Qué verdad estoy evitando ver que me daría claridad si la aceptara?"
  },
  "Dos de Espadas":{
    normal:"Decisión difícil, empate, bloqueo. Dos opciones igualmente importantes te mantienen en equilibrio tenso.",
    sombra:"Negarte a decidir. Taparte los ojos ante la evidencia. La indecisión también es una elección.",
    ayuda:"Quita la venda y mira la situación de frente. No decidir es decidir. La claridad llega cuando actúas.",
    invertida:"Información oculta o indecisión. Algo se revela que rompe el empate. La verdad emerge.",
    pregunta:"¿Qué información estoy ignorando para no tener que tomar una decisión incómoda?"
  },
  "Tres de Espadas":{
    normal:"Dolor, pena, desilusión. El corazón herido necesita procesar la tristeza. Duele, pero es parte del camino.",
    sombra:"Aferrarte al dolor. Hacer de la herida una identidad. El sufrimiento como narrativa central.",
    ayuda:"El dolor no es para siempre. Atraviesa la tristeza sin quedarte en ella. Después vendrá la calma.",
    invertida:"Sanación tras la herida. Empiezas a recuperarte. Las lágrimas dieron paso a la comprensión.",
    pregunta:"¿Qué dolor sigo cargando que ya debería haber soltado?"
  },
  "Cuatro de Espadas":{
    normal:"Descanso, recuperación, tregua. La mente y el cuerpo piden pausa. El silencio restaura tus fuerzas.",
    sombra:"Evitación disfrazada de descanso. Paralizarte cuando toca moverse. El reposo como excusa para no enfrentar.",
    ayuda:"El descanso es parte del proceso. No puedes dar lo que no tienes. Recupérate para volver con fuerza.",
    invertida:"Agotamiento extremo o inquietud. No logras descansar aunque lo necesitas. La mente no se detiene.",
    pregunta:"¿Qué pasaría si realmente me permitiera descansar sin culpa?"
  },
  "Cinco de Espadas":{
    normal:"Conflicto, derrota, tensión. No siempre se gana. Esta batalla puede no ser tuya o no valer la pena.",
    sombra:"Ganar a cualquier costo. Victoria vacía que deja el campo peor de lo que estaba. Triunfo sin honor.",
    ayuda:"Elige tus batallas con sabiduría. A veces retirarse es más estratégico que ganar a cualquier precio.",
    invertida:"Reconciliación o derrota aceptada. El conflicto cesa. Aceptas la pérdida y buscas paz.",
    pregunta:"¿Estoy luchando una batalla que no merece mi energía?"
  },
  "Seis de Espadas":{
    normal:"Transición, mudanza, dejar atrás. Viajas hacia aguas más tranquilas. Lo mejor está adelante.",
    sombra:"Arrastrar los problemas contigo. Cambiar de escenario sin cambiar internamente. La huida sin transformación.",
    ayuda:"El movimiento te llevará a un lugar mejor. Confía en la travesía. Deja atrás lo que ya no pesa.",
    invertida:"Transición bloqueada o regreso forzado. No puedes avanzar. Algo queda pendiente de resolver.",
    pregunta:"¿Qué necesito dejar atrás para poder avanzar realmente?"
  },
  "Siete de Espadas":{
    normal:"Estrategia, astucia, discreción. No todo se dice abiertamente. A veces la sutileza es más eficaz.",
    sombra:"Engaño o manipulación. Tomar atajos deshonestos. La mentira como herramienta habitual.",
    ayuda:"Usa tu inteligencia con integridad. La estrategia es válida, el engaño no. La astucia al servicio de la verdad.",
    invertida:"Confesión o descubrimiento. Lo oculto sale a la luz. Mentiras que se desmoronan. Honestidad forzada.",
    pregunta:"¿Dónde estoy siendo menos honesto de lo que debería ser?"
  },
  "Ocho de Espadas":{
    normal:"Restricción, trampa mental, parálisis. Te sientes atrapado aunque hay salida. La mente crea barrotes donde no los hay.",
    sombra:"Victimismo. Creerte sin opciones cuando sí las tienes. La impotencia como refugio cómodo.",
    ayuda:"Las ataduras existen principalmente en tu mente. Busca la salida, está ahí aunque no la veas. Pide ayuda.",
    invertida:"Liberación de la trampa mental. Recuperas tu poder. Encuentras la salida que siempre estuvo ahí.",
    pregunta:"¿Qué limitación autoimpuesta me impide ver las opciones que realmente tengo?"
  },
  "Nueve de Espadas":{
    normal:"Ansiedad, pesadillas, preocupación extrema. La mente genera escenarios catastróficos que no son reales.",
    sombra:"Rumia obsesiva. Dar vueltas al mismo miedo sin resolverlo. El sufrimiento anticipado como hábito.",
    ayuda:"Tus miedos no son profecías. La mayoría de lo que temes nunca ocurre. Respira y vuelve al presente.",
    invertida:"La ansiedad disminuye. Empiezas a ver que el peligro no era tan grande. La luz llega al amanecer.",
    pregunta:"¿Qué estoy sufriendo por anticipado que probablemente nunca ocurrirá?"
  },
  "Diez de Espadas":{
    normal:"Final doloroso, punto más bajo. Has tocado fondo. Duele, pero desde aquí solo se puede ascender.",
    sombra:"Teatralidad del sufrimiento. Hacer del final una tragedia mayor de lo que es. El drama como mecanismo.",
    ayuda:"Has llegado al límite del dolor. No puede empeorar. Ahora toca levantarse y empezar de nuevo.",
    invertida:"Recuperación tras la crisis. El ciclo de dolor termina. Renacimiento desde las cenizas.",
    pregunta:"¿Qué final necesito aceptar para poder empezar de nuevo?"
  },
  "Sota de Espadas":{
    normal:"Curiosidad intelectual, nuevas ideas, comunicación. La mente despierta busca conocimiento y verdad.",
    sombra:"Crítica destructiva. Usar la inteligencia para atacar o desmerecer. La sabiduría sin corazón es vacía.",
    ayuda:"Tu curiosidad te abre puertas. Pregunta, indaga, aprende. El conocimiento es poder cuando se comparte.",
    invertida:"Comunicación bloqueada o ideas confusas. No logras expresar lo que piensas. Falta de claridad mental.",
    pregunta:"¿Qué idea nueva está llamando mi atención que merece ser explorada?"
  },
  "Caballo de Espadas":{
    normal:"Acción mental rápida, determinación, impulso intelectual. Actúas con la mente clara y la decisión firme.",
    sombra:"Impulsividad en palabras o acciones. Hablar o actuar sin pensar. La precipitación que hiere o destruye.",
    ayuda:"Tu rapidez mental es un arma poderosa. Úsala con precisión, no con prisa. La claridad no necesita apresurarse.",
    invertida:"Frustración o bloqueo mental. Quieres avanzar pero algo frena tu ímpetu. Revisa antes de forzar.",
    pregunta:"¿Estoy actuando con claridad o con impulsividad?"
  },
  "Reina de Espadas":{
    normal:"Percepción clara, comunicación honesta, independencia. Ves más allá de las apariencias. Tu palabra es certera.",
    sombra:"Frialdad o dureza excesiva. La honestidad sin tacto que aisla. La claridad que hiere por falta de calidez.",
    ayuda:"Tu capacidad de ver con claridad es valiosa. Di la verdad con firmeza, pero también con compasión.",
    invertida:"Comunicación hiriente o bloqueada. Te quedas callada o hablas sin filtro. Recupera tu equilibrio.",
    pregunta:"¿Estoy usando mi claridad para construir o para destruir?"
  },
  "Rey de Espadas":{
    normal:"Autoridad mental, integridad intelectual, justicia clara. Tu criterio es sólido y tu palabra tiene peso.",
    sombra:"Dogmatismo o arrogancia intelectual. Creerte en posesión de la verdad absoluta. El intelecto que no escucha.",
    ayuda:"Tu mente lúcida es un faro para otros. Comparte tu sabiduría sin imponerla. El verdadero saber es humilde.",
    invertida:"Abuso de autoridad intelectual o pensamiento confuso. Tu criterio falla. Necesitas revisar tus convicciones.",
    pregunta:"¿Dónde estoy dando mi opinión como verdad absoluta sin considerar otras perspectivas?"
  },

  /* ============================= OROS ============================= */

  "As de Oros":{
    normal:"Nuevo comienzo material, oportunidad próspera. Una semilla de abundancia se presenta. El potencial es real.",
    sombra:"Avaricia o materialismo. Reducir la prosperidad solo a lo económico. La oportunidad que esclaviza.",
    ayuda:"Recibe esta oportunidad con gratitud. La abundancia es más que dinero: es bienestar, salud, plenitud.",
    invertida:"Oportunidad perdida o falta de recursos. La puerta no se abre aún. Quizás toca preparar el terreno.",
    pregunta:"¿Qué nueva fuente de abundancia está llamando a mi puerta?"
  },
  "Dos de Oros":{
    normal:"Adaptabilidad, equilibrio, prioridades. Gestionas múltiples áreas con destreza. Todo se sostiene en movimiento.",
    sombra:"Malabarismo crónico. Hacer demasiadas cosas sin profundizar en ninguna. El agobio como forma de vida.",
    ayuda:"Tu capacidad de gestionar múltiples frentes es admirable. Pero no todo necesita tu atención simultánea.",
    invertida:"Desequilibrio financiero o energético. Pierdes el control de las prioridades. Necesitas simplificar.",
    pregunta:"¿Qué puedo soltar hoy para dejar de hacer malabares innecesarios?"
  },
  "Tres de Oros":{
    normal:"Colaboración, aprendizaje, maestría. El trabajo en equipo produce resultados superiores. Juntos crean más.",
    sombra:"Perfeccionismo que aísla. No confiar en el equipo y querer hacerlo todo solo. La excelencia sin colaboración.",
    ayuda:"Aprende de quienes saben más que tú. La colaboración multiplica tu capacidad. El buen artesano se rodea de maestros.",
    invertida:"Falta de trabajo en equipo o estándares bajos. El grupo no funciona. Descoordinación o falta de compromiso.",
    pregunta:"¿Dónde necesito pedir ayuda o colaboración para lograr un mejor resultado?"
  },
  "Cuatro de Oros":{
    normal:"Seguridad, conservación, estabilidad. Proteges lo que has construido con cuidado. La base es sólida.",
    sombra:"Avaricia o miedo a perder. Acumular sin compartir. La seguridad como cárcel que impide crecer.",
    ayuda:"Está bien proteger lo tuyo, pero no te aísles en tu fortaleza. La seguridad no es estática, fluye.",
    invertida:"Derroche o pérdida de control. Lo que retenías se escapa. Necesitas revisar tu relación con la seguridad.",
    pregunta:"¿Qué estoy reteniendo por miedo a perder que, paradójicamente, me impide crecer?"
  },
  "Cinco de Oros":{
    normal:"Escasez, dificultad, exclusión. Hay carencia o sensación de falta. Tiempo de resistencia y aprendizaje.",
    sombra:"Mentalidad de pobreza. Verte como víctima de la escasez. La carencia como identidad.",
    ayuda:"La escasez es pasajera. Hay recursos disponibles incluso cuando no los ves. Pide ayuda.",
    invertida:"Recuperación tras la dificultad. La escasez termina. Encuentras recursos que creías perdidos.",
    pregunta:"¿Qué recursos tengo disponibles que no estoy viendo por enfocarme en lo que falta?"
  },
  "Seis de Oros":{
    normal:"Generosidad, intercambio, equilibrio. Dar y recibir en armonía. Lo que compartes regresa multiplicado.",
    sombra:"Dar desde la culpa o el control. Generosidad condicionada o con expectativas. El dar que ata.",
    ayuda:"Dar sin ataduras y recibir sin culpa. El flujo de la abundancia es circular. Todos dan y todos reciben.",
    invertida:"Desequilibrio en el dar y recibir. Das más de lo que recibes o viceversa. Restaura el balance.",
    pregunta:"¿Estoy dando desde la generosidad genuina o desde la obligación?"
  },
  "Siete de Oros":{
    normal:"Evaluación, paciencia, cosecha. Revisas lo que has sembrado. El resultado está en proceso, aún no es tiempo.",
    sombra:"Impaciencia con el proceso. Querer recoger antes de tiempo. No saber esperar el ciclo natural de las cosas.",
    ayuda:"La cosecha llegará si has plantado bien. Mientras tanto, evalúa, cuida y ajusta. La paciencia es activa.",
    invertida:"Pérdida de la cosecha o inversión fallida. Lo que sembraste no dio fruto. Toca replantear o empezar de nuevo.",
    pregunta:"¿Estoy cosechando los frutos de lo que sembré o estoy esperando sin mantener el cuidado?"
  },
  "Ocho de Oros":{
    normal:"Dedicación, trabajo artesanal, maestría. Te enfocas en tu oficio con atención y esmero. La práctica perfecciona.",
    sombra:"Adicción al trabajo. Esconderte en la labor para no enfrentar otras áreas. El trabajo como evasión.",
    ayuda:"Tu dedicación al detalle te lleva al dominio. Perfecciona tu arte con amor y paciencia.",
    invertida:"Trabajo sin pasión o falta de estándar. Haces lo mínimo o sin dedicación. Necesitas reconectar con tu oficio.",
    pregunta:"¿Estoy trabajando con amor o solo cumpliendo?"
  },
  "Nueve de Oros":{
    normal:"Abundancia lograda, autosuficiencia, disfrute. Has construido tu bienestar. Disfruta de tu independencia.",
    sombra:"Aislamiento del éxito. Gozar sola de tu prosperidad. La abundancia que no se comparte se marchita.",
    ayuda:"Tu esfuerzo te ha dado frutos. Disfrútalos con gratitud y comparte tu abundancia sin miedo.",
    invertida:"Pérdida de la independencia o mala gestión. La prosperidad se ve comprometida. Revisa tus finanzas.",
    pregunta:"¿Qué bienestar he construido que merezco disfrutar sin culpa?"
  },
  "Diez de Oros":{
    normal:"Legado, tradición, riqueza perdurable. Lo construido trasciende tu tiempo. La abundancia que heredas y heredarás.",
    sombra:"Pesadez del legado. Cargar con las expectativas familiares o tradicionales. El deber como carga.",
    ayuda:"Tu legado está en construcción. Honra tu linaje construyendo tu propio camino. La tradición viva.",
    invertida:"Pérdida de la herencia o crisis familiar. El legado se rompe. Toca reconstruir desde nuevos cimientos.",
    pregunta:"¿Qué estoy construyendo que quedará cuando yo no esté?"
  },
  "Sota de Oros":{
    normal:"Ambición, aprendizaje práctico, nueva empresa. Una oportunidad de crecimiento material se presenta. Empieza concreto.",
    sombra:"Planificar sin ejecutar. Estudiar sin actuar. El aprendizaje como sustituto del hacer.",
    ayuda:"Tu ambición es sana. Aprende lo necesario y luego lánzate. El conocimiento sin acción no prospera.",
    invertida:"Falta de ambición o oportunidades perdidas. No ves la oportunidad o te falta motivación.",
    pregunta:"¿Qué habilidad nueva necesito desarrollar para dar el siguiente paso práctico?"
  },
  "Caballo de Oros":{
    normal:"Trabajo constante, responsabilidad, dirección firme. Avanzas con paso seguro y firme. La constancia vence.",
    sombra:"Rigidez o lentitud excesiva. Aferrarte a tu método cuando el cambio es necesario. La rutina como cárcel.",
    ayuda:"Tu constancia te llevará lejos. Sigue firme en tu dirección, pero permítete ajustar el rumbo si es necesario.",
    invertida:"Falta de dirección o pereza. No avanzas o lo haces sin convicción. Retoma las riendas.",
    pregunta:"¿Estoy avanzando con paso firme o estoy atrapado en la rutina?"
  },
  "Reina de Oros":{
    normal:"Prosperidad generosa, practicidad, cuidado material. Gestionas los recursos con sabiduría y generosidad.",
    sombra:"Materialismo o sobrecarga de responsabilidad. Cuidar tanto lo material que descuidas lo esencial.",
    ayuda:"Tu capacidad de crear abundancia es un don. Úsalo para sostener tu vida y la de los que amas.",
    invertida:"Descuido material o dependencia financiera. No estás gestionando bien tus recursos. Pide ayuda.",
    pregunta:"¿Dónde estoy priorizando lo material por encima de lo que realmente importa?"
  },
  "Rey de Oros":{
    normal:"Maestría material, éxito consolidado, liderazgo próspero. Has alcanzado la cima con integridad y esfuerzo.",
    sombra:"Conservadurismo excesivo. Aferrarte a lo conocido por miedo a arriesgar. El éxito que no se reinventa.",
    ayuda:"Tu éxito es fruto de tu disciplina. Disfrútalo con generosidad y sigue creciendo sin perder tu esencia.",
    invertida:"Mala gestión o pérdida de estatus. Tu imperio se resquebraja. Necesitas revisar tus cimientos.",
    pregunta:"¿Qué estoy haciendo con mi abundancia que trasciende mi propio beneficio?"
  }
};
