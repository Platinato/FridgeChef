/* PrimaryButton - pill CTA. variant: black | lime | outline | ghost | light | danger;
   size: (56px) | sm (44px) | xs (36px). RN: <Pressable> */
FC.components.PrimaryButton = function PrimaryButton({
  label, variant = 'black', disabled = false, action = 'soon', id, value, icon, iconRight, size, full = true,
}) {
  const { cx, act, esc } = FC.util;
  const is = size === 'xs' ? 16 : 20;
  return `<button class="${cx('c-btn', 'c-btn--' + variant, full && 'c-btn--full', size && 'c-btn--' + size)}"
    ${act(action, id, value)} ${disabled ? 'disabled aria-disabled="true"' : ''}>
    ${icon ? FC.icon(icon, is, 2.25) : ''}<span>${esc(label)}</span>${iconRight ? FC.icon(iconRight, is, 2.25) : ''}
  </button>`;
};
