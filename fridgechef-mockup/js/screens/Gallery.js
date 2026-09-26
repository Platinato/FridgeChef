/* Gallery (#/gallery) - every screen side by side in scaled phone frames, like a Dribbble shot.
   Frames are static snapshots rendered from the current state with small per-frame patches. */
FC.screens.Gallery = function Gallery(state) {
  const L = FC.logic;
  const { esc, act } = FC.util;
  const rid = 'butter-chicken';
  const frames = [
    { label: 'Onboarding', route: '#/onboarding', ui: { onbStep: 0 } },
    { label: 'Taste setup', route: '#/onboarding', ui: { onbStep: 3 } },
    { label: 'Home', route: '#/home' },
    { label: 'Scan', route: '#/scan' },
    { label: 'Gallery upload', route: '#/scan', ui: { sheet: 'picker', picker: ['lib4', 'lib6'] } },
    { label: 'Analyzing', route: '#/analyzing', ui: { found: 8 } },
    { label: 'Confirm quantities', route: '#/confirm' },
    { label: 'Your mood', route: '#/mood' },
    { label: 'Suggestions', route: '#/suggestions' },
    { label: 'Recipe · ingredients', route: `#/recipe/${rid}`, ui: { recipeTab: 'ingredients' } },
    { label: 'Recipe · steps', route: `#/recipe/${rid}`, ui: { recipeTab: 'steps' } },
    { label: 'Cook mode', route: `#/cook/${rid}`, ui: { cookStep: 1, timer: null } },
    { label: 'Done → update pantry', route: `#/cook/${rid}`, ui: { cookStep: 4, sheet: 'done', used: L.defaultUsed(state, L.recipe(rid)) } },
    { label: 'Pantry', route: '#/pantry' },
    { label: 'Edit staple', route: '#/pantry', ui: { sheet: 'staple:garam_masala' } },
    { label: 'Saved & profile', route: '#/saved' },
    { label: 'Empty: no matches', route: '#/suggestions', patch: { prefs: Object.assign({}, state.prefs, { time: 10, effort: 'minimal', cuisines: ['Thai'] }) } },
  ];

  const render = (f) => {
    const route = FC.router.parse(f.route);
    const ui = Object.assign({}, state.ui, { sheet: null, toast: null }, f.ui || {});
    const s = Object.assign({}, state, f.patch || {}, { ui });
    return FC.phone(FC.screens[route.screen](s, route.params));
  };

  return `<header class="gallery__head">
      ${FC.components.AppLogo({ size: 64 })}
      <h1 class="gallery__title">FridgeChef - all screens</h1>
      <p class="gallery__sub">${frames.length} frames · tap any frame to open it in the live prototype</p>
    </header>
    <div class="gallery__grid">${frames.map((f, i) => `
      <div class="gallery__item" role="button" tabindex="0" ${act('gallery-open', JSON.stringify(f.ui || {}), f.route)} aria-label="Open ${esc(f.label)}">
        <div class="gallery__frame">${render(f)}</div>
        <span class="gallery__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="gallery__label">${esc(f.label)}</span>
      </div>`).join('')}
    </div>`;
};
