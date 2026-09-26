/* SectionHeader - condensed section label with optional red dot, count and a "See all" action or custom `right` slot.
   RN: <View row> */
FC.components.SectionHeader = function SectionHeader({ title, actionLabel, action = 'soon', value, dot = false, count, right = '' }) {
  const { act, esc } = FC.util;
  return `<div class="c-section">
    <h2 class="c-section__title t-display">${dot ? '<i class="c-dot"></i>' : ''}${esc(title)}${count != null ? `<span class="c-section__count">${count}</span>` : ''}</h2>
    ${actionLabel ? `<button class="c-section__action" ${act(action, null, value)}>${esc(actionLabel)}</button>` : right}
  </div>`;
};
