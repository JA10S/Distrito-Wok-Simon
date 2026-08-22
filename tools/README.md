# Project Harness - Distrito Wok Simon

Herramienta de automatizacion para el proyecto restaurante-distrito-wok.

## Uso Basico

```powershell
.\tools\harness.ps1 [comando] [-AutoDeploy]
```

Todos los comandos retornan un **exit code** (0 = exito, 1 = fallo), util para CI.

## Comandos Disponibles

### status
Muestra el estado actual del proyecto (Git, Herramientas, Build, Firebase).

```powershell
.\tools\harness.ps1 status
```

**Muestra:**
- Estado de Git (rama, cambios sin commit, sincronizacion con remoto)
- Ultimo commit del repositorio
- Versiones de Node.js, npm y Firebase CLI
- Estado del build (si existe, fecha de modificacion)
- Si el servidor de desarrollo esta activo en http://localhost:3000
- Configuracion de Firebase

### test
Ejecuta la suite de tests en modo CI (sin watch).

```powershell
.\tools\harness.ps1 test
```

**Ejecuta:**
- `npm test -- --watchAll=false` con `CI=true`

### doctor
Verifica problemas conocidos del proyecto (bugs documentados en AGENTS.md).

```powershell
.\tools\harness.ps1 doctor
```

**Verifica:**
- Import de `messaging` inexistente en `pushNotification.js`
- `useRoles.js` retorna boolean pero `RolesManager.js` accede a `.success`
- `create-users.js` usa campo `role` (string) en vez de `roles` (array)
- `migrate-menu.js` obsoleto (coleccion unica `menu`)
- `console.log`/`warn` en `src/`

### pdf
Regenera el menu PDF desde Firestore.

```powershell
.\tools\harness.ps1 pdf
```

**Ejecuta:**
- `node scripts/generate-pdf-from-firestore.js`

### seed
Inicializa roles y datos base en Firestore.

```powershell
.\tools\harness.ps1 seed
```

**Ejecuta:**
- `node scripts/init-roles.js`

### deploy
Construye y despliega el proyecto a Firebase Hosting.

```powershell
.\tools\harness.ps1 deploy
```

**Ejecuta:**
1. Build del proyecto (`npm run build`)
2. Deploy a Firebase Hosting (`firebase deploy --only hosting`)

### build
Solo construye el proyecto sin desplegar.

```powershell
.\tools\harness.ps1 build
```

**Util para:**
- Verificar que el proyecto compila correctamente
- Generar archivos de produccion localmente

### clean
Elimina archivos de build y cache temporales.

```powershell
.\tools\harness.ps1 clean
```

**Elimina:**
- Carpeta `build/`
- Cache de npm en `node_modules/.cache`

### validate
Verifica que todos los archivos requeridos existan y valida los datos en Firestore.

```powershell
.\tools\harness.ps1 validate
```

**Valida:**
- Archivos de configuracion (package.json, firebase.json, etc.)
- Estructura de carpetas (components, pages, services, etc.)
- Archivos de documentacion
- Datos en Firestore (`node scripts/validate-firestore.js`):
  - Menus (arroces, corrientes, porciones, bebidas) con campos en ingles (`name`, `price`)
  - Roles con `permissions` como array
  - Usuarios con `roles` como array (no `role` string)

### reset
Limpia todo, reinstala dependencias y reconstruye.

```powershell
.\tools\harness.ps1 reset
```

**Ejecuta:**
1. Clean (elimina build y cache)
2. `npm install` (reinstala dependencias)
3. Build del proyecto

### dashboard
Muestra resumen completo del proyecto.

```powershell
.\tools\harness.ps1 dashboard
```

**Muestra:**
- Informacion del proyecto (nombre, version, descripcion)
- Estadisticas del codigo (componentes, paginas, servicios, hooks)
- Enlaces utiles (sitio, consola Firebase, repositorio)

### help
Muestra la ayuda con todos los comandos disponibles.

```powershell
.\tools\harness.ps1 help
```

## Opciones Adicionales

### -AutoDeploy
Se puede usar con el comando `build` para ejecutar deploy automaticamente despues de construir.

```powershell
.\tools\harness.ps1 build -AutoDeploy
```

Esto es util cuando quieres verificar que el build es correcto y luego desplegar inmediatamente.

## Ejemplos de Uso

### Ver estado del proyecto
```powershell
.\tools\harness.ps1 status
```

### Desplegar cambios
```powershell
.\tools\harness.ps1 deploy
```

### Limpiar y reconstruir
```powershell
.\tools\harness.ps1 reset
```

### Validar estructura antes de commits
```powershell
.\tools\harness.ps1 validate
```

### Ejecutar tests antes de deploy
```powershell
.\tools\harness.ps1 test
```

### Verificar bugs conocidos
```powershell
.\tools\harness.ps1 doctor
```

### Regenerar PDF del menu
```powershell
.\tools\harness.ps1 pdf
```

### Inicializar roles en Firestore
```powershell
.\tools\harness.ps1 seed
```

### Ver resumen completo
```powershell
.\tools\harness.ps1 dashboard
```

## Notas Importantes

- **PowerShell 5.1**: Este harness esta disenado para ser compatible con PowerShell 5.1
- **Firebase CLI**: Asegurate de tener Firebase CLI instalado (`npm install -g firebase-tools`)
- **Node.js**: Se requiere Node.js instalado para ejecutar npm commands
- **Directorio**: Ejecuta los comandos desde la raiz del proyecto o usa rutas relativas

## Solucion de Problemas

### "No se puede ejecutar el script"
Ejecuta esto una vez para permitir scripts:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Firebase no encontrado"
Instala Firebase CLI:
```powershell
npm install -g firebase-tools
firebase login
```

### "Build fallido"
Verifica que las dependencias esten instaladas:
```powershell
npm install
```
