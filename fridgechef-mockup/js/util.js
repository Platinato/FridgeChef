/* Namespace bootstrap + tiny shared helpers. Loaded first. */
window.FC = window.FC || {};
FC.components = FC.components || {};
FC.screens = FC.screens || {};

FC.util = (function () {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const cx = (...parts) => parts.filter(Boolean).join(' ');

  // data-* attributes read by the single delegated handler in app.js (≈ an RN onPress prop)
  const act = (action, id, value) => (action
    ? `data-action="${esc(action)}"` +
      (id != null ? ` data-id="${esc(id)}"` : '') +
      (value != null ? ` data-value="${esc(value)}"` : '')
    : '');

  const initials = (name) => String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  // Every image degrades to a lime/dark gradient tile with initials if it can't load (offline mode)
  const img = (src, alt, cls) =>
    `<img class="${esc(cls || '')}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="FC.util.imgFallback(this)">`;

  function imgFallback(el) {
    const tile = document.createElement('div');
    tile.className = el.className + ' img-fallback';
    tile.textContent = initials(el.alt);
    tile.setAttribute('role', 'img');
    tile.setAttribute('aria-label', el.alt);
    el.replaceWith(tile);
  }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmtNum = (n) => String(Math.round(n * 100) / 100);
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const daysSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5));
  const timeAgo = (iso) => { const d = daysSince(iso); return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`; };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  return { esc, cx, act, initials, img, imgFallback, clamp, fmtNum, daysAgo, daysSince, timeAgo, plural, slug };
})();
