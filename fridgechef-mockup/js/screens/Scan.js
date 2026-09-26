/* Scan - mock camera: viewfinder, multi-photo strip, shutter / gallery / flip, blurry warning, analyze CTA. */
FC.screens.Scan = function Scan(state) {
  const C = FC.components, D = FC.data;
  const { plural } = FC.util;
  const ui = state.ui, photos = state.photos;
  const feed = D.library[ui.camIdx % D.library.length];
  const blurryIdx = photos.findIndex((p) => p.blurry);
  const last = photos[photos.length - 1];

  const blurry = blurryIdx >= 0 ? C.InfoCard({
    icon: 'alert', variant: 'alert', title: `Photo ${blurryIdx + 1} looks blurry`, body: 'Quantities may be off.',
    right: C.PrimaryButton({ label: 'Retake', variant: 'light', size: 'xs', full: false, action: 'retake', id: photos[blurryIdx].id }),
  }) : '';

  const body = `
    ${C.PhotoHero({ src: feed.src, alt: 'Camera preview', fill: true, fade: false, children: C.ScanOverlay() })}
    <i class="s-scan__flash" data-flash aria-hidden="true"></i>
    ${C.TopBar({
      overlay: true,
      left: C.IconButton({ icon: 'back', label: 'Back', action: 'go', value: '#/home', variant: 'glass' }),
      center: C.LiveBadge({ label: 'Ready' }),
      right: C.IconButton({ icon: 'flash', label: ui.flash ? 'Flash on' : 'Flash off', action: 'toggle-flash', variant: ui.flash ? 'lime' : 'glass' }),
    })}
    <div class="s-scan__tip">${C.Badge({ label: 'Open the door wide · Good light · Multiple angles', variant: 'glass', size: 'sm' })}</div>
    <div class="s-scan__panel">
      ${blurry}
      ${C.PhotoThumbStrip({ photos, addAction: 'open-picker' })}
      <div class="s-scan__controls">
        ${last ? C.IconButton({ image: last.src, label: 'Upload from gallery', action: 'open-picker', size: 52 }) : C.IconButton({ icon: 'gallery', label: 'Upload from gallery', action: 'open-picker', variant: 'glass', size: 52 })}
        ${C.ShutterButton({ disabled: photos.length >= 6 })}
        ${C.IconButton({ icon: 'flip', label: 'Switch camera', action: 'flip', variant: 'glass', size: 52 })}
      </div>
    </div>`;

  const footer = C.PrimaryButton({
    label: photos.length ? `Analyze ${plural(photos.length, 'photo')}` : 'Analyze photos',
    variant: 'lime', disabled: !photos.length, action: 'analyze',
  }) + (photos.length ? '' : '<p class="c-screen__hint">Take or upload at least one photo to continue.</p>');

  const picker = ui.sheet === 'picker' ? C.BottomSheet({
    title: 'Choose photos',
    content: `<p class="t-caption">Pick shots of your fridge, pantry and shelves. Up to 6 in total.</p>${C.PhotoPicker({ photos: D.library, selected: ui.picker })}`,
    footer: C.PrimaryButton({ label: ui.picker.length ? `Add ${plural(ui.picker.length, 'photo')}` : 'Select photos', variant: 'lime', disabled: !ui.picker.length, action: 'picker-add' }),
  }) : '';

  return C.Screen({ className: 's-scan', flush: true, scroll: false, body, footer, footerVariant: 'clear', overlay: picker });
};
