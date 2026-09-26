/* PantryItem - a remembered staple with its stock LevelBars.
   variant 'row' (tappable list row), 'card' (small horizontal card), or pass `toggle` for an include switch.
   RN: <Pressable> row / card */
FC.components.PantryItem = function PantryItem({ item, variant = 'row', action = 'open-staple', toggle }) {
  const C = FC.components;
  const { cx, act, esc, timeAgo } = FC.util;
  const low = FC.logic.isLow(item);
  const dot = low ? '<i class="c-dot" aria-label="Running low"></i>' : '';
  const bars = (size) => C.LevelBars({ level: item.level, color: low ? 'white' : 'lime', size, label: `${esc(item.name)} stock ${Math.round(item.level)} of 5` });

  if (variant === 'card') {
    return `<button class="c-pantry-card" ${act(action, item.id)}>
      <span class="c-pantry-card__name">${dot}<span class="t-display">${esc(item.name)}</span></span>
      ${bars(9)}
      <span class="c-pantry-card__hint">${esc(item.unitHint)}</span>
    </button>`;
  }
  const text = `<span class="c-pantry__text">
      <span class="c-pantry__name">${dot}${esc(item.name)}</span>
      <span class="c-pantry__meta">${esc(item.unitHint)} · Updated ${timeAgo(item.updatedAt)}</span>
    </span>${bars(10)}`;
  if (toggle) {
    return `<div class="${cx('c-pantry', 'c-pantry--compact', !toggle.on && 'is-off')}">${text}
      ${C.Toggle({ bare: true, on: toggle.on, action: toggle.action, id: item.id, label: `Include ${item.name}` })}</div>`;
  }
  return `<button class="c-pantry" ${act(action, item.id)}>${text}${FC.icon('chevronRight', 18)}</button>`;
};
