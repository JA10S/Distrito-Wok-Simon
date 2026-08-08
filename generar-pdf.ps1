# Generar PDF - Distrito Wok Simón
# Ejecutar: .\generar-pdf.ps1

Write-Host "🔄 Generando PDF del menú..." -ForegroundColor Yellow

$htmlFile = "C:\Users\jadies\restaurante\menu-distrito-wok-simon_html.html"
$pdfFile = "C:\Users\jadies\restaurante\menu-distrito-wok-simon.pdf"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (-not (Test-Path $htmlFile)) {
    Write-Host "❌ No se encontró el archivo HTML: $htmlFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $chromePath)) {
    Write-Host "❌ No se encontró Google Chrome en: $chromePath" -ForegroundColor Red
    exit 1
}

try {
    & $chromePath --headless --disable-gpu --print-to-pdf="$pdfFile" --no-pdf-header-footer --print-to-pdf-no-header --print-to-pdf-no-footer "file:///$htmlFile"
    
    if (Test-Path $pdfFile) {
        $tamaño = (Get-Item $pdfFile).Length
        $tamañoKB = [math]::Round($tamaño / 1KB, 2)
        Write-Host "✅ PDF generado exitosamente!" -ForegroundColor Green
        Write-Host "   Archivo: $pdfFile" -ForegroundColor White
        Write-Host "   Tamaño: $tamañoKB KB" -ForegroundColor White
    } else {
        Write-Host "❌ Error al generar el PDF" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error al ejecutar Chrome: $_" -ForegroundColor Red
}