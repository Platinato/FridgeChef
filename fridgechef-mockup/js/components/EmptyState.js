/* EmptyState - dashed card with an icon disc, headline, body and recovery actions. RN: <View> */
FC.components.EmptyState = function EmptyState({ icon = 'search', title, body, actions = [] }) {
  const C = FC.components;
  const { esc } = FC.util;
  return `<div class="c-empty">
    ${C.Disc({ icon, size: 64, variant: 'dark' })}
    <h3 class="t-display">${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${actions.length ? `<div class="c-empty__actions">${actions.map((a) => C.PrimaryButton(Object.assign({ full: false, size: 'sm' }, a))).join('')}</div>` : ''}
  </div>`;
};
