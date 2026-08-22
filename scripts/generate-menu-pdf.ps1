#Requires -Version 5.1
<#
.SYNOPSIS
    Genera PDF del menú usando el HTML existente del archive
#>

param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SourceHtml = "$ProjectRoot\archive\html-versions\menu-distrito-wok-simon_html.html"
$TempHtml = "$ProjectRoot\temp-menu.html"
$OutputPdf = "$ProjectRoot\archive\pdfs\menu-distrito-wok-simon-actualizado.pdf"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Generador de PDF - Menu Distrito Wok Simon" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el HTML fuente
if (-not (Test-Path $SourceHtml)) {
    Write-Host "[ERROR] No se encontro el HTML: $SourceHtml" -ForegroundColor Red
    exit 1
}

# Copiar el HTML existente al temporal
Copy-Item -Path $SourceHtml -Destination $TempHtml -Force
Write-Host "[OK] HTML fuente copiado" -ForegroundColor Green
Write-Host "     Desde: $SourceHtml" -ForegroundColor Gray
Write-Host "     Hasta: $TempHtml" -ForegroundColor Gray
Write-Host ""
Write-Host "Ejecutando conversion a PDF..." -ForegroundColor Yellow