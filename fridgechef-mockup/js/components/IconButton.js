/* IconButton - 44px circular action. `image` renders a photo thumb instead of an icon.
   RN: <Pressable style={circle}> + icon */
FC.components.IconButton = function IconButton({
  icon, image, label, action = 'soon', id, value, variant = 'dark', badge = false, size = 44, disabled = false,
}) {
  const { cx, act, esc, img } = FC.util;
  const inner = image ? img(image, label || 'Photo', 'c-iconbtn__img') : FC.icon(icon, Math.round(size * 0.46));
  return `<button class="${cx('c-iconbtn', 'c-iconbtn--' + variant, image && 'c-iconbtn--image')}"
    style="width:${size}px;height:${size}px" ${act(action, id, value)}
    aria-label="${esc(label || icon)}" ${disabled ? 'disabled' : ''}>
    ${inner}${badge ? '<span class="c-iconbtn__dot"></span>' : ''}
  </button>`;
};
