/* DetectedChip - an ingredient the scan found. Pops in when `animate`; neighbours are joined by a dashed tail.
   Low confidence shows the red dot. RN: Animated <View> pill */
FC.components.DetectedChip = function DetectedChip({ name, confidence, animate = false }) {
  const { cx, esc } = FC.util;
  const mark = confidence === 'low' ? '<i class="c-dot"></i>' : FC.icon('check', 14, 2.75);
  return `<span class="${cx('c-detected', animate && 'is-new')}">${mark}${esc(name)}</span>`;
};
