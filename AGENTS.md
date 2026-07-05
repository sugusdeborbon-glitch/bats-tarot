# BATS Tarot — Contexto del proyecto

## Descripción
Business Ashram Tarot System - App de tarot PWA + Android APK.
Tiradas: Cruz Diaria, Relación, BATS Laboral, Personalizada.
78 cartas con significados BATS en español.

## Stack
- HTML5 + CSS3 + JS vanilla (sin frameworks)
- PWA: manifest.json + service-worker.js
- Android: Capacitor (proyecto en android/)
- Hosting: GitHub Pages

## Estructura
- `index.html` — entrada principal (HTML semántico)
- `style.css` — estilos con animaciones
- `app.js` — lógica de la app
- `datos_bats.js` — significados de las 78 cartas
- `manifest.json` — config PWA (start_url y scope relativos)
- `service-worker.js` — caché stale-while-revalidate
- `offline.html` — fallback sin conexión
- `version.json` — versión actual
- `bats-tarot.apk` — APK generado (~11 MB)
- `android/` — proyecto Android nativo (Capacitor)
- `www/` — assets para el APK
- `cartas/` — 78 imágenes JPG de cartas

## Repositorio
- GitHub: sugusdeborbon-glitch/bats-tarot
- URL: https://sugusdeborbon-glitch.github.io/bats-tarot/
- Rama principal: master
- Último tag: v1.0.0

## Comandos útiles
```bash
# Generar APK
cd android && ./gradlew assembleDebug

# Desplegar cambios
git add -A && git commit -m "mensaje" && git push

# Versionar
git tag -a v1.x.x -m "mensaje" && git push origin v1.x.x
```

## Próximas mejoras pendientes
- [ ] (pendiente de definir con el usuario)
