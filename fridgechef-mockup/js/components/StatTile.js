/* StatTile - rounded tile with a big condensed number + caption ("47% CH" → "540 KCAL").
   variant: lime | white | soft. RN: <View> + <Text> */
FC.components.StatTile = function StatTile({ value, caption, variant = 'lime', tall = false }) {
  const { cx, esc } = FC.util;
  return `<div class="${cx('c-stat', 'c-stat--' + variant, tall && 'c-stat--tall')}">
    <span class="c-stat__value t-display">${esc(value)}</span>
    <span class="c-stat__caption t-display">${esc(caption)}</span>
  </div>`;
};
