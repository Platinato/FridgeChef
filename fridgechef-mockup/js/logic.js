/* Domain logic: pure functions of state (future: selectors / hooks). */
FC.logic = (function () {
  const EFFORT_MAX = { minimal: 2, moderate: 3, chef: 5 };
  const ANY_DIET = ['nonveg', 'egg', 'veg', 'vegan'];
  const DIET_OK = { none: ANY_DIET, keto: ANY_DIET, protein: ANY_DIET, veg: ['veg', 'vegan'], jain: ['veg', 'vegan'], vegan: ['vegan'], egg: ['egg', 'veg', 'vegan'] };
  const ALLERGENS = {
    Dairy: ['paneer', 'yogurt', 'milk', 'cream', 'butter', 'ghee', 'cheese'],
    Eggs: ['eggs'], Gluten: ['pasta', 'bread', 'tortilla', 'atta', 'maida'], Soy: ['soy_sauce'], Nuts: [], Shellfish: [],
  };
  const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

  const recipe = (id) => FC.data.recipes.find((r) => r.id === id) || FC.data.recipes[0];
  const snap = (v, step) => Math.round(v / step) * step;

  function fmtQty(v, unit) {
    const n = Math.round(v * 100) / 100;
    const whole = Math.floor(n);
    const frac = FRACTIONS[Math.round((n - whole) * 100) / 100];
    return `${frac ? (whole || '') + frac : n} ${unit}`;
  }

  // Value + range of a detected item in whichever unit the user is viewing it in
  function display(d) {
    if (!d.alt || d.displayUnit !== d.alt.unit) {
      return { value: d.value, min: d.min, max: d.max, step: d.step, unit: d.unit, ai: d.aiEstimate };
    }
    const f = d.alt.factor, s = d.alt.step;
    return { value: snap(d.value / f, s), min: snap(d.min / f, s), max: snap(d.max / f, s), step: s, unit: d.alt.unit, ai: snap(d.aiEstimate / f, s) };
  }

  const pendingChecks = (state) => state.detected.filter((d) => d.confidence === 'low' && !d.touched);
  const isLow = (s) => s.level <= s.lowThreshold;
  const lowStaples = (state) => state.pantry.filter(isLow);
  const stapleOn = (state, s) => state.autoInclude && !state.excluded[s.id] && s.level > 0;

  // One recipe ingredient vs. the user's confirmed kitchen
  function ingredientStatus(state, ing, k) {
    const need = ing.qty * k;
    const d = state.detected.find((x) => x.id === ing.id);
    if (d) return { kind: 'detected', name: d.name, img: d.img, need, have: d.value, status: d.value >= need ? 'have' : d.value > 0 ? 'short' : 'missing' };
    const s = state.pantry.find((x) => x.id === ing.id);
    if (s) return { kind: 'staple', name: s.name, need, status: stapleOn(state, s) ? 'pantry' : 'missing' };
    const extra = FC.data.addable.find((x) => x.id === ing.id);
    return { kind: 'extra', name: extra ? extra.name : ing.id, need, status: 'missing' };
  }

  function match(state, r) {
    const k = state.prefs.servings / r.servings;
    const rows = r.ingredients.map((i) => Object.assign({}, i, ingredientStatus(state, i, k)));
    const have = rows.filter((x) => x.status === 'have' || x.status === 'pantry').length;
    const missing = rows.filter((x) => x.status === 'missing' || x.status === 'short');
    return { rows, have, total: rows.length, pct: Math.round((have / rows.length) * 100), missing };
  }

  function passes(state, r) {
    const p = state.prefs;
    if (r.timeMin > p.time || r.effort > EFFORT_MAX[p.effort]) return false;
    if (!r.equipment.every((e) => p.equipment.includes(e))) return false;
    if (!(DIET_OK[p.diet] || ANY_DIET).includes(r.diet)) return false;
    if (!p.cuisines.includes('Any') && !p.cuisines.includes(r.cuisine)) return false;
    const banned = state.user.allergies.flatMap((a) => ALLERGENS[a] || []);
    return !r.ingredients.some((i) => banned.includes(i.id));
  }

  // "Best match" = how much you already have, nudged by mood, hunger, spice and diet goals
  function score(state, r, m) {
    const p = state.prefs;
    let s = m.pct;
    if (r.moods.includes(p.mood)) s += 15;
    if (p.hunger === 'snack' && r.kcal < 420) s += 8;
    if (p.hunger === 'starving' && r.kcal >= 500) s += 8;
    if (Math.abs(r.spice - p.spice) <= 1) s += 5;
    if (p.diet === 'protein' && r.protein >= 25) s += 10;
    if (p.diet === 'keto' && r.carbs <= 20) s += 10;
    return s;
  }

  const FILTERS = {
    all: () => true, everything: (r, m) => m.pct === 100, quick: (r) => r.timeMin <= 20,
    onepan: (r) => r.onePan, protein: (r) => r.protein >= 25,
  };
  const SORTS = {
    best: (a, b) => b.score - a.score, quick: (a, b) => a.recipe.timeMin - b.recipe.timeMin,
    effort: (a, b) => a.recipe.effort - b.recipe.effort, protein: (a, b) => b.recipe.protein - a.recipe.protein,
  };

  function suggestions(state) {
    return FC.data.recipes
      .filter((r) => passes(state, r))
      .map((r) => { const m = match(state, r); return { recipe: r, match: m, score: score(state, r, m) }; })
      .filter((x) => FILTERS[state.filter](x.recipe, x.match))
      .sort(SORTS[state.sort]);
  }

  // Default "what did you use" amounts for the post-cook pantry update
  function defaultUsed(state, r) {
    const used = {};
    match(state, r).rows.forEach((row) => {
      if (row.kind === 'detected' && row.status !== 'missing') used[row.id] = Math.min(row.need, row.have);
      if (row.kind === 'staple' && row.status === 'pantry') used[row.id] = row.need;
    });
    return used;
  }

  function lastScanLabel(state) {
    const d = FC.util.daysSince(state.lastScan.at);
    const when = d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
    return `${when} · ${state.lastScan.items} items`;
  }

  const effortLabel = (level) => (level <= 1 ? 'Minimal' : level <= 3 ? 'Moderate' : 'Chef mode');

  return {
    recipe, fmtQty, display, pendingChecks, isLow, lowStaples, stapleOn, match, suggestions,
    defaultUsed, lastScanLabel, effortLabel, EFFORT_MAX,
  };
})();
