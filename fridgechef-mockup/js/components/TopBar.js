/* TopBar - left / center / right slots (reference: back disc · 👁 14.5k + Live · more disc).
   `overlay` pins it over full-bleed media. RN: <View row> header */
FC.components.TopBar = function TopBar({ left = '', center = '', right = '', overlay = false }) {
  const { cx } = FC.util;
  return `<div class="${cx('c-topbar', overlay && 'c-topbar--overlay')}">
    <div class="c-topbar__side">${left}</div>
    <div class="c-topbar__center">${center}</div>
    <div class="c-topbar__side c-topbar__side--right">${right}</div>
  </div>`;
};
