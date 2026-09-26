/* ListRow - settings-style row: icon · label · detail · chevron (or a custom `right` control).
   Pressable only when `action` is given. RN: <Pressable row> */
FC.components.ListRow = function ListRow({ label, detail, icon, action, id, value, right, danger = false }) {
  const { cx, act, esc } = FC.util;
  const tag = action ? 'button' : 'div';
  const trailing = right != null ? right : action ? FC.icon('chevronRight', 18) : '';
  return `<${tag} class="${cx('c-listrow', danger && 'c-listrow--danger')}" ${act(action, id, value)}>
    ${icon ? `<span class="c-listrow__icon">${FC.icon(icon, 18)}</span>` : ''}
    <span class="c-listrow__label">${esc(label)}</span>
    ${detail != null ? `<span class="c-listrow__detail">${esc(detail)}</span>` : ''}
    ${trailing}
  </${tag}>`;
};
