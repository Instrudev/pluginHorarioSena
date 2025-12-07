# Extensión Chrome: Exportador de Agenda SENA

Esta extensión (Manifest V3) inyecta un extractor de horarios en páginas con tablas anidadas similares al calendario del SENA, genera un Excel usando SheetJS embebido y lo descarga automáticamente.

## Estructura
- `manifest.json`: configuración MV3 con permisos de `scripting`, `activeTab` y `downloads`.
- `popup.html`: interfaz mínima con el botón **"Extraer y Exportar a Excel"**.
- `popup.js`: inyecta `extractor.js` en la pestaña activa, obtiene el JSON resultante y llama a `generateExcel`.
- `extractor.js`: analiza todos los nodos `.day`, extrae fecha, intervalos, estado, código, actividad y lugar.
- `excel.js`: incluye la librería `XLSX` (SheetJS) y la función `generateExcel` que crea el archivo `agenda_exportada.xlsx`.

## Instalación en Chrome/Edge
1. Descarga o clona este repositorio.
2. Abre `chrome://extensions/` (o `edge://extensions/`).
3. Activa **Modo desarrollador**.
4. Pulsa **Cargar descomprimida** y selecciona la carpeta `pluginHorarioSena`.
5. Abre cualquier página con el calendario de horarios del SENA (o una tabla con estructura similar).
6. Haz clic en el ícono de la extensión y presiona **"Extraer y Exportar a Excel"**.
7. Se descargará el archivo `agenda_exportada.xlsx` con las columnas: Fecha, Hora Inicio, Hora Fin, Estado, Código, Actividad y Lugar.

## Notas de extracción
- Se buscan elementos `.day` en la página actual.
- El script intenta leer la fecha desde atributos `data-date`, `data-dia`, `data-fecha` o desde encabezados dentro del contenedor.
- Se analiza cada fila (`<tr>`), `.row` o `.fc-event` interna para ubicar horarios, estado "Disponible"/"Ocupado", códigos numéricos entre paréntesis, descripción y lugar (incluidos tooltips en `data-bs-original-title` o `title`).

## Sin dependencias externas
La librería SheetJS (`xlsx.full.min.js`) está empaquetada dentro de `excel.js`, por lo que la extensión funciona completamente offline.
