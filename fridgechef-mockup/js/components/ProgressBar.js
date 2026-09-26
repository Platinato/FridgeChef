/* ProgressBar - thin rounded bar with optional label/caption row (cook progress, macros). RN: <View> */
FC.components.ProgressBar = function ProgressBar({ value, max = 1, label, caption = '', variant = 'lime' }) {
  const { esc } = FC.util;
  const pct = Math.max(0, Math.min(1, value / (max || 1))) * 100;
  return `<div class="c-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" ${label ? `aria-label="${esc(label)}"` : ''}>
    ${label ? `<div class="c-progress__head"><span>${esc(label)}</span><span>${esc(caption)}</span></div>` : ''}
    <div class="c-progress__track"><div class="c-progress__fill c-progress__fill--${variant}" style="width:${pct.toFixed(1)}%"></div></div>
  </div>`;
};
