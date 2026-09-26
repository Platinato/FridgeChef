/* CounterPill - icon + number in white, no background ("👁 14.5k" → "🧺 12 items"). RN: <View row> */
FC.components.CounterPill = function CounterPill({ icon, value }) {
  return `<span class="c-counter">${FC.icon(icon, 18)}<span>${FC.util.esc(value)}</span></span>`;
};
