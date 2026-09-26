/* StepTimeline - numbered nodes linked by curved dashed connectors (the reference's tactics lines).
   RN: <View> rows + react-native-svg <Path strokeDasharray> */
FC.components.StepTimeline = function StepTimeline({ steps, active = 0 }) {
  const { cx, esc } = FC.util;
  const link = '<svg class="c-steps__link" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M12 0 C 28 30, -4 62, 12 100" vector-effect="non-scaling-stroke"/></svg>';
  return `<ol class="c-steps">${steps.map((s, i) => `
    <li class="${cx('c-steps__item', i === active && 'is-active')}">
      <div class="c-steps__rail"><span class="c-steps__node t-display">${i + 1}</span>${i < steps.length - 1 ? link : ''}</div>
      <div class="c-steps__body">
        <p>${esc(s.text)}</p>
        ${FC.components.Badge({ label: `${s.minutes} min`, icon: 'clock', variant: 'dark', size: 'sm' })}
      </div>
    </li>`).join('')}
  </ol>`;
};
