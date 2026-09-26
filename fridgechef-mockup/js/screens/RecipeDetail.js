/* RecipeDetail - photo hero, stat tiles and tabs (Ingredients / Steps / Nutrition / Swaps). */
FC.screens.RecipeDetail = function RecipeDetail(state, params) {
  const C = FC.components, L = FC.logic;
  const { esc } = FC.util;
  const r = L.recipe(params.id);
  const m = L.match(state, r);
  const saved = state.saved.includes(r.id);
  const tab = state.ui.recipeTab;

  const hero = C.PhotoHero({
    src: r.image, alt: r.name, height: 470,
    children: `
      ${C.TopBar({
        left: C.IconButton({ icon: 'back', label: 'Back', action: 'go', value: '#/suggestions', variant: 'glass' }),
        right: C.IconButton({ icon: saved ? 'heartFill' : 'heart', label: saved ? 'Remove from saved' : 'Save recipe', action: 'save', id: r.id, variant: saved ? 'lime' : 'glass' }),
      })}
      <div class="s-recipe__title">
        <h1 class="t-display">${esc(r.name)}</h1>
        <p>${esc(r.cuisine)} · ${L.effortLabel(r.effort)} · Serves ${state.prefs.servings}</p>
      </div>`,
  });

  const panes = {
    ingredients: () => `
      ${C.FormSection({ title: `${m.have} of ${m.total} in your kitchen`, right: C.Stepper({ value: state.prefs.servings, min: 1, max: 8, action: 'pref-num', id: 'servings', label: 'Servings', unit: 'ppl' }) })}
      <div>${m.rows.map((row) => C.IngredientRow({
        name: row.name, qty: L.fmtQty(row.need, row.unit), status: row.status, thumb: row.img,
        note: row.kind === 'staple' ? (row.status === 'pantry' ? 'From your pantry' : 'Not in pantry')
          : row.kind === 'detected' ? `You have ${L.fmtQty(row.have, row.unit)}`
            : (r.swaps.find((s) => s.missing.toLowerCase() === row.name.toLowerCase()) || {}).use || 'Not in your kitchen',
      })).join('')}</div>`,
    steps: () => C.StepTimeline({ steps: r.steps }),
    nutrition: () => `
      ${C.FormSection({ title: 'Per serving', hint: `${r.kcal} kcal · macros vs. a typical meal` })}
      ${C.ProgressBar({ label: 'Protein', caption: `${r.protein} g`, value: r.protein, max: 60 })}
      ${C.ProgressBar({ label: 'Carbs', caption: `${r.carbs} g`, value: r.carbs, max: 90, variant: 'soft' })}
      ${C.ProgressBar({ label: 'Fat', caption: `${r.fat} g`, value: r.fat, max: 45, variant: 'white' })}`,
    swaps: () => (r.swaps.length
      ? r.swaps.map((s) => C.InfoCard({ icon: 'swap', title: `No ${s.missing.toLowerCase()}?`, body: s.use })).join('')
      : C.EmptyState({ icon: 'check', title: 'No swaps needed', body: 'You have everything this one needs.' })),
  };

  const body = `${hero}
    <div class="c-photohero__after">
      ${C.StatTileRow({ tiles: [
        { value: String(r.timeMin), caption: 'min', variant: 'lime' },
        { value: String(r.kcal), caption: 'kcal', variant: 'white' },
        { value: `${r.protein}g`, caption: 'protein', variant: 'soft' },
      ] })}
      ${C.TabBar({ tabs: [{ id: 'ingredients', label: 'Ingredients' }, { id: 'steps', label: 'Steps' }, { id: 'nutrition', label: 'Nutrition' }, { id: 'swaps', label: 'Swaps' }], active: tab })}
      <div class="stack stack--lg">${(panes[tab] || panes.ingredients)()}</div>
    </div>`;

  return C.Screen({
    className: 's-recipe', flush: true, body, footerVariant: 'lime',
    footer: C.PrimaryButton({ label: 'Start cooking', variant: 'black', action: 'start-cook', id: r.id }),
  });
};
