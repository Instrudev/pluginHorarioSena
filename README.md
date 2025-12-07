# Extensión Chrome: Exportador de Agenda SENA

Esta extensión (Manifest V3) inyecta un extractor de horarios en páginas con tablas anidadas similares al calendario del SENA, incluso cuando el sitio bloquea clic derecho, inspección o selección de texto. Genera un Excel usando SheetJS embebido y lo descarga automáticamente.

## Estructura
- `manifest.json`: configuración MV3 con permisos de `scripting`, `activeTab`, `downloads` y `host_permissions` para `<all_urls>`, además de declarar el content script.
- `popup.html`: interfaz mínima con el botón **"Extraer horario y exportar a Excel"**.
- `popup.js`: inyecta `extractor.js` en la pestaña activa dentro del `MAIN` world, obtiene el JSON resultante y llama a `generateExcel`.
- `extractor.js`: desactiva listeners de bloqueo (clic derecho, inspección, selección), analiza todos los nodos `.day`, incluso en Shadow DOM, y extrae fecha, intervalos, estado, código, actividad y lugar.
- `excel.js`: incluye la librería `XLSX` (SheetJS) y la función `generateExcel` que crea el archivo `agenda_exportada.xlsx`.

## Instalación en Chrome/Edge
1. Descarga o clona este repositorio (opcionalmente comprímelo en un `.zip` para empaquetarlo).
2. Abre `chrome://extensions/` (o `edge://extensions/`).
3. Activa **Modo desarrollador**.
4. Pulsa **Cargar descomprimida** y selecciona la carpeta `pluginHorarioSena` (o arrastra el `.zip`).
5. Abre cualquier página con el calendario de horarios del SENA (o una tabla con estructura similar), incluso si bloquea clic derecho o inspección.
6. Haz clic en el ícono de la extensión y presiona **"Extraer horario y exportar a Excel"**.
7. La extensión inyectará el content script en el `MAIN` world, eliminará bloqueos de interacción, leerá la tabla anidada y descargará automáticamente `agenda_exportada.xlsx` con las columnas: Fecha, Hora Inicio, Hora Fin, Estado, Código, Actividad y Lugar.

## Notas de extracción
- Se buscan elementos `.day` en la página actual.
- El script intenta leer la fecha desde atributos `data-date`, `data-dia`, `data-fecha` o desde encabezados dentro del contenedor.
- Se analiza cada fila (`<tr>`), `.row` o `.fc-event` interna para ubicar horarios, estado "Disponible"/"Ocupado", códigos numéricos entre paréntesis, descripción y lugar (incluidos tooltips en `data-bs-original-title` o `title`).

## Sin dependencias externas
La librería SheetJS (`xlsx.full.min.js`) está empaquetada dentro de `excel.js`, por lo que la extensión funciona completamente offline.
