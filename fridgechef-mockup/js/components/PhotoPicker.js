/* PhotoPicker - 3-per-row multi-select photo grid (built with flex-wrap). RN: expo-image-picker (multiple) */
FC.components.PhotoPicker = function PhotoPicker({ photos, selected = [] }) {
  const { cx, act, img } = FC.util;
  return `<div class="c-picker">${photos.map((p) => {
    const on = selected.includes(p.id);
    return `<button class="${cx('c-picker__item', on && 'is-on')}" ${act('picker-toggle', p.id)} aria-pressed="${on}" aria-label="${p.label}">
      ${img(p.src, p.label, 'c-picker__img')}
      <span class="c-picker__check">${on ? FC.icon('check', 14, 3) : ''}</span>
    </button>`;
  }).join('')}</div>`;
};
