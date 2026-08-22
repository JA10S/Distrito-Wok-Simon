# Contribuyendo a Distrito Wok Simón

Gracias por contribuir. Estas son las reglas para mantener el historial limpio y los PRs revisables.

## Cuenta y acceso

- **REGLA:** Todos los cambios de este proyecto se guardan en la cuenta **JA10S**.
  - Identidad git local (configurada en el repo): `JA10S <55547937+JA10S@users.noreply.github.com>`.
  - El push debe autenticarse con la cuenta **JA10S** (`gh auth switch`).
- El repositorio `JA10S/Distrito-Wok-Simon` requiere permiso de escritura para pushear.
- Verifica la cuenta activa con `gh auth status`; si está en `jadies2024` (solo lectura), cambia con `gh auth switch` a JA10S antes de pushear.
- Si la cuenta activa tiene solo lectura, usa el flujo fork + PR (`gh repo fork`).
- El agente `repo-manager` auto-detecta el permiso, verifica la identidad git y elige el flujo correcto.

## Ramas

Usa nombres con prefijo de tipo y slug corto en español o ingles:

```
fix/arroz-currambero-precio
feat/pagos-bold
docs/reglas-menu
refactor/hooks-roles
```

## Commits

Formato Conventional Commits con descripción en espanol (estilo del repositorio):

```
<type>: <descripcion corta en español>
```

Tipos válidos: `feat`, `fix`, `docs`, `config`, `refactor`, `test`, `chore`.

Ejemplos validos:
```
fix: Actualizar precio Arroz Currambero a 37K/50K
feat: Integrar pagos Bold en CashierDashboard
docs: Documentar regla de actualización dual de menús
```

Reglas:
- Titulo en imperativo o descriptivo, sin punto final.
- No dejar `console.log` en produccion (verificar con `.\tools\harness.ps1 doctor`).
- No commitear secretos ni credenciales.

## Antes de abrir un PR

```powershell
.\tools\harness.ps1 test      # tests pasan
.\tools\harness.ps1 doctor    # sin bugs conocidos
.\tools\harness.ps1 validate  # estructura + Firestore OK
npm run build                 # compila
```

## PRs

- Titulo siguiendo el mismo formato Conventional Commits.
- Rellenar el template en `.github/PULL_REQUEST_TEMPLATE.md`.
- Enfocar el PR a un solo cambio (PR pequenos y revisables).
- Esperar revision antes de mergear.

## Branch protection en main

La configuracion de proteccion de ramas la administra el owner del repositorio.
Se recomienda: PR requerido, sin push directo a `main`, y checks de `test` + `build`.
