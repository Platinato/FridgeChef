/* TabBar - dark rounded container of pill tabs, active = lime (reference: Lineup / Tactics / Stats / Table).
   RN: <View row> of <Pressable> (or a top-tabs navigator) */
FC.components.TabBar = function TabBar({ tabs, active, action = 'tab' }) {
  const { cx, act, esc } = FC.util;
  return `<div class="c-tabbar" role="tablist">${tabs.map((t) => `
    <button role="tab" aria-selected="${t.id === active}" class="${cx('c-tabbar__tab', t.id === active && 'is-active')}"
      ${act(action, null, t.id)}>${esc(t.label)}</button>`).join('')}
  </div>`;
};
