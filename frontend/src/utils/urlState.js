const MAX_CODE = 8000;

export function encodeState({ code, language, score, issues, model }) {
  try {
    const payload = {
      code: (code || '').slice(0, MAX_CODE),
      codeTruncated: (code || '').length > MAX_CODE,
      language: language || 'python',
      score: score || 0,
      issues: issues || [],
      model: model || 'auto',
      v: 1
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch { return null; }
}

export function decodeState(hash) {
  try { return JSON.parse(decodeURIComponent(escape(atob(hash)))); }
  catch { return null; }
}

export function getStateFromURL() {
  const hash = window.location.hash.slice(1);
  return hash ? decodeState(hash) : null;
}

export function pushStateToURL(state) {
  const encoded = encodeState(state);
  if (encoded) window.history.replaceState(null, '', `#${encoded}`);
}

export function clearURLState() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}
