/* LiveBadge - lime pill with a pulsing red dot ("● Live" → "● AI Scanning", "● Match 92%").
   RN: Badge + Animated dot */
FC.components.LiveBadge = function LiveBadge({ label, action, id, value, size, icon }) {
  return FC.components.Badge({ label, dot: 'live', variant: 'lime', action, id, value, size, icon });
};
