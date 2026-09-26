/* Pantry - "My / PANTRY": remembered staples with stock levels, categories, edit + add sheets. */
FC.screens.Pantry = function Pantry(state) {
  const C = FC.components, D = FC.data, L = FC.logic;
  const { esc, timeAgo, plural } = FC.util;
  const cat = state.ui.pantryCat;
  const list = state.pantry.filter((s) => cat === 'All' || s.category === cat);
  const low = list.filter(L.isLow);
  const rows = (items) => `<div class="stack">${items.map((s) => C.PantryItem({ item: s })).join('')}</div>`;

  const body = `
    ${C.TopBar({
      left: C.AppLogo({ size: 50 }),
      right: C.IconButton({ icon: 'plus', label: 'Add staple', action: 'open-sheet', value: 'add-staple', variant: 'lime' }),
    })}
    ${C.HeroTitle({ kicker: 'My', title: 'Pantry', right: C.CounterPill({ icon: 'pantry', value: plural(state.pantry.length, 'staple') }) })}
    ${C.InfoCard({
      title: 'Staples are remembered',
      body: 'Spices, oils & basics used in small amounts are tracked here and auto-included in every scan.',
      footer: C.Toggle({ on: state.autoInclude, label: 'Auto-include in scans', sub: 'Counted in every recipe match', action: 'toggle-auto' }),
    })}
    ${C.ChipRow({ key: 'cats', chips: D.pantryCategories.map((c) => ({ label: c, active: cat === c, action: 'pantry-cat', value: c })) })}
    ${low.length ? C.SectionHeader({ title: 'Running low', dot: true, count: low.length }) + rows(low) : ''}
    ${C.SectionHeader({ title: cat === 'All' ? 'All staples' : cat, count: list.length })}
    ${list.length ? rows(list.filter((s) => !L.isLow(s))) : C.EmptyState({ icon: 'pantry', title: 'Nothing here', body: 'Add a staple to start tracking it.', actions: [{ label: 'Add staple', variant: 'lime', action: 'open-sheet', value: 'add-staple' }] })}`;

  let sheet = '';
  const sheetId = state.ui.sheet || '';
  if (sheetId.startsWith('staple:')) {
    const s = state.pantry.find((x) => x.id === sheetId.slice(7));
    if (s) {
      sheet = C.BottomSheet({
        title: s.name,
        content: `
          <div class="s-pantry__level"><b class="t-display">${Math.round(s.level)}</b><span class="t-display">/ 5 left</span></div>
          ${C.LevelBars({ level: s.level, size: 52, action: 'staple-level', id: s.id, label: `Set ${esc(s.name)} level` })}
          <div class="row row--between t-caption"><span>Empty</span><span>Full</span></div>
          ${C.ListRow({ label: 'Pack size', detail: s.unitHint, icon: 'pantry' })}
          ${C.ListRow({ label: 'Last updated', detail: timeAgo(s.updatedAt), icon: 'clock' })}`,
        footer: C.PrimaryButton({ label: 'Remove', variant: 'danger', icon: 'trash', action: 'staple-remove', id: s.id }) +
          C.PrimaryButton({ label: 'Mark refilled', variant: 'lime', icon: 'check', action: 'staple-refill', id: s.id }),
      });
    }
  } else if (sheetId === 'add-staple') {
    const options = D.stapleSuggestions.filter((o) => !state.pantry.some((s) => s.name === o.name));
    sheet = C.BottomSheet({
      title: 'Add a staple',
      content: `${C.SearchField({ placeholder: 'Search staples', target: 'staples' })}
        <div data-filter-list="staples">${C.ChipRow({ wrap: true, chips: options.map((o) => ({ label: o.name, icon: 'plus', action: 'add-staple', value: o.name })) })}</div>`,
    });
  }

  return C.Screen({ className: 's-pantry', body, nav: 'pantry', overlay: sheet });
};
