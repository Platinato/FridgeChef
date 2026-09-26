/* IngredientRow - recipe ingredient with have / short / missing / pantry status. RN: <View row> */
FC.components.IngredientRow = function IngredientRow({ name, qty, status, thumb, note }) {
  const C = FC.components;
  const { esc, img, initials } = FC.util;
  const tag = {
    have: C.Badge({ label: 'Have', icon: 'check', variant: 'lime', size: 'sm' }),
    pantry: C.Badge({ label: 'Pantry', variant: 'dark', size: 'sm' }),
    short: C.Badge({ label: 'Short', dot: 'red', variant: 'alert', size: 'sm' }),
    missing: C.Badge({ label: 'Missing', dot: 'red', variant: 'alert', size: 'sm' }),
  }[status];
  return `<div class="c-ingrow">
    ${thumb ? img(thumb, name, 'c-ingrow__thumb') : `<span class="c-ingrow__thumb c-ingrow__thumb--init">${initials(name)}</span>`}
    <div class="c-ingrow__text">
      <span class="c-ingrow__name">${esc(name)}</span>
      ${note ? `<span class="c-ingrow__note">${esc(note)}</span>` : ''}
    </div>
    <span class="c-ingrow__qty t-display">${esc(qty)}</span>
    ${tag}
  </div>`;
};
