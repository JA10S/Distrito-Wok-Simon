# Restaurante Harness - Distrito Wok Simon
# Ejecutar: .\restaurante-harness.ps1

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   RESTAURANTE DISTRITO WOK SIMON - HARNES DE PROYECTO" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nUBICACION DEL PROYECTO:" -ForegroundColor Green
Write-Host "   C:\Users\jadies\restaurante\" -ForegroundColor White

Write-Host "`nARCHIVOS DEL PROYECTO:" -ForegroundColor Green
$archivos = @(
    "menu-distrito-wok-simon_html.html",
    "menu-distrito-wok-simon.pdf",
    "MENU_RESTAURANTE.md"
)

foreach ($archivo in $archivos) {
    $ruta = "C:\Users\jadies\restaurante\$archivo"
    if (Test-Path $ruta) {
        $tamanio = (Get-Item $ruta).Length
        $tamanioKB = [math]::Round($tamanio / 1KB, 2)
        Write-Host "   OK $archivo ($tamanioKB KB)" -ForegroundColor White
    } else {
        Write-Host "   FALTA $archivo (NO ENCONTRADO)" -ForegroundColor Red
    }
}

Write-Host "`nESTRUCTURA DEL MENU:" -ForegroundColor Green
Write-Host "   Pagina 1: Arroces (17 platos) + Corrientes (9 platos)" -ForegroundColor White
Write-Host "   Pagina 2: Porciones (7 platos) + Bebidas (15 productos)" -ForegroundColor White

Write-Host "`nRESUMEN DE PRECIOS:" -ForegroundColor Green
Write-Host "   Arroces: 25K - 47K (medio/entero)" -ForegroundColor White
Write-Host "   Corrientes: 16K - 20K" -ForegroundColor White
Write-Host "   Porciones: 5K - 12K" -ForegroundColor White
Write-Host "   Bebidas: $1,500 - $8,000" -ForegroundColor White

Write-Host "`nULTIMOS CAMBIOS REALIZADOS:" -ForegroundColor Green
Write-Host "   - Labels cambiados: personal/especial a medio/entero" -ForegroundColor White
Write-Host "   - Arroz Currambero: 32K/40K a 37K/47K" -ForegroundColor White
Write-Host "   - Coca-Cola 600ML: $4,000 a $4,500" -ForegroundColor White
Write-Host "   - Agua Brisa 600ML: $2,500 a $2,000" -ForegroundColor White
Write-Host "   - Sancocho: 10K a 12K" -ForegroundColor White

Write-Host "`nCARACTERISTICAS TECNICAS:" -ForegroundColor Green
Write-Host "   - Diseno responsivo para moviles" -ForegroundColor White
Write-Host "   - 2 paginas A4 (210mm x 600mm cada una)" -ForegroundColor White
Write-Host "   - Fuentes: Cormorant Garamond + Montserrat" -ForegroundColor White
Write-Host "   - Colores: Dorado (#D4A843), Negro (#0d0d0d), Rojo (#C40F0F)" -ForegroundColor White

Write-Host "`nCOMANDOS DISPONIBLES:" -ForegroundColor Green
Write-Host "   .\restaurante-harness.ps1    - Mostrar este resumen" -ForegroundColor White
Write-Host "   .\generar-pdf.ps1            - Regenerar el PDF" -ForegroundColor White

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan