/* Hash router: #/name/:id → screen (future: React Navigation stack + tabs). */
FC.router = (function () {
  const ROUTES = {
    onboarding: 'Onboarding', home: 'Home', scan: 'Scan', analyzing: 'Analyzing', confirm: 'Confirm',
    mood: 'Mood', suggestions: 'Suggestions', recipe: 'RecipeDetail', cook: 'CookMode',
    pantry: 'Pantry', saved: 'Saved', gallery: 'Gallery',
  };

  function parse(hash) {
    const parts = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    const name = ROUTES[parts[0]] ? parts[0] : null;
    return { name, screen: name && ROUTES[name], params: { id: parts[1] }, path: '#/' + parts.join('/') };
  }

  return {
    ROUTES,
    parse,
    current: () => parse(location.hash),
    go(path) {
      if (location.hash === path) window.dispatchEvent(new HashChangeEvent('hashchange'));
      else location.hash = path;
    },
  };
})();
