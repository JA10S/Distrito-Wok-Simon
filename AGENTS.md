# AGENTS.md - Restaurante Distrito Wok Simón

## Contexto del Proyecto
Este proyecto contiene el menú digital del restaurante "Distrito Wok Simón", un restaurante de comida oriental colombiana.

## Ubicación
- **Directorio principal:** `C:\Users\jadies\restaurante\`
- **Archivo HTML:** `menu-distrito-wok-simon_html.html`
- **Archivo PDF:** `menu-distrito-wok-simon.pdf`
- **Documentación:** `MENU_RESTAURANTE.md`

## Estructura del Menú
El menú está dividido en 2 páginas A4:

### Página 1: Arroces y Corrientes
- **Arroces:** 17 tipos de arroces con precio medio y entero
- **Corrientes:** 9 platos principales (carnes, pescados, pollo)

### Página 2: Porciones y Bebidas
- **Porciones:** 7 acompañamientos
- **Bebidas:** 15 productos (gaseosas, jugos, aguas)

## Tecnologías Utilizadas
- **HTML5:** Estructura del menú
- **CSS3:** Diseño y estilos
- **Google Fonts:** Cormorant Garamond + Montserrat
- **Chrome Headless:** Generación de PDF

## Especificaciones Técnicas
- **Tamaño de página:** 210mm x 600mm por hoja
- **Colores principales:**
  - Dorado: #D4A843
  - Negro: #0d0d0d
  - Rojo: #C40F0F
- **Fuentes:**
  - Títulos: Cormorant Garamond
  - Cuerpo: Montserrat

## Comandos Disponibles
```powershell
# Ver resumen del proyecto (harnes)
.\restaurante-harness.ps1

# O ejecutar el archivo batch
.\restaurante.bat

# Regenerar PDF
.\generar-pdf.ps1
```

## Uso del Harnes
El harnes `restaurante-harness.ps1` proporciona:
- Ubicación del proyecto
- Estado de los archivos
- Estructura del menú
- Resumen de precios
- Últimos cambios realizados
- Características técnicas

## Historial de Cambios
1. Labels cambiados de "personal/especial" a "medio/entero"
2. Precio Arroz Currambero actualizado: 32K/40K → 37K/47K
3. Precio Coca-Cola 600ML actualizado: $4,000 → $4,500
4. Precio Agua Brisa 600ML actualizado: $2,500 → $2,000
5. Precio Sancocho actualizado: 10K → 12K

## Notas Importantes
- Los precios están en pesos colombianos (COP)
- "K" significa miles (ej: 30K = $30,000 COP)
- El menú está optimizado para visualización en móviles
- Se requiere Google Chrome para regenerar el PDF