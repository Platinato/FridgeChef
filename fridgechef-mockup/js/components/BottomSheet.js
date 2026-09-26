/* BottomSheet - scrim + slide-up panel with grab handle, title, scrollable body and optional footer.
   RN: @gorhom/bottom-sheet */
FC.components.BottomSheet = function BottomSheet({ title, content, footer, closeAction = 'close-sheet', tall = false }) {
  const { cx, act, esc } = FC.util;
  return `<div class="c-scrim" ${act(closeAction)}></div>
  <section class="${cx('c-sheet', tall && 'c-sheet--tall')}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <i class="c-sheet__grab" aria-hidden="true"></i>
    <header class="c-sheet__head">
      <h2 class="t-display">${esc(title)}</h2>
      ${FC.components.IconButton({ icon: 'close', label: 'Close', action: closeAction, size: 40 })}
    </header>
    <div class="c-sheet__body no-scrollbar" data-keep-scroll="sheet">${content}</div>
    ${footer ? `<footer class="c-sheet__foot">${footer}</footer>` : ''}
  </section>`;
};
