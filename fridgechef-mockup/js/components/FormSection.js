/* FormSection - labelled group of inputs with an optional hint and right-hand slot. RN: <View> */
FC.components.FormSection = function FormSection({ title, hint, right = '', content = '' }) {
  const { esc } = FC.util;
  return `<section class="c-form">
    <header class="c-form__head">
      <div class="grow"><h2 class="t-display">${esc(title)}</h2>${hint ? `<p>${esc(hint)}</p>` : ''}</div>
      ${right}
    </header>
    ${content}
  </section>`;
};
