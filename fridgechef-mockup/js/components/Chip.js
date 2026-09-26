/* Chip - pill toggle. Active = lime/black, inactive = dark/grey. RN: <Pressable> pill */
FC.components.Chip = function Chip({ label, active = false, icon, action = 'soon', id, value, size }) {
  const { cx, act, esc } = FC.util;
  return `<button class="${cx('c-chip', active && 'is-active', size && 'c-chip--' + size)}"
    ${act(action, id, value)} aria-pressed="${active}">
    ${icon ? FC.icon(icon, 16) : ''}<span>${esc(label)}</span>
  </button>`;
};
