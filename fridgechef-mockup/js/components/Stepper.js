/* Stepper - − value + control. Buttons carry the next value in data-value.
   hideValue: buttons only (when the value is shown elsewhere). RN: <View row> + 2 <Pressable> */
FC.components.Stepper = function Stepper({
  value, min = 0, max = 99, step = 1, action = 'soon', id, label, unit, hideValue = false,
}) {
  const { cx, act, esc, fmtNum } = FC.util;
  const dec = Math.max(min, +(value - step).toFixed(2));
  const inc = Math.min(max, +(value + step).toFixed(2));
  return `<div class="${cx('c-stepper', hideValue && 'c-stepper--bare')}" role="group" aria-label="${esc(label || 'Quantity')}">
    <button class="c-stepper__btn" ${act(action, id, dec)} ${value <= min ? 'disabled' : ''} aria-label="Decrease">${FC.icon('minus', 18, 2.25)}</button>
    ${hideValue ? '' : `<span class="c-stepper__value"><b class="t-display">${fmtNum(value)}</b>${unit ? `<small>${esc(unit)}</small>` : ''}</span>`}
    <button class="c-stepper__btn" ${act(action, id, inc)} ${value >= max ? 'disabled' : ''} aria-label="Increase">${FC.icon('plus', 18, 2.25)}</button>
  </div>`;
};
