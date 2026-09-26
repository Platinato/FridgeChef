/* RangeSlider - lime-filled track driven by a native range input (RN: @react-native-community/slider).
   `bare` renders only track + scale so QuantitySlider can compose it. `marker` = { value, label } tick (AI estimate).
   While dragging, app.js patches --pct and [data-live-value] directly; a full render happens on release. */
FC.components.RangeSlider = function RangeSlider({
  min, max, step = 1, value, unit = '', marks = [], marker, action = 'soon', id, label, bare = false, minLabel, maxLabel,
}) {
  const { act, esc, cx, fmtNum } = FC.util;
  const pct = (v) => (v - min) / (max - min || 1);
  const pos = (v) => `calc(14px + ${pct(v).toFixed(4)} * (100% - 28px))`; // centre of a 28px thumb
  const scale = marks.length
    ? marks.map((m) => `<span style="left:${pos(m)}">${fmtNum(m)}</span>`).join('')
    : `<span>${esc(minLabel != null ? minLabel : `${fmtNum(min)} ${unit}`)}</span><span>${esc(maxLabel != null ? maxLabel : `${fmtNum(max)} ${unit}`)}</span>`;
  const track = `<div class="c-range" data-range style="--pct:${pct(value).toFixed(4)}">
      <div class="c-range__track"><div class="c-range__fill"></div></div>
      ${marker ? `<div class="c-range__marker" style="left:${pos(marker.value)}"><span>${esc(marker.label)}</span></div>` : ''}
      <input class="c-range__input" type="range" min="${min}" max="${max}" step="${step}" value="${value}"
        ${act(action, id)} aria-label="${esc(label || 'Value')}">
    </div>
    <div class="${cx('c-range__scale', marks.length && 'c-range__scale--marks')}">${scale}</div>`;
  if (bare) return track;
  return `<div class="c-rangeslider">
    <div class="c-rangeslider__value"><b class="t-display" data-live-value="${esc(id)}">${fmtNum(value)}</b><small class="t-display">${esc(unit)}</small></div>
    ${track}
  </div>`;
};
