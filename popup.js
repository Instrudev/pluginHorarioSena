/* global generateExcel */

const button = document.getElementById('extract');
const statusEl = document.getElementById('status');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#a00' : '#555';
}

async function injectExtractor(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['extractor.js']
  });
}

async function runExtraction(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (typeof extractSchedule !== 'function') {
        throw new Error('El extractor no se cargó correctamente');
      }
      return extractSchedule();
    }
  });
  return result || [];
}

async function handleExtractClick() {
  button.disabled = true;
  setStatus('Inyectando extractor y leyendo la página actual...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No se pudo localizar la pestaña activa');
    }

    await injectExtractor(tab.id);
    const agenda = await runExtraction(tab.id);

    if (!agenda.length) {
      setStatus('No se encontraron filas en la agenda.');
      button.disabled = false;
      return;
    }

    setStatus('Generando archivo Excel...');
    generateExcel(agenda);
    setStatus('Archivo "agenda_exportada.xlsx" generado y descargado.');
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}

button.addEventListener('click', handleExtractClick);
