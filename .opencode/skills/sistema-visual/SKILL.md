---
name: sistema-visual
description: Use cuando se deba agregar, mover o reorganizar estilos CSS/Tailwind del proyecto (src/styles/, App.css, tailwind.config.js, variables --color-*, clases globales como btn-gold/hover-lift, tokens del tema, CustomCss, ThemeManager, clases nuevas en componentes). Explica en qué archivo de src/styles/ va cada regla, el orden de cascada, convenciones de nombres y la cadena completa para agregar un token de tema. NO usar para ilustraciones SVG (ver ilustraciones-svg) ni para animaciones aisladas.
---

# Sistema visual - Distrito Wok

Referencia canónica para **organizar** el diseño del proyecto. Cualquier tarea que toque CSS, clases Tailwind o tokens debe seguir estas reglas.

## 1. Estructura de estilos (fuente de verdad)

```
src/App.css          → SOLO un índice: 7 @import en orden. NO editar, NO reordenar.
src/styles/
├── 00-tailwind.css        # @tailwind base/components/utilities (SIEMPRE primero)
├── 01-tokens.css          # :root (--color-*, --dk-*, --font-*, --gold-*), [data-radius] .rounded*, .surface-dark
├── 02-base.css            # body, scrollbar, .btn-primary/secondary/danger, .card, .input, .table-*, .notes-box (usan @apply)
├── 03-light-overrides.css # :root[data-mode='light'] .text-* (legibilidad en modo diurno)
├── 04-utilities.css       # .hover-lift, .glass, .glow, .text-gold-gradient, .pattern-bg, .no-scrollbar, .quick-card, .tab-active, .animate-*
├── 05-login.css           # .btn-gold, .login-input*, .login-brand*, .login-form, .login-chef*
└── 06-chef-animation.css  # .chef-animation + keyframes (ilustración SVG)
```

**Lección dura**: el bundler de CRA eleva los `@import` al inicio del CSS compilado. Las directivas `@tailwind` viven en `00-tailwind.css` importado **primero**; si se mueven a otro archivo (o a App.css) las utilidades Tailwind quedan después de los tokens y **pisan los overrides** (p. ej. la escala de radios `.rounded*`).

## 2. ¿Dónde va una regla nueva? (árbol de decisión)

1. **¿Se puede con clases Tailwind existentes en el JSX?** → usar Tailwind y no crear CSS global (estilo mayoritario del proyecto).
2. **¿Es un efecto reutilizable en ≥2 componentes?** → `04-utilities.css` con nombre descriptivo (kebab-case).
3. **¿Es un token de color/fuente/espaciado del tema?** → ver §4 (cadena completa del token) → `01-tokens.css` + `tailwind.config.js` + `themeUtils.js`.
4. **¿Es un componente genérico base (form, card, table, botón de acción)?** → `02-base.css`.
5. **¿Solo aplica al login?** → `05-login.css`.
6. **¿Animación/keyframes de la ilustración del chef?** → `06-chef-animation.css` (además cargar skill `ilustraciones-svg`).
7. **¿Es un override para modo diurno?** → `03-light-overrides.css` (no meter `if` en otro archivo).
8. **¿One-off de una sola página/componente?** → Tailwind inline en el componente; **evitar** nuevas clases globales.

Nunca: editar el cuerpo de `App.css`, reordenar sus imports, crear un segundo archivo CSS de proyecto fuera de `src/styles/`, ni usar `Set-Content`/`Add-Content` de PowerShell para escribir archivos (corrompe UTF-8; usar tools edit/write o Node).

## 3. Convenciones de nombres y clases

| Patrón | Ejemplos | Uso |
|---|---|---|
| `.btn-<variante>` | `.btn-primary` (dorado), `.btn-info` (azul), `.btn-success` (verde), `.btn-danger` (rojo), `.btn-carmesi` (cerrar sesión) | Botones de acción. La clase lleva **solo color + font-bold + rounded + transition**; el espaciado (`py-* px-*`), ancho (`w-full`) y tamaño de texto van en el JSX |
| `.scrim` | — | Fondo de modales/overlays (negro 70%). El posicionamiento (`fixed/absolute inset-0 z-*`) va en el JSX. Excepciones: velos del login (`bg-black/45`) y PageDesigner (`bg-black/50`) |
| `.section-title`, `.section-subtitle` | — | Títulos de sección/subsección en dashboards (serif + regla dorada `::after`); reemplazan `font-cormorant text-dorado mb-6/4` |
| `.panel` | — | Contenedor estándar de paneles/listas/tarjetas (`bg-surface-2 rounded-xl border-dorado-oscuro/25`); reemplaza esas 4 clases en JSX |
| `.price-pill` | — | Precio del menú público en píldora dorada |
| `.stat-chip` | — | Chip de icono en tarjetas de `SummaryStats` |
| `.hover-lift`, `.glow`, `.glass` | — | Efectos reutilizables |
| `.login-*` | `.login-input`, `.login-form` | Zona login |
| `.chef-*` | `.chef-arm`, `.chef-flame-1` | Ilustración SVG |
| `.tab-active`, `.quick-card`, `.notes-box` | — | Componentes específicos |
| `.animate-*` | `.animate-fade-in-up` | Animaciones |
| `.surface-dark` | — | Secciones fijas oscuras en modo diurno (marca del login, previews) |

- Tailwind en JSX: tokens del tema `bg-surface` / `bg-surface-2` / `bg-surface-3`, `text-ink` / `text-ink-muted`, `border-line`, `text-dorado` (+ `dorado-claro/oscuro`, `rojo/rojo-oscuro`). Opacidad siempre con modificador (`/20`).
- Colores crudos (`text-white`, `bg-gray-900`, hex) → prohibidos en superficies temables (rompen modo diurno); solo sobre botones de color semántico (rojo/verde) o scrim de modal.
- Fuentes: títulos `font-cormorant`, cuerpo `font-montserrat`, datos/UI dashboards `font-inter`.
- Iconos: `react-icons` (`Fa*`, `Gi*`, `Tb*`); verificar existencia antes de importar.
- Componentes compartidos a reutilizar: `DashboardHeader`, `SummaryStats`, `ModeToggle`, `Logo`, `SiteHeader`/`MenuDrawer`/`SiteFooter`.
- Accesibilidad: `aria-label`/`aria-hidden` en iconos; `prefers-reduced-motion` en toda animación; gating por permisos intacto.

## 4. Agregar un token de tema nuevo (cadena completa)

Si el admin debe poder customizarlo (colores/fuentes), la cadena es:

1. `src/utils/themeUtils.js`: agregar la clave a `COLOR_KEYS` (o familias de fuentes) + valor default en `PRESETS` (todas las paletas, `dark` **y** `light`).
2. `applyTheme`: ya escribe `--color-<kebab>` por cada COLOR_KEY (convertir camelCase→kebab, p. ej. `surfaceCard` → `--color-surface-card`); solo extender si el formato es especial.
3. `tailwind.config.js`: agregar utilidad mapeada `rgb(var(--color-<kebab>) / <alpha-value>)`.
4. `src/styles/01-tokens.css`: default en `:root` + herencia en `.surface-dark` + `--dk-*` si la zona usa paleta oscura fija.
5. `src/styles/03-light-overrides.css` si el token necesita ajuste en modo diurno.
6. `src/components/admin/ThemeManager.js`: grupo de edición en la pestaña Apariencia.
7. Tests: `themeUtils.test.js` (sanitize) + `ThemeManager.test.js` (campo visible).

Sin documento `settings/theme` en Firestore se usan los defaults; temas guardados antiguos rellenan campos faltantes vía `sanitizeTheme`.

## 5. CSS personalizado del admin (settings/custom_css)

- Editor en Admin → Apariencia → pestaña "🧩 CSS" (`CustomCssEditor`), hook `useCustomCss`, inyector `CustomCssInjector` (style#dw-custom-css, máx 10.000 caracteres).
- Es un **escape hatch** para el usuario final. El código del proyecto **no** debe depender de él ni meter reglas del sistema ahí.
- Si el usuario pide una mejora "con CSS personalizado" que en realidad es universal → implementarla en `src/styles/` y dejar el custom_css solo para ajustes puntuales suyos.

## 6. Verificación obligatoria

```powershell
$env:CI='true'; npx react-scripts test --watchAll=false   # o .\tools\harness.ps1 test
npm run build
```

Tras cambios visuales, avisar al usuario: recargar con `Ctrl+Shift+R` (o borrar caché de la PWA). Deploy/commit solo si se pide explícitamente (commit en español Conventional Commits sin acentos, cuenta JA10S).

## 7. Archivos de referencia

- `tailwind.config.js` — tokens Tailwind.
- `src/utils/themeUtils.js` — presets, COLOR_KEYS, MODES, LAYOUTS, RADII, applyTheme.
- `src/contexts/ThemeContext.js` — tiempo real de `settings/theme`.
- `src/components/admin/ThemeManager.js` — UI de Apariencia.
- Skills hermanas: `ilustraciones-svg` (chef/Logo/keyframes), no duplicar su contenido aquí.
- `AGENTS.md` (🎨 Diseño + lecciones) y `docs/PROJECT_STRUCTURE.md`.
