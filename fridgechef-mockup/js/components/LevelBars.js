/* LevelBars - row of small squares (■■■□□) for effort / stock level.
   With `action`, each square is tappable and sets the level. color: lime | white | ink. RN: <View row> */
FC.components.LevelBars = function LevelBars({ level = 0, max = 5, color = 'lime', size = 10, action, id, label }) {
  const { cx, act, esc } = FC.util;
  const filled = Math.round(level);
  const cells = Array.from({ length: max }, (_, i) => {
    const cls = cx('c-bars__cell', i < filled && 'is-on');
    const dim = `width:${size}px;height:${size}px`;
    return action
      ? `<button class="${cls}" style="${dim}" ${act(action, id, i + 1)} aria-label="Level ${i + 1} of ${max}"></button>`
      : `<i class="${cls}" style="${dim}"></i>`;
  }).join('');
  return `<span class="${cx('c-bars', 'c-bars--' + color, action && 'c-bars--input')}"
    role="${action ? 'group' : 'img'}" aria-label="${esc(label || `Level ${filled} of ${max}`)}">${cells}</span>`;
};
