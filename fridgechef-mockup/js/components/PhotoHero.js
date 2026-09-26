/* PhotoHero - full-bleed photo with the dark-green fade and an overlay slot for controls/titles.
   `fill` covers the whole screen (camera feed). Follow it with <div class="c-photohero__after"> to carry the
   green fade into the content below. RN: <ImageBackground> + <LinearGradient> */
FC.components.PhotoHero = function PhotoHero({ src, alt, height = 440, fill = false, fade = true, children = '' }) {
  const { cx, img } = FC.util;
  return `<div class="${cx('c-photohero', fill && 'c-photohero--fill')}" ${fill ? '' : `style="height:${height}px"`}>
    ${img(src, alt, 'c-photohero__img')}
    ${fade ? '<div class="c-photohero__fade"></div>' : ''}
    <div class="c-photohero__content">${children}</div>
  </div>`;
};
