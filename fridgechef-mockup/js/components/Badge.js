/* Badge - small pill label. variant: lime | dark | glass | alert | outline | ink.
   Pass `action` to make it pressable. RN: <View>/<Pressable> + <Text> */
FC.components.Badge = function Badge({ label, dot, variant = 'lime', icon, size, action, id, value }) {
  const { cx, act, esc } = FC.util;
  const tag = action ? 'button' : 'span';
  return `<${tag} class="${cx('c-badge', 'c-badge--' + variant, size && 'c-badge--' + size)}" ${act(action, id, value)}>
    ${dot ? `<i class="c-badge__dot c-badge__dot--${dot}"></i>` : ''}${icon ? FC.icon(icon, size === 'lg' ? 20 : 14, 2.25) : ''}<span>${esc(label)}</span>
  </${tag}>`;
};
