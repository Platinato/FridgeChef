/* Disc - solid circle holding a short label or icon (the reference's black "VS" disc / lime play button).
   variant: ink | lime | dark. RN: <View style={circle}> or <Pressable> */
FC.components.Disc = function Disc({ label, icon, size = 52, variant = 'ink', action, id, ariaLabel }) {
  const { act, esc } = FC.util;
  const inner = icon
    ? FC.icon(icon, Math.round(size * 0.42), 2)
    : `<span class="t-display" style="font-size:${Math.round(size * 0.42)}px">${esc(label)}</span>`;
  const tag = action ? 'button' : 'span';
  return `<${tag} class="c-disc c-disc--${variant}" style="width:${size}px;height:${size}px" ${act(action, id)}
    ${ariaLabel ? `aria-label="${esc(ariaLabel)}"` : ''}>${inner}</${tag}>`;
};
