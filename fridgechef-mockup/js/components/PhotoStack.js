/* PhotoStack - up to three photos fanned like cards; the top one carries the scanning overlay.
   RN: absolutely positioned <Image>s with rotate transforms */
FC.components.PhotoStack = function PhotoStack({ photos, scanning = false }) {
  const { img } = FC.util;
  const shown = photos.slice(0, 3).reverse(); // last in DOM = on top = first photo
  return `<div class="c-stack">${shown.map((p, i) => `
    <div class="c-stack__card c-stack__card--${shown.length - 1 - i}">
      ${img(p.src, p.label, 'c-stack__img')}
      ${i === shown.length - 1 ? FC.components.ScanOverlay({ sweeping: scanning, inset: '14px' }) : ''}
    </div>`).join('')}
  </div>`;
};
