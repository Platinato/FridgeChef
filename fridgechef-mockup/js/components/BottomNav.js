/* BottomNav - floating black pill; active tab is a wide lime pill. RN: custom tabBar for bottom tabs */
FC.components.BottomNav = function BottomNav({ active }) {
  const { cx, act } = FC.util;
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home', path: '#/home' },
    { id: 'scan', icon: 'camera', label: 'Scan', path: '#/scan' },
    { id: 'pantry', icon: 'pantry', label: 'Pantry', path: '#/pantry' },
    { id: 'saved', icon: 'bookmark', label: 'Saved', path: '#/saved' },
  ];
  return `<nav class="c-nav" aria-label="Main">${tabs.map((t) => `
    <button class="${cx('c-nav__item', t.id === active && 'is-active')}" ${act('go', null, t.path)}
      aria-label="${t.label}" ${t.id === active ? 'aria-current="page"' : ''}>${FC.icon(t.icon, 22)}</button>`).join('')}
  </nav>`;
};
