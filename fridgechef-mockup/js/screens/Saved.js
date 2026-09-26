/* Saved / Profile - saved recipes plus diet, allergies, household, effort and unit settings. */
FC.screens.Saved = function Saved(state) {
  const C = FC.components, D = FC.data, L = FC.logic;
  const u = state.user;
  const saved = state.saved.map((id) => D.recipes.find((r) => r.id === id)).filter(Boolean);
  const diet = D.diets.find((d) => d.id === u.diet);

  const body = `
    ${C.TopBar({ left: C.AppLogo({ size: 50 }), right: C.IconButton({ icon: 'user', label: `Signed in as ${u.name}`, action: 'toast', value: `Hi ${u.name}!` }) })}
    ${C.HeroTitle({ kicker: 'My', title: 'Cookbook' })}
    ${C.SectionHeader({ title: 'Saved recipes', count: saved.length })}
    ${saved.length
      ? `<div class="stack stack--lg">${saved.map((r, i) => C.RecipeCard({ recipe: r, match: L.match(state, r), variant: i % 2 ? 'lime' : 'light', compact: true, stat: 'effort' })).join('')}</div>`
      : C.EmptyState({ icon: 'heart', title: 'Nothing saved', body: 'Tap the heart on any recipe to keep it here.', actions: [{ label: 'Find recipes', variant: 'lime', action: 'go', value: '#/scan' }] })}
    ${C.SectionHeader({ title: 'Profile' })}
    <div class="stack">
      ${C.ListRow({ icon: 'leaf', label: 'Diet', detail: diet ? diet.label : 'None', action: 'open-sheet', value: 'profile-diet' })}
      ${C.ListRow({ icon: 'alert', label: 'Allergies', detail: u.allergies.join(', ') || 'None', action: 'open-sheet', value: 'profile-allergies' })}
      ${C.ListRow({ icon: 'user', label: 'Household', right: C.Stepper({ value: u.householdSize, min: 1, max: 8, action: 'set-household', label: 'Household size' }) })}
    </div>
    ${C.FormSection({ title: 'Default effort', content: C.SegmentedControl({ options: D.efforts.map((e) => ({ value: e.value, label: e.label })), value: u.defaultEffort, action: 'set-user', id: 'defaultEffort' }) })}
    ${C.FormSection({ title: 'Units', content: C.SegmentedControl({ options: [{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }], value: u.units, action: 'set-user', id: 'units' }) })}
    <div class="stack">
      ${C.ListRow({ icon: 'flip', label: 'Replay onboarding', action: 'replay-onboarding' })}
      ${C.ListRow({ icon: 'trash', label: 'Reset demo data', action: 'reset-demo', danger: true })}
    </div>`;

  let sheet = '';
  if (state.ui.sheet === 'profile-diet') {
    sheet = C.BottomSheet({ title: 'Diet', content: C.ChipRow({ wrap: true, chips: D.diets.map((d) => ({ label: d.label, active: u.diet === d.id, action: 'set-diet', value: d.id })) }) });
  } else if (state.ui.sheet === 'profile-allergies') {
    sheet = C.BottomSheet({
      title: 'Allergies',
      content: `<p class="t-caption">Recipes containing these are never suggested.</p>${C.ChipRow({ wrap: true, chips: D.allergies.map((a) => ({ label: a, active: u.allergies.includes(a), icon: u.allergies.includes(a) ? 'check' : null, action: 'toggle-allergy', value: a })) })}`,
    });
  }

  return C.Screen({ className: 's-saved', body, nav: 'saved', overlay: sheet });
};
