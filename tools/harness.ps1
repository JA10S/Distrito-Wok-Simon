#Requires -Version 5.1
<#
.SYNOPSIS
    Project Harness para Distrito Wok Simon
.DESCRIPTION
    Automatiza tareas comunes del proyecto con identificador claro y descripciones.
.PARAMETER Command
    Comando a ejecutar: status, deploy, build, clean, validate, reset, dashboard, help
.PARAMETER AutoDeploy
    Si se especifica, ejecuta deploy automaticamente despues de ciertos comandos
.EXAMPLE
    .\harness.ps1 status
    .\harness.ps1 deploy
    .\harness.ps1 build -AutoDeploy
#>

param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'deploy', 'build', 'clean', 'validate', 'reset', 'dashboard', 'help')]
    [string]$Command = 'help',
    
    [Parameter()]
    [switch]$AutoDeploy
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectId = "dis_wok-distrito-wok-simon"
$ProjectName = "DIS_WOK - Restaurante Distrito Wok Simon"
$FirebaseProject = "distrito-wok-simon"

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

function Show-Status {
    Write-ProjectIdentifier
    Write-CommandDescription "Muestra el estado actual del proyecto (Git, Build, Firebase)"
    
    Write-Host "--- Estado de Git ---" -ForegroundColor Yellow
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-CommandResult "Hay cambios sin commit en el repositorio" "Warning"
        Write-Host ""
        git status --short 2>$null | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-CommandResult "Working tree limpio - no hay cambios pendientes" "Success"
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
    Write-Host "--- Estado del Build ---" -ForegroundColor Yellow
    if (Test-Path "$ProjectRoot\build\index.html") {
        $buildDate = (Get-Item "$ProjectRoot\build\index.html").LastWriteTime
        Write-CommandResult "Build existe (ultima modificacion: $($buildDate.ToString('yyyy-MM-dd HH:mm')))" "Success"
    } else {
        Write-CommandResult "No hay build - ejecuta 'build' o 'deploy' para crearlo" "Warning"
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
    
    Write-Host "Ejecutando build de produccion..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-CommandResult "Build completado exitosamente" "Success"
        } else {
            Write-CommandResult "Build falló - revisa los errores arriba" "Error"
            return $false
        }
    }
    finally {
        Pop-Location
    }
    return $true
}

function Deploy-Project {
    Write-ProjectIdentifier
    Write-CommandDescription "Construye y despliega el proyecto a Firebase Hosting"
    
    Write-Host "Paso 1/2: Ejecutando build..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-CommandResult "Build falló - despliegue cancelado" "Error"
        Pop-Location
        return
    }
    Pop-Location
    
    Write-Host ""
    Write-Host "Paso 2/2: Desplegando a Firebase Hosting..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    firebase deploy --only hosting
    if ($LASTEXITCODE -eq 0) {
        Write-CommandResult "Despliegue completado exitosamente" "Success"
        Write-Host ""
        Write-Host "Tu sitio esta disponible en:" -ForegroundColor Cyan
        Write-Host "  https://$FirebaseProject.web.app" -ForegroundColor Green
    } else {
        Write-CommandResult "Despliegue falló - revisa los errores arriba" "Error"
    }
    Pop-Location
    
    Write-Host ""
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
        Write-CommandResult "Validacion exitosa - todos los archivos requeridos existen" "Success"
    } else {
        Write-CommandResult "Validacion fallida - $missingFiles archivos y $missingDirs carpetas faltantes" "Error"
    }
    
    Write-Host ""
}

function Reset-Project {
    Write-ProjectIdentifier
    Write-CommandDescription "Limpia todo, reinstala dependencias y reconstruye"
    
    Write-Host "Paso 1/3: Limpiando archivos de build..." -ForegroundColor Yellow
    Clean-Build
    
    Write-Host "Paso 2/3: Reinstalando dependencias..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-CommandResult "npm install falló" "Error"
        Pop-Location
        return
    }
    Pop-Location
    
    Write-Host ""
    Write-Host "Paso 3/3: Construyendo proyecto..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-CommandResult "Reset completado exitosamente" "Success"
    } else {
        Write-CommandResult "Build falló durante el reset" "Error"
    }
    Pop-Location
    
    Write-Host ""
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
    
    Write-Host "  Componentes: $componentCount" -ForegroundColor Cyan
    Write-Host "  Paginas: $pageCount" -ForegroundColor Cyan
    Write-Host "  Servicios: $serviceCount" -ForegroundColor Cyan
    Write-Host "  Hooks: $hookCount" -ForegroundColor Cyan
    
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
    Write-Host "  status      Muestra el estado actual del proyecto (Git, Build, Firebase)" -ForegroundColor Green
    Write-Host "  deploy      Construye y despliega el proyecto a Firebase Hosting" -ForegroundColor Green
    Write-Host "  build       Solo construye el proyecto sin desplegar" -ForegroundColor Green
    Write-Host "  clean       Elimina archivos de build y cache temporales" -ForegroundColor Green
    Write-Host "  validate    Verifica que todos los archivos requeridos existan" -ForegroundColor Green
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
    Write-Host "  .\harness.ps1 clean               # Limpiar archivos temporales" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
switch ($Command) {
    'status'    { Show-Status }
    'deploy'    { Deploy-Project }
    'build'     { 
        $buildSuccess = Build-Project
        if ($buildSuccess -and $AutoDeploy) {
            Write-Host ">>> AutoDeploy activado - ejecutando deploy..." -ForegroundColor Magenta
            Write-Host ""
            Deploy-Project
        }
    }
    'clean'     { Clean-Build }
    'validate'  { Validate-Structure }
    'reset'     { Reset-Project }
    'dashboard' { Show-Dashboard }
    'help'      { Show-Help }
}
