/* Home - "Explore / RECIPES": mood chips, scan hero ticket, running-low staples, cook-again cards. */
FC.screens.Home = function Home(state) {
  const C = FC.components, D = FC.data, L = FC.logic;
  const { esc, plural } = FC.util;
  const low = L.lowStaples(state);
  const recent = state.cooked.map((id) => D.recipes.find((r) => r.id === id)).filter(Boolean).slice(0, 2);

  const scanCard = C.TicketCard({
    variant: 'lime', bottomVariant: 'white', action: 'go', value: '#/scan', label: 'Scan your kitchen',
    top: `<div class="s-home__scan-top">
        <h2 class="t-display">What's in<br>your kitchen?</h2>
        ${C.Disc({ icon: 'camera', size: 64 })}
      </div>`,
    bottom: `<div class="s-home__scan-bottom">
        <div><span class="t-micro">Last scan</span><b class="t-display">${esc(L.lastScanLabel(state))}</b></div>
        ${C.PrimaryButton({ label: 'Scan now', variant: 'black', size: 'sm', full: false, action: 'go', value: '#/scan' })}
      </div>`,
  });

  const body = `
    ${C.TopBar({
      left: C.AppLogo({ size: 50 }),
      right: C.IconButton({ icon: 'search', label: 'Search recipes', action: 'soon' }) +
        C.IconButton({ icon: 'bell', label: 'Notifications', badge: low.length > 0, action: 'toast', value: `${plural(low.length, 'staple')} running low` }),
    })}
    ${C.HeroTitle({ kicker: 'Explore', title: 'Recipes' })}
    ${C.ChipRow({ key: 'moods', chips: D.moods.map((m) => ({ label: m.label, icon: m.icon, active: state.prefs.mood === m.id, action: 'set-mood', value: m.id })) })}
    ${scanCard}
    ${low.length ? `
      ${C.SectionHeader({ title: 'Running low', dot: true, count: low.length, actionLabel: 'See all', action: 'go', value: '#/pantry' })}
      <div class="s-home__low no-scrollbar" data-keep-scroll="low">${low.map((s) => C.PantryItem({ item: s, variant: 'card', action: 'open-staple-from-home' })).join('')}</div>` : ''}
    ${C.SectionHeader({ title: 'Cook again', actionLabel: 'Saved', action: 'go', value: '#/saved' })}
    <div class="stack stack--lg">${recent.map((r, i) => C.RecipeCard({ recipe: r, match: L.match(state, r), variant: i % 2 ? 'lime' : 'light', compact: true })).join('')}</div>`;

  return C.Screen({ className: 's-home', body, nav: 'home' });
};
