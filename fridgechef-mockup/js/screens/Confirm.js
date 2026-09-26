/* Confirm - "Confirm / QUANTITIES": the required gate. Every low-confidence item must be checked before
   recipes are suggested. Remembered pantry staples are listed below, auto-included. */
FC.screens.Confirm = function Confirm(state) {
  const C = FC.components, D = FC.data, L = FC.logic;
  const { plural } = FC.util;
  const order = { low: 0, med: 1, high: 2 };
  const items = state.detected.slice().sort((a, b) => (order[a.confidence] ?? 3) - (order[b.confidence] ?? 3));
  const pending = L.pendingChecks(state);
  const included = state.pantry.filter((s) => L.stapleOn(state, s)).length;

  const sliders = items.map((d) => {
    const v = L.display(d);
    return C.QuantitySlider({
      id: d.id, name: d.name, thumb: d.img, confidence: d.confidence, touched: d.touched,
      value: v.value, min: v.min, max: v.max, step: v.step, unit: v.unit, aiEstimate: d.aiEstimate != null ? v.ai : null,
      units: d.alt ? [d.unit, d.alt.unit] : null,
    });
  }).join('');

  const pantryList = state.autoInclude
    ? `<p class="t-caption">Auto-included · you don't need to scan these.</p>
       <div class="stack">${state.pantry.map((s) => C.PantryItem({ item: s, toggle: { on: !state.excluded[s.id], action: 'toggle-staple' } })).join('')}</div>`
    : C.InfoCard({ icon: 'pantry', title: 'Auto-include is off', body: 'Turn it on to count your remembered spices & basics.', footer: C.Toggle({ on: false, label: 'Auto-include pantry staples', action: 'toggle-auto' }) });

  const body = `
    ${C.TopBar({
      left: C.IconButton({ icon: 'back', label: 'Back', action: 'go', value: '#/scan' }),
      center: C.CounterPill({ icon: 'basket', value: plural(items.length, 'item') }),
      right: C.IconButton({ icon: 'plus', label: 'Add missed item', action: 'open-sheet', value: 'add-item' }),
    })}
    ${C.HeroTitle({ kicker: 'Confirm', title: 'Quantities', size: 80 })}
    <p class="t-body">Photos can be tricky. Slide to the real amount so recipes fit what you actually have.</p>
    <div class="row row--wrap">
      ${pending.length ? C.Badge({ label: `${pending.length} need a check`, dot: 'red', variant: 'alert' }) : ''}
      ${C.Badge({ label: `${items.length - pending.length} look good`, icon: 'check', variant: 'dark' })}
    </div>
    ${items.length ? `<div class="stack stack--lg">${sliders}</div>` : C.EmptyState({ icon: 'camera', title: 'Nothing found', body: 'Try another photo with better light.', actions: [{ label: 'Back to camera', variant: 'lime', action: 'go', value: '#/scan' }] })}
    ${C.PrimaryButton({ label: 'Add missed item', icon: 'plus', variant: 'outline', action: 'open-sheet', value: 'add-item' })}
    ${C.SectionHeader({
      title: 'From your pantry', count: included,
      right: C.IconButton({ icon: state.ui.pantryOpen ? 'chevronUp' : 'chevronDown', label: state.ui.pantryOpen ? 'Collapse pantry' : 'Expand pantry', action: 'toggle-pantry-open', size: 40 }),
    })}
    ${state.ui.pantryOpen ? pantryList : ''}`;

  const footer = C.PrimaryButton({
    label: pending.length ? `Check ${plural(pending.length, 'item')} first` : 'Confirm quantities',
    variant: 'lime', iconRight: pending.length ? null : 'check', disabled: pending.length > 0 || !items.length, action: 'confirm',
  });

  const available = D.addable.filter((a) => !state.detected.some((d) => d.id === a.id));
  const sheet = state.ui.sheet === 'add-item' ? C.BottomSheet({
    title: 'Add missed item',
    content: `${C.SearchField({ placeholder: 'Search ingredients', target: 'addable' })}
      <div data-filter-list="addable">${C.ChipRow({ wrap: true, chips: available.map((a) => ({ label: a.name, icon: 'plus', action: 'add-item', value: a.id })) })}</div>`,
  }) : '';

  return C.Screen({ className: 's-confirm', body, footer, overlay: sheet });
};
