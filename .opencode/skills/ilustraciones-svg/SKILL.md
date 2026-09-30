---
name: ilustraciones-svg
description: Use cuando se deban crear o modificar ilustraciones SVG animadas o animaciones CSS del proyecto (ChefAnimation.js, Logo.js, keyframes de App.css, animación del login, faroles, llamas, chispas, estilo visual). Explica convenciones de colores del tema, transform-box en SVG, prefers-reduced-motion y pasos de verificación.
---

# Ilustraciones SVG animadas - Distrito Wok

## Cuándo usarla
- Crear/editar ilustraciones SVG animadas (`src/components/common/ChefAnimation.js`, `Logo.js`).
- Agregar o modificar keyframes de animación en `src/App.css`.
- Tareas de "animación", "ilustración", "silueta", "chef", "logo", "efectos visuales" en login/menú/dashboards.

## Arquitectura de la ilustración
- Componente en `src/components/common/`, PascalCase, props: `size` (ancho px) y `className`.
- SVG con `viewBox`, `role="img"` + `aria-label` en español.
- El componente NO lleva estilos inline de tema: las clases (`chef-sil`, `chef-arm`, `chef-flame-*`, `chef-spark`, `chef-food*`) se definen en `src/App.css` bajo el bloque "Ilustración animada".
- Colores SIEMPRE por variables del tema: `rgb(var(--color-dorado))`, `--color-rojo`, `--color-negro`, etc. (definidas en `tailwind.config.js` + `:root` de App.css). Excepción: acentos decorativos puntuales (verduras `#7ec96f`, `#ffa04d`).
- Estilo: silueta negra `#050505` con contorno dorado (línea de luz) — clase `.chef-sil`; miembros (brazos/piernas) con doble trazo: `.chef-limb-edge` (dorado, ancho+6) + `.chef-limb-core` (negro, ancho) usando el subcomponente `Limb`.

## Reglas duras de animación SVG
1. **Nunca** poner atributo `transform` en un elemento que tenga animación CSS (la animación lo pisa): envolver en `<g transform="...">` y animar el hijo.
2. Todo elemento animado con CSS necesita `transform-box: fill-box` + `transform-origin` explícito.
3. Traslaciones por elemento con custom property: `style={{ '--dx': '-30px', animationDuration, animationDelay }}` y `translate(var(--dx), -150px)` en el keyframe.
4. Respetar siempre `@media (prefers-reduced-motion: reduce)` listando las clases animadas con `animation: none`.
5. Iconos: `react-icons` (verificar que el icono exista; NO existen `GiFriedNoodles` ni `GiChickenDrumstick`).

## Verificación obligatoria antes de commitear
```powershell
$env:CI='true'; npx react-scripts test --watchAll=false
npm run build
```
Luego AGENTS.md, commit en español (Conventional Commits), push con cuenta JA10S, `firebase deploy --only hosting`.

## Archivos de referencia
- `src/components/common/ChefAnimation.js` — ilustración principal (chef + wok + fuego).
- `src/App.css` — bloque "Ilustración animada: chef con wok (login)".
- `tailwind.config.js` / `:root` de App.css — variables de color y fuentes.
- `AGENTS.md` (sección Diseño) y `docs/PROJECT_STRUCTURE.md`.
