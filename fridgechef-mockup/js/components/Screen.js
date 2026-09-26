/* Screen - the shell every screen renders into: scroll body, optional sticky footer (CTA),
   optional floating BottomNav and overlays (sheets). RN: <SafeAreaView> + <ScrollView> + absolute footer */
FC.components.Screen = function Screen({
  body, footer, footerVariant, nav, overlay = '', className = '', flush = false, scroll = true,
}) {
  const { cx } = FC.util;
  return `<div class="${cx('c-screen', className, footer && 'has-footer', nav && 'has-nav')}">
    <div class="${cx('c-screen__scroll no-scrollbar', flush && 'is-flush', !scroll && 'is-fixed')}" data-keep-scroll="screen">${body}</div>
    ${footer ? `<div class="${cx('c-screen__footer', footerVariant && 'c-screen__footer--' + footerVariant)}">${footer}</div>` : ''}
    ${nav ? FC.components.BottomNav({ active: nav }) : ''}
    ${overlay}
  </div>`;
};
