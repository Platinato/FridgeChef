/* QuantitySlider - the "confirm the real amount" card. Composes RangeSlider (bare) with the AI-estimate
   marker, Stepper for fine steps, a unit switcher and a remove action. Low-confidence items stay flagged
   until the user drags, steps or taps "Looks right". RN: <View> + Slider + Stepper */
FC.components.QuantitySlider = function QuantitySlider(p) {
  const C = FC.components;
  const { cx, esc, img, fmtNum } = FC.util;
  const flagged = p.confidence === 'low' && !p.touched;
  const confLabel = { high: 'Sure', med: 'Fairly sure', low: 'Unsure' }[p.confidence] || 'Added by you';
  const status = flagged
    ? C.Badge({ label: 'Please check', dot: 'red', variant: 'alert', size: 'sm' })
    : p.touched
      ? C.Badge({ label: 'Confirmed', icon: 'check', variant: 'lime', size: 'sm' })
      : C.Badge({ label: confLabel, variant: 'dark', size: 'sm' });

  return `<article class="${cx('c-qty', flagged && 'is-flagged', p.touched && 'is-done')}">
    <header class="c-qty__head">
      ${p.thumb ? img(p.thumb, p.name, 'c-qty__thumb') : `<span class="c-qty__thumb img-fallback">${FC.util.initials(p.name)}</span>`}
      <div class="c-qty__title"><h3 class="t-display">${esc(p.name)}</h3>${status}</div>
      <div class="c-qty__value"><b class="t-display" data-live-value="${esc(p.id)}">${fmtNum(p.value)}</b><small class="t-display">${esc(p.unit)}</small></div>
    </header>
    ${C.RangeSlider({
      bare: true, min: p.min, max: p.max, step: p.step, value: p.value, action: 'qty-slide', id: p.id,
      label: `${p.name} quantity in ${p.unit}`,
      marker: p.aiEstimate != null ? { value: p.aiEstimate, label: fmtNum(p.aiEstimate) } : null,
      minLabel: `${fmtNum(p.min)} ${p.unit}`, maxLabel: `${fmtNum(p.max)} ${p.unit}`,
    })}
    <footer class="c-qty__foot">
      ${C.Stepper({ value: p.value, min: p.min, max: p.max, step: p.step, action: 'qty-step', id: p.id, label: p.name, hideValue: true })}
      ${p.units ? C.SegmentedControl({ options: p.units.map((u) => ({ value: u, label: u })), value: p.unit, action: 'qty-unit', id: p.id, size: 'sm' }) : ''}
      <span class="grow"></span>
      ${C.IconButton({ icon: 'trash', label: `Remove ${p.name}`, action: 'qty-remove', id: p.id, variant: 'ghost', size: 40 })}
    </footer>
    ${flagged ? C.PrimaryButton({ label: 'Looks right', icon: 'check', variant: 'lime', size: 'sm', action: 'qty-ok', id: p.id }) : ''}
  </article>`;
};
