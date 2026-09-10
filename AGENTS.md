# BATS Tarot — Contexto del proyecto

## Descripción
Business Ashram Tarot System - App de tarot PWA + Android APK.
Tiradas: Cruz Diaria, Relación, BATS Laboral, Personalizada, El Aprendizaje, El Arcano Visitante.
78 cartas con significados BATS en español + sistema de Comodín con extensión.

## Stack
- HTML5 + CSS3 + JS vanilla (sin frameworks)
- PWA: manifest.json + service-worker.js
- Android: Capacitor 8.x (proyecto en android/)
- Hosting: GitHub Pages

## Versión actual
- **v1.10.0** (2026-09-10)
- APK: `bats-tarot.apk` (~15.7 MB debug)

## Estructura
- `index.html` — entrada principal (HTML semántico)
- `style.css` — estilos con animaciones
- `app.js` — lógica de la app (renderizado DOM, seguridad XSS blindada)
- `ai.js` — integración con proveedores IA (OpenAI, Groq, NVIDIA, etc.)
- `datos_bats.js` — significados de las 78 cartas
- `quintaesencia_bats.js` — textos de quintaesencia
- `manifest.json` — config PWA
- `service-worker.js` — caché stale-while-revalidate
- `offline.html` — fallback sin conexión
- `version.json` — versión y fecha actual
- `android/` — proyecto Android nativo (Capacitor)
- `www/` — assets sincronizados para el APK
- `cartas/` — 78 imágenes JPG de cartas

## Seguridad (Hito 1 completado)
- `innerHTML` eliminado de 21 funciones → DOM API (`createElement`/`textContent`/`appendChild`)
- `escHTML()` aplicado en todas las rutas de datos de usuario (descargas, historial, búsquedas)
- `insertAdjacentHTML`: eliminado completamente
-_botones onclick: refactorizados de strings inline a handlers funcionales
- `innerHTML` restante (4 usos): todos seguros (interpParaHTML con escHTML, helper _htmlToDom, novedades remoto)
- **Pendiente**: Content Security Policy (CSP) en index.html

## Repositorio
- GitHub: sugusdeborbon-glitch/bats-tarot
- URL: https://sugusdeborbon-glitch.github.io/bats-tarot/
- Rama principal: master
- Último tag: v1.0.0

## Comandos útiles
```bash
# Generar APK
cd android && ./gradlew.bat assembleDebug

# Sincronizar web → Android
npx cap sync

# Desplegar cambios
git add -A && git commit -m "mensaje" && git push

# Versionar
git tag -a v1.x.x -m "mensaje" && git push origin v1.x.x
```

## Próximas mejoras pendientes
- [ ] Implementar Content Security Policy (CSP) en index.html
- [ ] Rate-limit global/persistente para llamadas IA (hoy en memoria por instancia)
- [ ] Documentar flujo de clave IA por worker y TTS por Google
- [ ] Unificar documentación de prompts (PROMPTS.md vs PROMPTS_v1.1.md)
