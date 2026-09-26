/* PaginationDots - onboarding progress; active dot stretches into a lime pill. RN: <View row> */
FC.components.PaginationDots = function PaginationDots({ count, active }) {
  const dots = Array.from({ length: count }, (_, i) => `<i class="${i === active ? 'is-on' : ''}"></i>`).join('');
  return `<div class="c-dots" role="img" aria-label="Step ${active + 1} of ${count}">${dots}</div>`;
};
