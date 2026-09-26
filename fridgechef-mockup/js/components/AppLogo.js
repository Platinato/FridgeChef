/* AppLogo - lime disc with a chef hat carrying a check-swoosh (RN: <Svg>) */
FC.components.AppLogo = function AppLogo({ size = 48 } = {}) {
  return `<span class="c-logo" role="img" aria-label="FridgeChef">
    <svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
      <circle cx="24" cy="24" r="24" style="fill:var(--lime)"/>
      <g style="fill:var(--ink)">
        <circle cx="16.5" cy="20.5" r="6"/><circle cx="24" cy="16.5" r="7.5"/><circle cx="31.5" cy="20.5" r="6"/>
        <rect x="14.5" y="20" width="19" height="10"/>
        <rect x="15" y="31.5" width="18" height="5" rx="1.8"/>
      </g>
      <path d="M18.8 23.8l3.8 3.8 7.2-7.4" style="fill:none;stroke:var(--lime);stroke-width:3;stroke-linecap:round;stroke-linejoin:round"/>
    </svg>
  </span>`;
};
