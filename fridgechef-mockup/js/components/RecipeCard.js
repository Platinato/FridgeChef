/* RecipeCard - a TicketCard modelled on the reference match card:
   name · time disc · photo on top; cuisine | match % | effort below the notched seam.
   Compact cards show one stat on the right: `stat` = 'match' (default) or 'effort'. RN: TicketCard composition */
FC.components.RecipeCard = function RecipeCard({ recipe, match, variant = 'lime', compact = false, stat = 'match' }) {
  const C = FC.components;
  const { esc, img } = FC.util;
  const top = `<div class="c-recipe__top">
      <h3 class="c-recipe__name t-display">${esc(recipe.name)}</h3>
      ${C.Disc({ label: `${recipe.timeMin}'`, size: compact ? 46 : 54 })}
      ${img(recipe.image, recipe.name, 'c-recipe__img')}
    </div>`;

  const effort = (extra) => `<span class="c-recipe__cell c-recipe__cell--dashed ${extra || ''}">${C.LevelBars({ level: recipe.effort, color: 'ink', size: 8 })}<small class="t-display">Effort</small></span>`;
  const missing = match.missing.map((m) => `<span class="c-recipe__miss"><i class="c-dot"></i>${esc(m.name.toLowerCase())}</span>`);
  const bottom = compact
    ? `<div class="c-recipe__meta">
        <span class="c-recipe__cell c-recipe__cell--dashed t-display">${esc(recipe.cuisine)}</span>
        ${stat === 'effort' ? effort('c-recipe__effort') : `<span class="c-recipe__pct t-display">${match.pct}%<small>match</small></span>`}
      </div>`
    : `<div class="c-recipe__stats">
        <span class="c-recipe__cell c-recipe__cell--dashed t-display">${esc(recipe.cuisine)}</span>
        <span class="c-recipe__cell c-recipe__pct t-display">${match.pct}%<small>match</small></span>
        ${effort()}
      </div>
      <p class="c-recipe__foot">${missing.length
        ? `Have ${match.have} of ${match.total} · Missing: ${missing.join('')}`
        : `${FC.icon('check', 14, 2.5)} You have everything`}</p>`;

  return C.TicketCard({
    top, bottom, variant, bottomVariant: variant === 'lime' ? 'white' : 'light',
    action: 'open-recipe', id: recipe.id, compact, label: `${recipe.name}, ${recipe.timeMin} minutes, ${match.pct}% match`,
  });
};
