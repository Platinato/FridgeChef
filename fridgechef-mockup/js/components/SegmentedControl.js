/* SegmentedControl - pill segments, active = lime. Options may carry a `level` (shows LevelBars).
   stacked: tall segments with bars above the label. size: sm. RN: <View row> of <Pressable> */
FC.components.SegmentedControl = function SegmentedControl({ options, value, action = 'soon', id, stacked = false, size }) {
  const { cx, act, esc } = FC.util;
  const items = options.map((o) => {
    const on = o.value === value;
    const bars = o.level != null ? FC.components.LevelBars({ level: o.level, size: 7, color: on ? 'ink' : 'white' }) : '';
    return `<button class="${cx('c-seg__opt', on && 'is-active')}" ${act(action, id, o.value)} aria-pressed="${on}">
      ${bars}<span>${esc(o.label)}</span></button>`;
  }).join('');
  return `<div class="${cx('c-seg', stacked && 'c-seg--stacked', size && 'c-seg--' + size)}" role="group">${items}</div>`;
};
