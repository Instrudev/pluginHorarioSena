function cleanText(value) {
  return (value || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function decodeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return cleanText(div.textContent || div.innerText || '');
}

function resolveDate(dayElement) {
  const attributes = ['data-date', 'data-dia', 'data-fecha'];
  for (const attr of attributes) {
    const value = dayElement.getAttribute(attr);
    if (value) return cleanText(value);
  }

  const knownNodes = dayElement.querySelector(
    '.date, .day-title, .header a, .header, header, h4, h5, .fc-daygrid-day-number'
  );
  if (knownNodes) {
    return cleanText(knownNodes.textContent);
  }

  const text = cleanText(dayElement.textContent);
  const match = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/);
  return match ? match[0] : '';
}

function extractTimeRange(text) {
  const timeRegex = /(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/;
  const match = text.match(timeRegex);
  if (match) {
    return { inicio: match[1], fin: match[2] };
  }
  return { inicio: '', fin: '' };
}

function extractState(text) {
  if (/disponible/i.test(text)) return 'Disponible';
  if (/ocupado/i.test(text)) return 'Ocupado';
  return '';
}

function extractCode(text) {
  const codeMatch = text.match(/\((\d{3,})\)/);
  return codeMatch ? codeMatch[1] : '';
}

function parseTooltip(row) {
  const onMouse = row.getAttribute('onmouseover') || '';
  const tooltipMatch = /'content'\s*,\s*'(.*?)'/.exec(onMouse);
  const captionMatch = /'caption'\s*,\s*'(.*?)'/.exec(onMouse);
  return {
    caption: captionMatch ? decodeHtml(captionMatch[1]) : '',
    content: tooltipMatch ? decodeHtml(tooltipMatch[1]) : ''
  };
}

function extractLocation(row) {
  const tooltip = row.querySelector('[data-bs-original-title]');
  if (tooltip) return cleanText(tooltip.getAttribute('data-bs-original-title'));

  const titleAttr = row.querySelector('[title]');
  if (titleAttr) return cleanText(titleAttr.getAttribute('title') || titleAttr.textContent);

  const tooltipData = parseTooltip(row);
  if (tooltipData.content) return tooltipData.content;

  const placeNode = row.querySelector('.lugar, .place, .location, .ubicacion');
  if (placeNode) return cleanText(placeNode.textContent);
  return '';
}

function extractActivity(row, text, usedPieces) {
  const activityNode = row.querySelector('.actividad, .activity, .event, .descripcion, .description');
  if (activityNode) return cleanText(activityNode.textContent);

  const tooltipData = parseTooltip(row);
  if (tooltipData.caption) return tooltipData.caption;

  let activityText = text;
  for (const part of usedPieces) {
    if (part) {
      activityText = activityText.replace(part, '');
    }
  }
  return cleanText(activityText);
}

function extractRowsFromDay(dayElement, dateText) {
  const content =
    dayElement.querySelector('.content') ||
    dayElement.querySelector('.month') ||
    dayElement;

  const rows = Array.from(content.querySelectorAll('tr'));
  const items = [];

  const containerRows = rows.length ? rows : Array.from(content.querySelectorAll('.row, .fc-event, td'));
  const iterable = containerRows.length ? containerRows : [content];

  iterable.forEach((row) => {
    const rawText = cleanText(row.textContent);
    if (!rawText) return;

    const { inicio, fin } = extractTimeRange(rawText);
    const estado = extractState(rawText);
    const codigo = extractCode(rawText);
    const lugar = extractLocation(row);

    const usedPieces = [inicio, fin, estado, `(${codigo})`, lugar].filter(Boolean);
    const actividad = extractActivity(row, rawText, usedPieces);

    const hasData = inicio || fin || estado || codigo || actividad || lugar;
    if (!hasData) return;

    items.push({
      fecha: dateText,
      hora_inicio: inicio,
      hora_fin: fin,
      estado,
      codigo,
      actividad,
      lugar
    });
  });

  return items;
}

function collectDayNodes() {
  const candidates = Array.from(
    document.querySelectorAll('td.day > div.day, td.day, .schedule-compact-outlookxp .day, .day')
  );

  const unique = new Map();
  candidates.forEach((node) => {
    const header = node.querySelector('.header a, .header');
    const key = header ? cleanText(header.textContent) : cleanText(node.dataset?.date || node.textContent);
    if (!key || unique.has(key)) return;
    unique.set(key, node);
  });

  return Array.from(unique.values());
}

function extractSchedule() {
  const days = collectDayNodes();
  const agenda = [];

  if (days.length) {
    days.forEach((dayElement) => {
      const fecha = resolveDate(dayElement);
      const rows = extractRowsFromDay(dayElement, fecha);
      agenda.push(...rows);
    });
  } else {
    // Fallback for compact schedules: walk every row that contains a time range
    const rawRows = document.querySelectorAll('tr, td');
    rawRows.forEach((row) => {
      const text = cleanText(row.textContent);
      if (!/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/.test(text)) return;
      const { inicio, fin } = extractTimeRange(text);
      const estado = extractState(text);
      const codigo = extractCode(text);
      const lugar = extractLocation(row);
      const usedPieces = [inicio, fin, estado, `(${codigo})`, lugar].filter(Boolean);
      const actividad = extractActivity(row, text, usedPieces);
      agenda.push({
        fecha: '',
        hora_inicio: inicio,
        hora_fin: fin,
        estado,
        codigo,
        actividad,
        lugar
      });
    });
  }

  return agenda;
}
