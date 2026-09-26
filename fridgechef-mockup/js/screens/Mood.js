/* Mood - "Your / MOOD": the human parameters (mood, time, effort, servings, hunger, cuisine, diet, equipment, spice). */
FC.screens.Mood = function Mood(state) {
  const C = FC.components, D = FC.data;
  const p = state.prefs;
  const effort = D.efforts.find((e) => e.value === p.effort);

  const body = `
    ${C.TopBar({
      left: C.IconButton({ icon: 'back', label: 'Back', action: 'go', value: '#/confirm' }),
      center: C.Badge({ label: 'Quantities confirmed', icon: 'check', variant: 'dark' }),
    })}
    ${C.HeroTitle({ kicker: 'Your', title: 'Mood' })}
    ${C.FormSection({ title: 'How are you feeling?', content: C.ChipRow({ key: 'mood', chips: D.moods.map((m) => ({ label: m.label, icon: m.icon, active: p.mood === m.id, action: 'pref', id: 'mood', value: m.id })) }) })}
    ${C.FormSection({ title: 'Time you have', content: C.RangeSlider({ min: 10, max: 120, step: 5, value: p.time, unit: 'min', marks: [15, 30, 60, 90], action: 'pref-num', id: 'time', label: 'Minutes available' }) })}
    ${C.FormSection({ title: 'Effort', hint: effort.desc, content: C.SegmentedControl({ options: D.efforts, value: p.effort, action: 'pref', id: 'effort', stacked: true }) })}
    ${C.FormSection({ title: 'Servings', hint: 'Recipes scale to this.', right: C.Stepper({ value: p.servings, min: 1, max: 8, action: 'pref-num', id: 'servings', label: 'Servings' }) })}
    ${C.FormSection({ title: 'Hunger', content: C.SegmentedControl({ options: D.hunger, value: p.hunger, action: 'pref', id: 'hunger' }) })}
    ${C.FormSection({ title: 'Cuisine', hint: 'Pick any - or leave it on Any.', content: C.ChipRow({ wrap: true, chips: D.cuisines.map((c) => ({ label: c, active: p.cuisines.includes(c), action: 'toggle-cuisine', value: c, size: 'sm' })) }) })}
    ${C.FormSection({ title: 'Diet', content: C.ChipRow({ key: 'diet', chips: D.diets.map((d) => ({ label: d.label, active: p.diet === d.id, action: 'pref', id: 'diet', value: d.id })) }) })}
    ${C.FormSection({ title: 'Equipment', hint: 'What can you use right now?', content: C.ChipRow({ wrap: true, chips: D.equipment.map((e) => ({ label: e.label, active: p.equipment.includes(e.id), icon: p.equipment.includes(e.id) ? 'check' : 'plus', action: 'toggle-equip', value: e.id, size: 'sm' })) }) })}
    ${C.FormSection({
      title: 'Spice level', hint: D.spiceLabels[p.spice - 1],
      right: C.LevelBars({ level: p.spice, size: 30, action: 'pref-num', id: 'spice', label: `Spice level ${p.spice} of 5` }),
    })}`;

  return C.Screen({ className: 's-mood', body, footer: C.PrimaryButton({ label: 'Cook up ideas', variant: 'lime', iconRight: 'sparkle', action: 'go', value: '#/suggestions' }) });
};
