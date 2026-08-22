#Requires -Version 5.1
<#
.SYNOPSIS
    Project Harness para Distrito Wok Simon
.DESCRIPTION
    Automatiza tareas comunes del proyecto con identificador claro y descripciones.
.PARAMETER Command
    Comando a ejecutar: status, deploy, build, test, doctor, pdf, seed, clean, validate, reset, dashboard, help
.PARAMETER AutoDeploy
    Si se especifica, ejecuta deploy automaticamente despues de ciertos comandos
.EXAMPLE
    .\harness.ps1 status
    .\harness.ps1 deploy
    .\harness.ps1 build -AutoDeploy
    .\harness.ps1 doctor
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'deploy', 'build', 'test', 'doctor', 'pdf', 'seed', 'clean', 'validate', 'reset', 'dashboard', 'help')]
    [string]$Command = 'help',

    [Parameter()]
    [switch]$AutoDeploy
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectId = "dis_wok-distrito-wok-simon"
$ProjectName = "DIS_WOK - Restaurante Distrito Wok Simon"
$FirebaseProject = "distrito-wok-simon"

$script:ExitCode = 0

function Write-ProjectIdentifier {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor DarkCyan
    Write-Host "  DISTrito Wok Simon - Project Harness" -ForegroundColor Yellow
    Write-Host "  Proyecto: $ProjectName" -ForegroundColor White
    Write-Host "  Firebase: $FirebaseProject" -ForegroundColor White
    Write-Host "===============================================" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-CommandDescription {
    param([string]$Description)
    Write-Host ">>> $Description" -ForegroundColor Cyan
    Write-Host ""
}

function Write-CommandResult {
    param([string]$Message, [string]$Type = "Info")
    switch ($Type) {
        "Success" { Write-Host "[OK] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[!] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[X] $Message" -ForegroundColor Red }
        default   { Write-Host "[i] $Message" -ForegroundColor White }
    }
}

function Test-PortOpen {
    param([string]$HostName = 'localhost', [int]$Port = 3000, [int]$TimeoutMs = 1000)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if ($ok) { $client.EndConnect($async) }
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Show-Status {
    Write-ProjectIdentifier
    Write-CommandDescription "Muestra el estado actual del proyecto (Git, Build, Firebase)"

    Write-Host "--- Git ---" -ForegroundColor Yellow
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($branch) {
        Write-Host "  Rama: $branch" -ForegroundColor White
    }
    $gitStatus = git status --short 2>$null
    if ($gitStatus) {
        Write-CommandResult "$($gitStatus.Count) archivos con cambios sin commit" "Warning"
        $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-CommandResult "Working tree limpio - no hay cambios pendientes" "Success"
    }
    $syncLine = git status -sb 2>$null | Select-Object -First 1
    if ($syncLine -match '\[(.*)\]') {
        Write-Host "  Sincronizacion con remoto: $($matches[1])" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "--- Ultimo Commit ---" -ForegroundColor Yellow
    $lastCommit = git log --oneline -1 2>$null
    if ($lastCommit) {
        Write-Host "  $lastCommit" -ForegroundColor White
    } else {
        Write-CommandResult "No hay commits en el repositorio" "Warning"
    }

    Write-Host ""
    Write-Host "--- Herramientas ---" -ForegroundColor Yellow
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    $firebaseVersion = firebase --version 2>$null
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor White
    Write-Host "  npm: $npmVersion" -ForegroundColor White
    if ($firebaseVersion) {
        Write-Host "  Firebase CLI: $firebaseVersion" -ForegroundColor White
    } else {
        Write-CommandResult "Firebase CLI no encontrado (npm install -g firebase-tools)" "Warning"
    }

    Write-Host ""
    Write-Host "--- Estado del Build ---" -ForegroundColor Yellow
    if (Test-Path "$ProjectRoot\build\index.html") {
        $buildDate = (Get-Item "$ProjectRoot\build\index.html").LastWriteTime
        Write-CommandResult "Build existe (ultima modificacion: $($buildDate.ToString('yyyy-MM-dd HH:mm')))" "Success"
    } else {
        Write-CommandResult "No hay build - ejecuta 'build' o 'deploy' para crearlo" "Warning"
    }

    Write-Host ""
    Write-Host "--- Dev Server ---" -ForegroundColor Yellow
    if (Test-PortOpen -HostName 'localhost' -Port 3000) {
        Write-CommandResult "Servidor de desarrollo activo en http://localhost:3000" "Success"
    } else {
        Write-CommandResult "Sin servidor de desarrollo activo (npm start para iniciarlo)" "Warning"
    }

    Write-Host ""
    Write-Host "--- Firebase ---" -ForegroundColor Yellow
    if (Test-Path "$ProjectRoot\.firebaserc") {
        $firebaseConfig = Get-Content "$ProjectRoot\.firebaserc" | ConvertFrom-Json
        Write-CommandResult "Proyecto Firebase: $($firebaseConfig.projects.default)" "Success"
        Write-Host "  URL: https://$FirebaseProject.web.app" -ForegroundColor Cyan
    } else {
        Write-CommandResult "Firebase no configurado" "Error"
    }

    Write-Host ""
}

function Build-Project {
    Write-ProjectIdentifier
    Write-CommandDescription "Solo construye el proyecto sin desplegar"

    Push-Location $ProjectRoot
    try {
        Write-Host "Ejecutando build de produccion..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Build completado exitosamente" "Success"
            return $true
        }
        Write-CommandResult "Build fallo - revisa los errores arriba" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Deploy-Project {
    Write-ProjectIdentifier
    Write-CommandDescription "Construye y despliega el proyecto a Firebase Hosting"

    Push-Location $ProjectRoot
    try {
        Write-Host "Paso 1/2: Ejecutando build..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-CommandResult "Build fallo - despliegue cancelado" "Error"
            return $false
        }

        Write-Host ""
        Write-Host "Paso 2/2: Desplegando a Firebase Hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Despliegue completado exitosamente" "Success"
            Write-Host ""
            Write-Host "Tu sitio esta disponible en:" -ForegroundColor Cyan
            Write-Host "  https://$FirebaseProject.web.app" -ForegroundColor Green
            return $true
        }
        Write-CommandResult "Despliegue fallo - revisa los errores arriba" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Run-Tests {
    Write-ProjectIdentifier
    Write-CommandDescription "Ejecuta la suite de tests (modo CI, sin watch)"

    Push-Location $ProjectRoot
    try {
        Write-Host "Ejecutando npm test (CI)..." -ForegroundColor Yellow
        $env:CI = "true"
        npm test -- --watchAll=false
        $exit = $LASTEXITCODE
        Remove-Item Env:CI -ErrorAction SilentlyContinue
        if ($exit -eq 0) {
            Write-CommandResult "Tests pasaron exitosamente" "Success"
            return $true
        }
        Write-CommandResult "Tests fallaron - revisa los errores arriba" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Run-Doctor {
    Write-ProjectIdentifier
    Write-CommandDescription "Verifica problemas conocidos del proyecto"

    $issues = 0

    Write-Host "--- Bugs Conocidos (AGENTS.md) ---" -ForegroundColor Yellow

    $firebaseExports = Get-Content "$ProjectRoot\src\services\firebase.js" -Raw -ErrorAction SilentlyContinue
    $pushImport = Get-Content "$ProjectRoot\src\services\pushNotification.js" -Raw -ErrorAction SilentlyContinue
    if ($pushImport -match 'import\s*\{[^}]*messaging[^}]*\}\s*from\s*[\x27\x22]\./firebase[\x27\x22]' -and $firebaseExports -notmatch "messaging") {
        Write-CommandResult "pushNotification.js importa 'messaging' pero firebase.js no lo exporta" "Error"
        $issues++
    } else {
        Write-CommandResult "pushNotification.js / firebase.js" "Success"
    }

    $useRolesContent = Get-Content "$ProjectRoot\src\hooks\useRoles.js" -Raw -ErrorAction SilentlyContinue
    $rolesManagerContent = Get-Content "$ProjectRoot\src\components\admin\RolesManager.js" -Raw -ErrorAction SilentlyContinue
    if ($useRolesContent -match "return true;" -and $rolesManagerContent -match "result\.success") {
        Write-CommandResult "useRoles.js retorna boolean pero RolesManager.js accede a .success" "Error"
        $issues++
    } else {
        Write-CommandResult "useRoles.js / RolesManager.js" "Success"
    }

    $createUsersContent = Get-Content "$ProjectRoot\scripts\create-users.js" -Raw -ErrorAction SilentlyContinue
    if ($createUsersContent -match "role:" -and $createUsersContent -notmatch "roles:") {
        Write-CommandResult "create-users.js usa campo 'role' (string) en vez de 'roles' (array)" "Error"
        $issues++
    } else {
        Write-CommandResult "create-users.js usa roles como array" "Success"
    }

    $migrateMenuContent = Get-Content "$ProjectRoot\scripts\migrate-menu.js" -Raw -ErrorAction SilentlyContinue
    if ($migrateMenuContent -match 'collection\(db,\s*[\x27\x22]menu[\x27\x22]\)') {
        Write-CommandResult "migrate-menu.js esta obsoleto (coleccion unica 'menu', usar arroces/corrientes/porciones/bebidas)" "Error"
        $issues++
    } else {
        Write-CommandResult "migrate-menu.js" "Success"
    }

    Write-Host ""
    Write-Host "--- Code Smells ---" -ForegroundColor Yellow
    $consoleLogs = Get-ChildItem -Path "$ProjectRoot\src" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue | Select-String -Pattern "console\.(log|warn)" -ErrorAction SilentlyContinue
    if ($consoleLogs) {
        Write-CommandResult "Se encontraron $($consoleLogs.Count) console.log/warn en src/ (revisar antes de deploy)" "Warning"
        $consoleLogs | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" -ForegroundColor Gray }
    } else {
        Write-CommandResult "Sin console.log en src/" "Success"
    }

    Write-Host ""
    if ($issues -gt 0) {
        Write-CommandResult "Doctor encontro $issues problema(s) conocido(s)" "Error"
        return $false
    }
    Write-CommandResult "Doctor completo - sin problemas conocidos" "Success"
    return $true
}

function Generate-Pdf {
    Write-ProjectIdentifier
    Write-CommandDescription "Regenera el menu PDF desde Firestore"

    Push-Location $ProjectRoot
    try {
        Write-Host "Ejecutando scripts/generate-pdf-from-firestore.js..." -ForegroundColor Yellow
        node scripts/generate-pdf-from-firestore.js
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "PDF generado exitosamente" "Success"
            return $true
        }
        Write-CommandResult "Fallo al generar el PDF" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Run-Seed {
    Write-ProjectIdentifier
    Write-CommandDescription "Inicializa roles y datos base en Firestore"

    Push-Location $ProjectRoot
    try {
        Write-Host "Ejecutando scripts/init-roles.js..." -ForegroundColor Yellow
        node scripts/init-roles.js
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Seed completado exitosamente" "Success"
            return $true
        }
        Write-CommandResult "Seed fallo" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Clean-Build {
    Write-ProjectIdentifier
    Write-CommandDescription "Elimina archivos de build y cache temporales"

    $cleaned = 0

    if (Test-Path "$ProjectRoot\build") {
        Remove-Item -Recurse -Force "$ProjectRoot\build"
        Write-CommandResult "Carpeta build/ eliminada" "Success"
        $cleaned++
    } else {
        Write-CommandResult "Carpeta build/ no existe" "Warning"
    }

    if (Test-Path "$ProjectRoot\node_modules\.cache") {
        Remove-Item -Recurse -Force "$ProjectRoot\node_modules\.cache"
        Write-CommandResult "Cache de npm eliminada" "Success"
        $cleaned++
    } else {
        Write-CommandResult "Cache de npm no existe" "Warning"
    }

    if ($cleaned -eq 0) {
        Write-CommandResult "No hay archivos para limpiar" "Warning"
    } else {
        Write-Host ""
        Write-CommandResult "Limpieza completada - $cleaned items eliminados" "Success"
    }

    Write-Host ""
}

function Validate-Structure {
    Write-ProjectIdentifier
    Write-CommandDescription "Verifica que todos los archivos requeridos existan"

    $requiredFiles = @(
        "package.json",
        "firebase.json",
        ".firebaserc",
        "src\App.js",
        "src\index.js",
        "src\config\firebase.js",
        "AGENTS.md",
        "README.md"
    )

    $requiredDirs = @(
        "src\components",
        "src\pages",
        "src\services",
        "src\hooks",
        "docs",
        "public",
        "build"
    )

    $missingFiles = 0
    $missingDirs = 0

    Write-Host "--- Archivos Requeridos ---" -ForegroundColor Yellow
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $ProjectRoot $file
        if (Test-Path $filePath) {
            Write-CommandResult "$file" "Success"
        } else {
            Write-CommandResult "$file - FALTANTE" "Error"
            $missingFiles++
        }
    }

    Write-Host ""
    Write-Host "--- Carpetas Requeridas ---" -ForegroundColor Yellow
    foreach ($dir in $requiredDirs) {
        $dirPath = Join-Path $ProjectRoot $dir
        if (Test-Path $dirPath) {
            Write-CommandResult "$dir/" "Success"
        } else {
            Write-CommandResult "$dir/ - FALTANTE" "Error"
            $missingDirs++
        }
    }

    Write-Host ""
    if ($missingFiles -eq 0 -and $missingDirs -eq 0) {
        Write-CommandResult "Validacion de estructura exitosa" "Success"
        return $true
    }
    Write-CommandResult "Validacion de estructura fallida - $missingFiles archivos y $missingDirs carpetas faltantes" "Error"
    return $false
}

function Validate-Firestore {
    Write-Host ""
    Write-Host "--- Datos en Firestore ---" -ForegroundColor Yellow

    Push-Location $ProjectRoot
    try {
        Write-Host "Ejecutando scripts/validate-firestore.js..." -ForegroundColor Cyan
        Write-Host ""
        node scripts/validate-firestore.js
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Validacion de Firestore exitosa" "Success"
            return $true
        }
        Write-CommandResult "Validacion de Firestore encontro problemas" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Reset-Project {
    Write-ProjectIdentifier
    Write-CommandDescription "Limpia todo, reinstala dependencias y reconstruye"

    Push-Location $ProjectRoot
    try {
        Write-Host "Paso 1/3: Limpiando archivos de build..." -ForegroundColor Yellow
        Clean-Build

        Write-Host ""
        Write-Host "Paso 2/3: Reinstalando dependencias..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-CommandResult "npm install fallo" "Error"
            return $false
        }

        Write-Host ""
        Write-Host "Paso 3/3: Construyendo proyecto..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Reset completado exitosamente" "Success"
            return $true
        }
        Write-CommandResult "Build fallo durante el reset" "Error"
        return $false
    }
    finally {
        Pop-Location
    }
}

function Show-Dashboard {
    Write-ProjectIdentifier
    Write-CommandDescription "Muestra resumen completo del proyecto"

    $packageJson = Get-Content "$ProjectRoot\package.json" | ConvertFrom-Json

    Write-Host "--- Informacion del Proyecto ---" -ForegroundColor Yellow
    Write-Host "  Nombre: $($packageJson.name)" -ForegroundColor White
    Write-Host "  Version: $($packageJson.version)" -ForegroundColor White
    Write-Host "  Descripcion: $($packageJson.description)" -ForegroundColor White

    Write-Host ""
    Write-Host "--- Estadisticas del Codigo ---" -ForegroundColor Yellow
    $componentCount = (Get-ChildItem -Path "$ProjectRoot\src\components" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue).Count
    $pageCount = (Get-ChildItem -Path "$ProjectRoot\src\pages" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue).Count
    $serviceCount = (Get-ChildItem -Path "$ProjectRoot\src\services" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue).Count
    $hookCount = (Get-ChildItem -Path "$ProjectRoot\src\hooks" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue).Count
    $scriptCount = (Get-ChildItem -Path "$ProjectRoot\scripts" -Filter "*.js" -ErrorAction SilentlyContinue).Count

    Write-Host "  Componentes: $componentCount" -ForegroundColor Cyan
    Write-Host "  Paginas: $pageCount" -ForegroundColor Cyan
    Write-Host "  Servicios: $serviceCount" -ForegroundColor Cyan
    Write-Host "  Hooks: $hookCount" -ForegroundColor Cyan
    Write-Host "  Scripts: $scriptCount" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "--- Enlaces Utiles ---" -ForegroundColor Yellow
    Write-Host "  Sitio: https://$FirebaseProject.web.app" -ForegroundColor Cyan
    Write-Host "  Console: https://console.firebase.google.com/project/$FirebaseProject" -ForegroundColor Cyan
    Write-Host "  Repo: https://github.com/JA10S/Distrito-Wok-Simon" -ForegroundColor Cyan

    Write-Host ""
}

function Show-Help {
    Write-ProjectIdentifier
    Write-Host "Uso: .\harness.ps1 [comando] [-AutoDeploy]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "COMANDOS DISPONIBLES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  status      Muestra el estado actual del proyecto (Git, Herramientas, Build, Firebase)" -ForegroundColor Green
    Write-Host "  deploy      Construye y despliega el proyecto a Firebase Hosting" -ForegroundColor Green
    Write-Host "  build       Solo construye el proyecto sin desplegar" -ForegroundColor Green
    Write-Host "  test        Ejecuta la suite de tests en modo CI" -ForegroundColor Green
    Write-Host "  doctor      Verifica problemas conocidos del proyecto" -ForegroundColor Green
    Write-Host "  pdf         Regenera el menu PDF desde Firestore" -ForegroundColor Green
    Write-Host "  seed        Inicializa roles y datos base en Firestore" -ForegroundColor Green
    Write-Host "  clean       Elimina archivos de build y cache temporales" -ForegroundColor Green
    Write-Host "  validate    Verifica estructura de archivos y datos en Firestore" -ForegroundColor Green
    Write-Host "  reset       Limpia todo, reinstala dependencias y reconstruye" -ForegroundColor Green
    Write-Host "  dashboard   Muestra resumen completo del proyecto" -ForegroundColor Green
    Write-Host "  help        Muestra esta ayuda" -ForegroundColor Green
    Write-Host ""
    Write-Host "OPCIONES:" -ForegroundColor Cyan
    Write-Host "  -AutoDeploy Despues de 'build', ejecuta deploy automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EJEMPLOS:" -ForegroundColor Cyan
    Write-Host "  .\harness.ps1 status              # Ver estado del proyecto" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 deploy              # Build y deploy" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 build -AutoDeploy   # Build seguido de deploy" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 test                # Ejecutar tests en CI" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 doctor              # Verificar bugs conocidos" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 pdf                 # Regenerar PDF del menu" -ForegroundColor Gray
    Write-Host "  .\harness.ps1 validate            # Validar estructura y Firestore" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
$success = $true
switch ($Command) {
    'status'    { Show-Status }
    'deploy'    { $success = Deploy-Project }
    'build'     {
        $success = Build-Project
        if ($success -and $AutoDeploy) {
            Write-Host ">>> AutoDeploy activado - ejecutando deploy..." -ForegroundColor Magenta
            Write-Host ""
            $success = Deploy-Project
        }
    }
    'test'      { $success = Run-Tests }
    'doctor'    { $success = Run-Doctor }
    'pdf'       { $success = Generate-Pdf }
    'seed'      { $success = Run-Seed }
    'clean'     { Clean-Build }
    'validate'  {
        $structureOk = Validate-Structure
        $firestoreOk = Validate-Firestore
        $success = ($structureOk -and $firestoreOk)
    }
    'reset'     { $success = Reset-Project }
    'dashboard' { Show-Dashboard }
    'help'      { Show-Help }
}

if (-not $success) {
    $script:ExitCode = 1
}

exit $script:ExitCode
