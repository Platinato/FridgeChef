/* Tiny store: getState / setState / subscribe (future: Zustand or React context).
   Everything except `ui` is persisted to localStorage. */
FC.store = (function () {
  const KEY = 'fridgechef.mockup.v1';
  const subs = [];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let state = load();

  function load() {
    const seed = FC.data.seedState();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(seed, JSON.parse(raw), { ui: seed.ui });
    } catch (e) { /* storage blocked or corrupt - run on seed data */ }
    return seed;
  }

  function persist() {
    try {
      const rest = Object.assign({}, state);
      delete rest.ui;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch (e) { /* private mode etc. - state still works in memory */ }
  }

  // { silent: true } updates state without re-rendering (used while a slider is being dragged)
  function emit(opts) { if (!(opts && opts.silent)) subs.forEach((fn) => fn(state)); }

  return {
    getState: () => state,
    setState(patch, opts) { state = Object.assign({}, state, patch); persist(); emit(opts); },
    setUI(patch, opts) { state = Object.assign({}, state, { ui: Object.assign({}, state.ui, patch) }); emit(opts); },
    // Mutate a deep copy - keeps actions short when they touch nested arrays
    update(fn, opts) { const next = clone(state); fn(next); state = next; persist(); emit(opts); },
    subscribe(fn) { subs.push(fn); },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      state = FC.data.seedState();
      emit();
    },
  };
})();
