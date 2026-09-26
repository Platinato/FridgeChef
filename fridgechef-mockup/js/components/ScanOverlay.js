/* ScanOverlay - lime corner brackets + optional sweeping scan line. Pure decoration.
   RN: absolutely positioned <View>s + Animated translateY */
FC.components.ScanOverlay = function ScanOverlay({ sweeping = false, inset = '19% 9% 50%' } = {}) {
  return `<div class="c-scan" style="inset:${inset}" aria-hidden="true">
    <i class="c-scan__corner c-scan__corner--tl"></i><i class="c-scan__corner c-scan__corner--tr"></i>
    <i class="c-scan__corner c-scan__corner--bl"></i><i class="c-scan__corner c-scan__corner--br"></i>
    ${sweeping ? '<i class="c-scan__line"></i>' : ''}
  </div>`;
};
