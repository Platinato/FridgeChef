/* CookMode - one step per screen with a real countdown; "Done" opens the pantry-update sheet. */
FC.screens.CookMode = function CookMode(state, params) {
  const C = FC.components, L = FC.logic;
  const { esc, clamp } = FC.util;
  const r = L.recipe(params.id);
  const n = r.steps.length;
  const i = clamp(state.ui.cookStep, 0, n - 1);
  const step = r.steps[i];
  const t = state.ui.timer && state.ui.timer.step === i ? state.ui.timer : { remaining: step.minutes * 60, running: false };
  const mmss = `${String(Math.floor(t.remaining / 60)).padStart(2, '0')}:${String(t.remaining % 60).padStart(2, '0')}`;
  const pad = (x) => String(x).padStart(2, '0');
  const next = r.steps[i + 1];

  const body = `
    ${C.TopBar({
      left: C.IconButton({ icon: 'close', label: 'Exit cook mode', action: 'go', value: `#/recipe/${r.id}` }),
      center: C.Badge({ label: r.name, variant: 'dark' }),
      right: C.IconButton({ icon: 'more', label: 'More', action: 'soon' }),
    })}
    ${C.ProgressBar({ value: i + 1, max: n, label: `Step ${i + 1} of ${n}`, caption: `${r.timeMin} min total` })}
    <div class="s-cook__num"><b class="t-display">${pad(i + 1)}</b><span class="t-display">/ ${pad(n)}</span></div>
    <p class="s-cook__text">${esc(step.text)}</p>
    <div class="s-cook__timer">
      ${C.LiveBadge({ label: mmss, size: 'lg', action: 'timer-toggle', icon: 'timer' })}
      <span class="t-caption">${t.running ? 'Tap to pause' : t.remaining === 0 ? 'Done! Tap to restart' : 'Tap to start the timer'}</span>
    </div>
    ${next ? C.InfoCard({ icon: 'chevronRight', title: 'Up next', body: next.text }) : C.InfoCard({ icon: 'check', variant: 'lime', title: 'Last step', body: 'Plate up - we’ll update your pantry after.' })}`;

  const footer = C.PrimaryButton({ label: 'Back', variant: 'outline', icon: 'back', disabled: i === 0, action: 'cook-step', value: i - 1 }) +
    (i < n - 1
      ? C.PrimaryButton({ label: 'Next step', variant: 'lime', iconRight: 'chevronRight', action: 'cook-step', value: i + 1 })
      : C.PrimaryButton({ label: 'Done cooking', variant: 'lime', iconRight: 'check', action: 'cook-done', id: r.id }));

  let sheet = '';
  if (state.ui.sheet === 'done') {
    const rows = Object.keys(state.ui.used).map((id) => {
      const d = state.detected.find((x) => x.id === id);
      const s = state.pantry.find((x) => x.id === id);
      const item = d || s;
      if (!item) return '';
      const unit = d ? d.unit : s.unit;
      return C.ListRow({
        label: item.name, detail: d ? 'fresh' : 'staple',
        right: C.Stepper({ value: state.ui.used[id], min: 0, max: d ? d.value : 20, step: d ? d.step : 0.25, unit, action: 'used-step', id, label: `${item.name} used` }),
      });
    }).join('');
    sheet = C.BottomSheet({
      title: 'Nice work',
      content: `<p class="t-body">We'll update your kitchen with what you used - adjust anything that's off.</p><div class="stack">${rows}</div>`,
      footer: C.PrimaryButton({ label: 'Update pantry', variant: 'lime', iconRight: 'check', action: 'update-pantry', id: r.id }),
    });
  }

  return C.Screen({ className: 's-cook', body, footer, footerVariant: 'row', overlay: sheet });
};
