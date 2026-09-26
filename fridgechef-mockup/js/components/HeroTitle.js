/* HeroTitle - signature two-line header: small grey kicker over a huge condensed word.
   `right` is an optional slot (avatars, counters). RN: <View><Text/><Text/></View> */
FC.components.HeroTitle = function HeroTitle({ kicker, title, right = '', size = 84 }) {
  const { esc } = FC.util;
  return `<div class="c-hero">
    <div class="c-hero__text">
      <div class="c-hero__kicker">${esc(kicker)}</div>
      <h1 class="c-hero__title t-display" style="font-size:${size}px">${esc(title)}</h1>
    </div>
    ${right ? `<div class="c-hero__right">${right}</div>` : ''}
  </div>`;
};
