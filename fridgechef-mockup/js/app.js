/* App shell: phone frame, render loop, one delegated event handler, the actions map
   (future: navigation + onPress handlers) and route-bound timers. Loaded last. */
(function () {
  const { store, router, logic: L, data: D } = FC;
  const { clamp, plural, slug, act, cx } = FC.util;
  const $ = (sel) => document.querySelector(sel);
  const ui = () => store.getState().ui;
  const upd = (fn, opts) => store.update(fn, opts);
  const now = () => new Date().toISOString();

  // ---------- Phone frame (presentation only) ----------
  const STATUS_ICONS = `
    <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 6.9a6 6 0 0 1 8 0"/><circle cx="8" cy="9.8" r="1.3" fill="#fff" stroke="none"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="#fff" opacity=".45"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#fff"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="#fff" opacity=".5"/></svg>`;

  FC.phone = function phone(inner, screenId) {
    return `<div class="phone">
      <div class="phone__screen"${screenId ? ` id="${screenId}"` : ''}>${inner}</div>
      <div class="phone__status" aria-hidden="true"><span>9:41</span><span class="phone__status-icons">${STATUS_ICONS}</span></div>
      <div class="phone__island" aria-hidden="true"></div>
      <div class="phone__home" aria-hidden="true"></div>
    </div>`;
  };

  // ---------- Timers (cleared on every route change) ----------
  let timers = [];
  let cookTick = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
  function clearTimers() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; cookTick = null; }
  function stopCookTimer() { if (cookTick) clearInterval(cookTick); cookTick = null; }

  // ---------- Toast ----------
  let toastSeq = 0, toastTimer = null;
  function toast(message) {
    clearTimeout(toastTimer);
    store.setUI({ toast: { id: ++toastSeq, message } });
    toastTimer = setTimeout(() => store.setUI({ toast: null }), 2400);
  }

  // ---------- Rendering ----------
  let lastPath = null, lastSheet = null, lastToast = null;

  function render() {
    const route = router.current();
    if (!route.name) return;
    const state = store.getState();
    renderDevMenu(route);
    const inGallery = route.name === 'gallery';
    $('#stage').hidden = inGallery;
    $('#gallery').hidden = !inGallery;
    if (inGallery) {
      if (lastPath !== route.path) $('#gallery').innerHTML = FC.screens.Gallery(state);
      lastPath = route.path;
      return;
    }

    const root = $('#screen');
    const same = route.path === lastPath;
    const kept = {};
    if (same) root.querySelectorAll('[data-keep-scroll]').forEach((el) => { kept[el.dataset.keepScroll] = [el.scrollTop, el.scrollLeft]; });

    root.innerHTML = FC.screens[route.screen](state, route.params) +
      (state.ui.toast ? FC.components.Toast({ message: state.ui.toast.message }) : '');

    root.querySelectorAll('[data-keep-scroll]').forEach((el) => {
      const k = kept[el.dataset.keepScroll];
      if (k) { el.scrollTop = k[0]; el.scrollLeft = k[1]; }
    });
    // Entry animations play once - on route change, sheet open, or a new toast - not on every re-render
    if (!same) root.firstElementChild.classList.add('is-entering');
    if (same && state.ui.sheet === lastSheet) root.querySelectorAll('.c-sheet, .c-scrim').forEach((el) => el.classList.add('is-static'));
    if (state.ui.toast && state.ui.toast.id === lastToast) root.querySelector('.c-toast').classList.add('is-static');
    lastPath = route.path;
    lastSheet = state.ui.sheet;
    lastToast = state.ui.toast && state.ui.toast.id;
  }

  // ---------- Navigation ----------
  let pending = {};
  function navigate(path, opts) { pending = opts || {}; router.go(path); }

  function onRoute() {
    clearTimers();
    const route = router.current();
    if (!route.name) {
      history.replaceState(null, '', store.getState().onboarded ? '#/home' : '#/onboarding');
      return onRoute();
    }
    const patch = { sheet: pending.sheet || null };
    if (route.name === 'analyzing') patch.found = 0;
    if (route.name === 'cook') Object.assign(patch, { cookStep: 0, timer: null });
    Object.assign(patch, pending.ui);
    const toastMsg = pending.toast;
    pending = {};
    store.setUI(patch, { silent: true });
    render();
    if (toastMsg) toast(toastMsg);
    if (route.name === 'analyzing') startAnalyzing();
  }

  function startAnalyzing() {
    const total = store.getState().detected.length;
    const tick = every(() => {
      const found = ui().found + 1;
      store.setUI({ found });
      if (found >= total) { clearInterval(tick); later(() => router.go('#/confirm'), 900); }
    }, 230);
  }

  // ---------- Helpers used by actions ----------
  function setQty(s, id, displayValue) {
    const d = s.detected.find((x) => x.id === id);
    if (!d) return;
    const f = d.alt && d.displayUnit === d.alt.unit ? d.alt.factor : 1;
    d.value = clamp(+(Number(displayValue) * f).toFixed(4), d.min, d.max);
    d.touched = true;
  }

  function flash() {
    const f = $('[data-flash]');
    if (!f) return;
    f.classList.remove('go');
    void f.offsetWidth; // restart the CSS animation
    f.classList.add('go');
  }

  function toggleTimer() {
    const s = store.getState();
    const step = s.ui.cookStep;
    const full = L.recipe(router.current().params.id).steps[step].minutes * 60;
    const t = s.ui.timer && s.ui.timer.step === step ? s.ui.timer : { step, remaining: full, running: false };
    if (t.running) { stopCookTimer(); store.setUI({ timer: Object.assign({}, t, { running: false }) }); return; }
    store.setUI({ timer: { step, remaining: t.remaining > 0 ? t.remaining : full, running: true } });
    cookTick = every(() => {
      const cur = ui().timer;
      if (!cur || !cur.running) return stopCookTimer();
      if (cur.remaining <= 1) {
        stopCookTimer();
        store.setUI({ timer: Object.assign({}, cur, { remaining: 0, running: false }) });
        toast('Timer done - on to the next step');
      } else {
        store.setUI({ timer: Object.assign({}, cur, { remaining: cur.remaining - 1 }) });
      }
    }, 1000);
  }

  const findStaple = (s, id) => s.pantry.find((x) => x.id === id);

  // ---------- Actions (≈ onPress handlers) ----------
  const actions = {
    go: ({ value }) => navigate(value),
    'gallery-open': ({ id, value }) => navigate(value, { ui: JSON.parse(id || '{}') }),
    soon: () => toast('Coming soon in the real app'),
    toast: ({ value }) => toast(value),
    'open-sheet': ({ value }) => store.setUI({ sheet: value }),
    'close-sheet': () => store.setUI({ sheet: null }),

    // Onboarding + profile
    'onb-next': () => store.setUI({ onbStep: ui().onbStep + 1 }),
    'onb-back': () => store.setUI({ onbStep: Math.max(0, ui().onbStep - 1) }),
    'onb-skip': () => store.setUI({ onbStep: D.onboarding.length }),
    'onb-finish': () => {
      upd((s) => { s.onboarded = true; s.prefs.diet = s.user.diet; s.prefs.servings = s.user.householdSize; }, { silent: true });
      navigate('#/home', { toast: 'Welcome to FridgeChef' });
    },
    'set-diet': ({ value }) => upd((s) => { s.user.diet = value; s.prefs.diet = value; }),
    'toggle-allergy': ({ value }) => upd((s) => {
      const a = s.user.allergies;
      s.user.allergies = a.includes(value) ? a.filter((x) => x !== value) : a.concat(value);
    }),
    'set-household': ({ value }) => upd((s) => { s.user.householdSize = Number(value); s.prefs.servings = Number(value); }),
    'set-user': ({ id, value }) => upd((s) => { s.user[id] = value; if (id === 'defaultEffort') s.prefs.effort = value; }),
    'set-mood': ({ value }) => upd((s) => { s.prefs.mood = value; }),
    'replay-onboarding': () => {
      upd((s) => { s.onboarded = false; }, { silent: true });
      navigate('#/onboarding', { ui: { onbStep: 0 } });
    },
    'reset-demo': () => { clearTimers(); store.reset(); navigate('#/onboarding', { toast: 'Demo data reset' }); },

    // Scan
    shutter: () => {
      const s = store.getState();
      if (s.photos.length >= 6) return toast('Max 6 photos per scan');
      const shot = D.library[s.ui.camIdx % D.library.length];
      upd((st) => { st.photos.push({ id: `ph${Date.now()}`, src: shot.src, label: shot.label }); st.ui.camIdx += 1; });
      flash();
    },
    'remove-photo': ({ id }) => upd((s) => { s.photos = s.photos.filter((p) => p.id !== id); }),
    retake: ({ id }) => {
      upd((s) => { const p = s.photos.find((x) => x.id === id); if (p) p.blurry = false; });
      flash();
      toast('Retaken - nice and sharp');
    },
    'toggle-flash': () => store.setUI({ flash: !ui().flash }),
    flip: () => store.setUI({ camIdx: ui().camIdx + 1 }),
    'open-picker': () => store.setUI({ sheet: 'picker', picker: [] }),
    'picker-toggle': ({ id }) => {
      const p = ui().picker;
      store.setUI({ picker: p.includes(id) ? p.filter((x) => x !== id) : p.concat(id) });
    },
    'picker-add': () => {
      const picked = ui().picker;
      let added = 0;
      upd((s) => {
        picked.forEach((pid) => {
          if (s.photos.length >= 6) return;
          const l = D.library.find((x) => x.id === pid);
          s.photos.push({ id: `ph${Date.now()}${pid}`, src: l.src, label: l.label });
          added += 1;
        });
        s.ui.sheet = null;
        s.ui.picker = [];
      });
      toast(added < picked.length ? `Added ${plural(added, 'photo')} · max 6 per scan` : `Added ${plural(added, 'photo')}`);
    },
    analyze: () => {
      const n = store.getState().photos.length;
      if (!n) return;
      upd((s) => { s.detected = D.detectedFor(n); s.confirmedAt = null; }, { silent: true });
      navigate('#/analyzing');
    },

    // Confirm quantities
    'qty-slide': ({ id, value, live }) => upd((s) => setQty(s, id, value), { silent: live }),
    'qty-step': ({ id, value }) => upd((s) => setQty(s, id, value)),
    'qty-unit': ({ id, value }) => upd((s) => { const d = s.detected.find((x) => x.id === id); if (d) d.displayUnit = value; }),
    'qty-ok': ({ id }) => upd((s) => { const d = s.detected.find((x) => x.id === id); if (d) d.touched = true; }),
    'qty-remove': ({ id }) => {
      const d = store.getState().detected.find((x) => x.id === id);
      upd((s) => { s.detected = s.detected.filter((x) => x.id !== id); });
      if (d) toast(`Removed ${d.name}`);
    },
    'add-item': ({ value }) => {
      const a = D.addable.find((x) => x.id === value);
      upd((s) => {
        s.detected.push(Object.assign({}, a, { category: 'Added', confidence: 'manual', aiEstimate: null, displayUnit: a.unit, touched: true }));
        s.ui.sheet = null;
      });
      toast(`Added ${a.name}`);
    },
    'toggle-staple': ({ id }) => upd((s) => { s.excluded[id] = !s.excluded[id]; }),
    'toggle-pantry-open': () => store.setUI({ pantryOpen: !ui().pantryOpen }),
    'toggle-auto': () => upd((s) => { s.autoInclude = !s.autoInclude; }),
    confirm: () => {
      if (L.pendingChecks(store.getState()).length) return;
      upd((s) => { s.confirmedAt = now(); s.lastScan = { at: s.confirmedAt, items: s.detected.length }; }, { silent: true });
      navigate('#/mood');
    },

    // Mood / preferences
    pref: ({ id, value }) => upd((s) => { s.prefs[id] = value; }),
    'pref-num': ({ id, value, live }) => upd((s) => { s.prefs[id] = Number(value); }, { silent: live }),
    'toggle-cuisine': ({ value }) => upd((s) => {
      const picked = s.prefs.cuisines.filter((x) => x !== 'Any');
      const next = value === 'Any' ? [] : picked.includes(value) ? picked.filter((x) => x !== value) : picked.concat(value);
      s.prefs.cuisines = next.length ? next : ['Any'];
    }),
    'toggle-equip': ({ value }) => upd((s) => {
      const e = s.prefs.equipment;
      s.prefs.equipment = e.includes(value) ? e.filter((x) => x !== value) : e.concat(value);
    }),

    // Suggestions
    'set-filter': ({ value }) => upd((s) => { s.filter = value; }),
    'set-sort': ({ value }) => upd((s) => { s.sort = value; s.ui.sheet = null; }),
    loosen: () => {
      upd((s) => { s.filter = 'all'; s.prefs.cuisines = ['Any']; s.prefs.effort = 'chef'; });
      toast('Filters loosened');
    },
    'more-time': () => {
      upd((s) => { s.prefs.time = Math.min(120, s.prefs.time + 30); });
      toast(`Now ${store.getState().prefs.time} min`);
    },

    // Recipe + cook mode
    'open-recipe': ({ id }) => navigate(`#/recipe/${id}`, { ui: { recipeTab: 'ingredients' } }),
    tab: ({ value }) => store.setUI({ recipeTab: value }),
    save: ({ id }) => {
      const had = store.getState().saved.includes(id);
      upd((s) => { s.saved = had ? s.saved.filter((x) => x !== id) : [id].concat(s.saved); });
      toast(had ? 'Removed from saved' : 'Saved to your cookbook');
    },
    'start-cook': ({ id }) => navigate(`#/cook/${id}`),
    'cook-step': ({ value }) => { stopCookTimer(); store.setUI({ cookStep: Number(value), timer: null }); },
    'timer-toggle': () => toggleTimer(),
    'cook-done': ({ id }) => {
      stopCookTimer();
      store.setUI({ sheet: 'done', timer: null, used: L.defaultUsed(store.getState(), L.recipe(id)) });
    },
    'used-step': ({ id, value }) => store.setUI({ used: Object.assign({}, ui().used, { [id]: Number(value) }) }),
    'update-pantry': ({ id }) => {
      const before = new Set(L.lowStaples(store.getState()).map((s) => s.id));
      upd((s) => {
        Object.keys(s.ui.used).forEach((k) => {
          const qty = s.ui.used[k];
          const d = s.detected.find((x) => x.id === k);
          if (d) { d.value = Math.max(0, +(d.value - qty).toFixed(2)); return; }
          const st = findStaple(s, k);
          if (st && qty > 0) { st.level = Math.max(0, +(st.level - qty / st.perLevel).toFixed(2)); st.updatedAt = now(); }
        });
        s.cooked = [id].concat(s.cooked.filter((x) => x !== id)).slice(0, 6);
        s.ui.used = {};
      }, { silent: true });
      const newlyLow = L.lowStaples(store.getState()).filter((s) => !before.has(s.id)).length;
      navigate('#/home', { toast: newlyLow ? `Pantry updated · ${plural(newlyLow, 'item')} running low` : 'Pantry updated' });
    },

    // Pantry
    'pantry-cat': ({ value }) => store.setUI({ pantryCat: value }),
    'open-staple': ({ id }) => store.setUI({ sheet: `staple:${id}` }),
    'open-staple-from-home': ({ id }) => navigate('#/pantry', { sheet: `staple:${id}` }),
    'staple-level': ({ id, value }) => upd((s) => { const st = findStaple(s, id); st.level = Number(value); st.updatedAt = now(); }),
    'staple-refill': ({ id }) => {
      upd((s) => { const st = findStaple(s, id); st.level = 5; st.updatedAt = now(); s.ui.sheet = null; });
      toast('Marked as refilled');
    },
    'staple-remove': ({ id }) => {
      const st = findStaple(store.getState(), id);
      upd((s) => { s.pantry = s.pantry.filter((x) => x.id !== id); s.ui.sheet = null; });
      toast(`Removed ${st.name}`);
    },
    'add-staple': ({ value }) => {
      const o = D.stapleSuggestions.find((x) => x.name === value);
      upd((s) => {
        s.pantry.push({ id: slug(value), name: value, category: o.category, unitHint: 'New pack', level: 5, updatedAt: now(), unit: 'tsp', perLevel: 4, lowThreshold: 1.5 });
        s.ui.sheet = null;
      });
      toast(`${value} added to your pantry`);
    },

    // Dev menu
    'dev-toggle': () => { devCollapsed = !devCollapsed; renderDevMenu(router.current()); },
  };

  // ---------- Delegated events ----------
  function run(el, extra) {
    const fn = actions[el.dataset.action];
    const payload = Object.assign({ id: el.dataset.id, value: el.dataset.value, el }, extra);
    if (fn) fn(payload); else toast('Coming soon in the real app');
  }

  // Sliders: move fill + number directly while dragging; the store re-renders on release
  function liveRange(el) {
    const wrap = el.closest('[data-range]');
    const min = Number(el.min), max = Number(el.max);
    if (wrap) wrap.style.setProperty('--pct', ((Number(el.value) - min) / (max - min || 1)).toFixed(4));
    document.querySelectorAll(`#screen [data-live-value="${CSS.escape(el.dataset.id)}"]`)
      .forEach((o) => { o.textContent = FC.util.fmtNum(Number(el.value)); });
  }

  function filterList(input) {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll(`#screen [data-filter-list="${CSS.escape(input.dataset.id)}"] button`)
      .forEach((b) => { b.hidden = !!q && !b.textContent.toLowerCase().includes(q); });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled || el.tagName === 'INPUT') return;
    run(el);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) { e.preventDefault(); run(e.target); }
    if (e.key === 'Escape' && ui().sheet) store.setUI({ sheet: null });
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type === 'range' && el.dataset.action) { liveRange(el); run(el, { value: el.value, live: true }); }
    else if (el.dataset.action === 'filter') filterList(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.type === 'range' && el.dataset.action) run(el, { value: el.value, live: false });
  });

  // ---------- Dev menu (outside the phone) ----------
  let devCollapsed = window.innerWidth < 900;
  const DEV_LINKS = [
    ['Onboarding', '#/onboarding'], ['Home', '#/home'], ['Scan', '#/scan'], ['Analyzing', '#/analyzing'],
    ['Confirm quantities', '#/confirm'], ['Your mood', '#/mood'], ['Suggestions', '#/suggestions'],
    ['Recipe detail', '#/recipe/butter-chicken'], ['Cook mode', '#/cook/butter-chicken'],
    ['Pantry', '#/pantry'], ['Saved / Profile', '#/saved'],
  ];
  function renderDevMenu(route) {
    const menu = $('#devmenu');
    menu.className = cx('devmenu', devCollapsed && 'is-collapsed');
    menu.innerHTML = `
      <button class="devmenu__head" ${act('dev-toggle')} aria-expanded="${!devCollapsed}">
        <span class="devmenu__title">FridgeChef</span>${FC.icon(devCollapsed ? 'chevronDown' : 'chevronUp', 16)}
      </button>
      <div class="devmenu__list">
        ${DEV_LINKS.map(([label, path]) => `<button class="${cx('devmenu__link', route.path === path && 'is-active')}" ${act('go', null, path)}>${label}</button>`).join('')}
        <div class="devmenu__sep"></div>
        <button class="${cx('devmenu__link', route.name === 'gallery' && 'is-active')}" ${act('go', null, '#/gallery')}>All screens (gallery)</button>
        <button class="devmenu__link" ${act('reset-demo')}>Reset demo data</button>
      </div>`;
  }

  // ---------- Fit the 390×844 frame into the window ----------
  function fit() {
    const s = Math.min(1, (window.innerHeight - 32) / 864, (window.innerWidth - 32) / 410);
    document.documentElement.style.setProperty('--fit', Math.max(0.5, s).toFixed(3));
  }

  // ---------- Boot ----------
  $('#stage').innerHTML = `<div class="phone-fit">${FC.phone('', 'screen')}</div>`;
  store.subscribe(render);
  window.addEventListener('hashchange', onRoute);
  window.addEventListener('resize', fit);
  fit();
  onRoute();
})();
