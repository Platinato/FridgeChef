/* Inline SVG line-icon set (24px grid, 1.75 stroke). RN: react-native-svg or an icon font. */
FC.icons = (function () {
  const P = {
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    gallery: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8 8.5"/>',
    home: '<path d="M4 11l8-6.5 8 6.5V20h-5v-5h-6v5H4z"/>',
    pantry: '<path d="M8 3.5h8M7.5 6.5h9v1.8a2 2 0 0 1 1.5 1.9V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19v-8.8a2 2 0 0 1 1.5-1.9z"/><path d="M6 13h12"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    heartFill: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="currentColor"/>',
    bookmark: '<path d="M7 4h10v16l-5-3.5L7 20z"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 3-5.4 3.7-9.3 2.4 1.4 3.4 3.5 3.3 5.5 1-.6 1.8-1.7 2-3 2 1.8 4 4 4 6.8 0 3.6-2.6 6.2-6.5 6.2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    play: '<path d="M8.5 5.5v13l10-6.5z" fill="currentColor"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2 1.5M9.5 3h5M12 3v3.5"/>',
    more: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    basket: '<path d="M3.5 10h17l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8 10l3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3"/>',
    flash: '<path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    flip: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    sort: '<path d="M4 7h10M4 12h7M4 17h4M17 5v14M14 16l3 3 3-3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronUp: '<path d="M6 15l6-6 6 6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.3v.2"/>',
    swap: '<path d="M7 4L4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"/>',
    // Mood icons
    bowl: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 7.5c0-1.5 1-1.5 1-3M13 7.5c0-1.5 1-1.5 1-3"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v6H3z"/><path d="M5 18v2M19 18v2"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    thermo: '<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 10v6"/>',
    party: '<path d="M4 20l4.5-12 7.5 7.5z"/><path d="M14 4v2M19 9h2M17 6l1.5-1.5"/>',
  };

  function icon(name, size = 20, stroke = 1.75) {
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.sparkle}</svg>`;
  }
  return { icon, names: Object.keys(P) };
})();
FC.icon = FC.icons.icon;
