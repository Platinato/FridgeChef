/* Onboarding - 3 intro slides (Snap / Confirm / Cook) then a taste setup step. */
FC.screens.Onboarding = function Onboarding(state) {
  const C = FC.components, D = FC.data;
  const { esc } = FC.util;
  const step = Math.min(state.ui.onbStep, D.onboarding.length);
  const dots = C.PaginationDots({ count: D.onboarding.length + 1, active: step });

  if (step < D.onboarding.length) {
    const s = D.onboarding[step];
    const hero = C.PhotoHero({
      src: s.image, alt: s.title, height: 500,
      children: C.TopBar({
        left: C.AppLogo({ size: 44 }),
        right: C.PrimaryButton({ label: 'Skip', variant: 'glass', size: 'xs', full: false, action: 'onb-skip' }),
      }),
    });
    const body = `${hero}
      <div class="c-photohero__after">
        ${dots}
        ${C.HeroTitle({ kicker: s.kicker, title: s.title, size: 96 })}
        <p class="t-body">${esc(s.body)}</p>
      </div>`;
    return C.Screen({
      className: 's-onb', flush: true, body,
      footer: C.PrimaryButton({ label: step === D.onboarding.length - 1 ? 'Set up my kitchen' : 'Next', variant: 'lime', iconRight: 'chevronRight', action: 'onb-next' }),
    });
  }

  const u = state.user;
  const body = `
    ${C.TopBar({ left: C.IconButton({ icon: 'back', label: 'Back', action: 'onb-back' }), center: dots })}
    ${C.HeroTitle({ kicker: 'Set up', title: 'Your taste', size: 84 })}
    ${C.FormSection({
      title: 'Diet', hint: 'We only suggest recipes that fit.',
      content: C.ChipRow({ wrap: true, chips: D.diets.map((d) => ({ label: d.label, active: u.diet === d.id, action: 'set-diet', value: d.id })) }),
    })}
    ${C.FormSection({
      title: 'Allergies', hint: 'Recipes with these are never shown.',
      content: C.ChipRow({ wrap: true, chips: D.allergies.map((a) => ({ label: a, active: u.allergies.includes(a), icon: u.allergies.includes(a) ? 'check' : null, action: 'toggle-allergy', value: a })) }),
    })}
    ${C.FormSection({
      title: 'Household', hint: 'Default servings for every recipe.',
      right: C.Stepper({ value: u.householdSize, min: 1, max: 8, action: 'set-household', label: 'Household size' }),
    })}`;
  return C.Screen({ body, footer: C.PrimaryButton({ label: "Let's cook", variant: 'lime', iconRight: 'chevronRight', action: 'onb-finish' }) });
};
