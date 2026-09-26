/* Analyzing - stacked photos with a scan sweep while detected items pop in; auto-advances (timer in app.js). */
FC.screens.Analyzing = function Analyzing(state) {
  const C = FC.components;
  const items = state.detected;
  const found = Math.min(state.ui.found, items.length);
  const done = found >= items.length;

  const body = `
    ${C.TopBar({
      left: C.IconButton({ icon: 'back', label: 'Back to camera', action: 'go', value: '#/scan' }),
      center: C.LiveBadge({ label: done ? 'Scan complete' : 'Scanning' }),
      right: C.PrimaryButton({ label: 'Skip', variant: 'ghost', size: 'sm', full: false, action: 'go', value: '#/confirm' }),
    })}
    ${C.PhotoStack({ photos: state.photos, scanning: !done })}
    <div class="s-an__count"><b class="t-display">${found} / ${items.length}</b><span class="t-display">found</span></div>
    ${C.ProgressBar({ value: found, max: items.length || 1 })}
    <div class="s-an__chips">${items.slice(0, found).map((d, i) => C.DetectedChip({ name: d.name, confidence: d.confidence, animate: i === found - 1 })).join('')}</div>
    <p class="t-caption">${done ? 'Next: check the amounts - a photo can’t tell 400 g from 700 g.' : 'Reading labels, shapes and packaging…'}</p>`;

  return C.Screen({ className: 's-an', body });
};
