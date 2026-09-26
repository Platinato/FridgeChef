/* ChipRow - horizontally scrolling row of Chips that bleeds off the right edge,
   or a wrapping group with `wrap`. RN: horizontal <ScrollView> / flexWrap View */
FC.components.ChipRow = function ChipRow({ chips, wrap = false, key = 'chips' }) {
  const items = chips.map((c) => FC.components.Chip(c)).join('');
  return wrap
    ? `<div class="c-chiprow c-chiprow--wrap">${items}</div>`
    : `<div class="c-chiprow no-scrollbar" data-keep-scroll="${FC.util.esc(key)}">${items}</div>`;
};
