/* TicketCard - two halves joined by semicircular notch cut-outs and a dashed seam.
   variant / bottomVariant: lime | light | white | dark. RN: <View> + react-native-svg mask */
FC.components.TicketCard = function TicketCard({
  top, bottom, variant = 'lime', bottomVariant = 'white', action, id, value, compact = false, label,
}) {
  const { cx, act, esc } = FC.util;
  // A div with role=button (not <button>) so cards can hold their own nested buttons
  const press = action ? `role="button" tabindex="0" ${act(action, id, value)}` : '';
  return `<div class="${cx('c-ticket', compact && 'c-ticket--compact', action && 'is-pressable')}" ${press}
    ${label ? `aria-label="${esc(label)}"` : ''}>
    <div class="c-ticket__top c-ticket--${variant}">${top}</div>
    ${bottom ? `<div class="c-ticket__bottom c-ticket--${bottomVariant}">${bottom}</div>` : ''}
  </div>`;
};
