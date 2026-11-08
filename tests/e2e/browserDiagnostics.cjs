function sanitizeText(value) {
  return String(value)
    .replace(/((?:api[_-]?key|access[_-]?token|password|authorization|secret)\s*[:=]\s*["']?)[^\s"'&,;]+/gi, '$1[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .slice(0, 500);
}

function describeUrl(value, appOrigin) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.origin === appOrigin ? url.pathname : url.origin;
  } catch {
    return '';
  }
}

function installBrowserDiagnostics(page, appUrl) {
  const appOrigin = new URL(appUrl).origin;
  const events = [];
  let phase = 'startup';

  const record = (kind, details) => events.push({ phase, kind, ...details });

  page.on('pageerror', error => {
    record('pageerror', { message: sanitizeText(error.message), stack: sanitizeText(error.stack || '') });
  });

  page.on('console', message => {
    if (message.type() !== 'error') return;
    record('console.error', {
      source: describeUrl(message.location().url, appOrigin),
      message: sanitizeText(message.text()),
    });
  });

  page.on('requestfailed', request => {
    record('requestfailed', {
      url: describeUrl(request.url(), appOrigin),
      error: sanitizeText(request.failure()?.errorText || 'Unknown request failure'),
    });
  });

  page.on('response', response => {
    if (response.status() < 400) return;
    record('http.error', { url: describeUrl(response.url(), appOrigin), status: response.status() });
  });

  return {
    setPhase(nextPhase) {
      phase = nextPhase;
    },
    get events() {
      return [...events];
    },
    get firstPartyFailures() {
      return events.filter(event => event.kind === 'pageerror'
        || (event.kind === 'console.error' && (!event.source || event.source.startsWith('/')))
        || ((event.kind === 'requestfailed' || event.kind === 'http.error') && event.url.startsWith('/')));
    },
  };
}

module.exports = { installBrowserDiagnostics };
