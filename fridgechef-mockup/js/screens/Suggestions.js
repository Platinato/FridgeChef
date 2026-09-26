/* Suggestions - "For you / TONIGHT": ranked RecipeCards with filters, sort sheet and an empty state. */
FC.screens.Suggestions = function Suggestions(state) {
  const C = FC.components, D = FC.data, L = FC.logic;
  const { plural } = FC.util;
  const p = state.prefs;
  const list = L.suggestions(state);
  const mood = D.moods.find((m) => m.id === p.mood);
  const context = `${mood ? mood.label : 'Any mood'} · ${p.time} min · ${D.efforts.find((e) => e.value === p.effort).label} · ${plural(p.servings, 'serving')}`;

  const cards = list.length
    ? `<div class="stack stack--lg">${list.map((x, i) => C.RecipeCard({ recipe: x.recipe, match: x.match, variant: i % 2 ? 'light' : 'lime' })).join('')}</div>`
    : C.EmptyState({
      icon: 'search', title: 'No matches', body: 'Nothing fits all of that right now. Loosen a filter or give yourself a bit more time.',
      actions: [
        { label: 'Loosen filters', variant: 'lime', action: 'loosen' },
        { label: 'Add 30 min', variant: 'outline', action: 'more-time' },
      ],
    });

  const body = `
    ${C.TopBar({
      left: C.IconButton({ icon: 'back', label: 'Back', action: 'go', value: '#/mood' }),
      center: C.LiveBadge({ label: `${list.length} ${list.length === 1 ? 'match' : 'matches'}` }),
      right: C.IconButton({ icon: 'sort', label: 'Sort', action: 'open-sheet', value: 'sort' }),
    })}
    ${C.HeroTitle({ kicker: 'For you', title: 'Tonight' })}
    ${C.ListRow({ label: context, detail: 'Edit', icon: 'edit', action: 'go', value: '#/mood' })}
    ${C.ChipRow({ key: 'filters', chips: D.filters.map((f) => ({ label: f.label, active: state.filter === f.value, action: 'set-filter', value: f.value })) })}
    ${cards}`;

  const sheet = state.ui.sheet === 'sort' ? C.BottomSheet({
    title: 'Sort by',
    content: `<div class="stack">${D.sorts.map((s) => C.ListRow({
      label: s.label, action: 'set-sort', value: s.value,
      right: state.sort === s.value ? C.Disc({ icon: 'check', size: 28, variant: 'lime' }) : '',
    })).join('')}</div>`,
  }) : '';

  return C.Screen({ className: 's-sugg', body, overlay: sheet });
};
