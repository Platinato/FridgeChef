/* Toggle - iOS-style switch, lime when on. `bare` renders the switch alone. RN: <Switch> */
FC.components.Toggle = function Toggle({ on = false, label, sub, action = 'soon', id, bare = false }) {
  const { cx, act, esc } = FC.util;
  const sw = `<span class="${cx('c-toggle__switch', on && 'is-on')}"><i></i></span>`;
  if (bare) {
    return `<button class="c-toggle c-toggle--bare" role="switch" aria-checked="${on}" aria-label="${esc(label)}" ${act(action, id)}>${sw}</button>`;
  }
  return `<button class="c-toggle" role="switch" aria-checked="${on}" ${act(action, id)}>
    <span class="c-toggle__text"><span class="c-toggle__label">${esc(label)}</span>${sub ? `<span class="c-toggle__sub">${esc(sub)}</span>` : ''}</span>
    ${sw}
  </button>`;
};
