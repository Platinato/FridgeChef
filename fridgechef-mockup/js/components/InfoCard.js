/* InfoCard - icon disc + title/body, with optional `right` action and `footer` row.
   variant: dark | lime | glass | alert. RN: <View> */
FC.components.InfoCard = function InfoCard({ icon, title, body, right = '', footer = '', variant = 'dark' }) {
  const { esc } = FC.util;
  const disc = icon ? FC.components.Disc({ icon, size: 40, variant: variant === 'lime' ? 'ink' : variant === 'alert' ? 'dark' : 'lime' }) : '';
  return `<div class="c-info c-info--${variant}">
    <div class="c-info__row">
      ${disc}
      <div class="c-info__text"><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}</div>
      ${right ? `<div class="c-info__right">${right}</div>` : ''}
    </div>
    ${footer ? `<div class="c-info__foot">${footer}</div>` : ''}
  </div>`;
};
