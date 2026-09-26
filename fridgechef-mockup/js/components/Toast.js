/* Toast - lime pill that drops in from the top. Rendered by app.js over any screen. RN: react-native-toast-message */
FC.components.Toast = function Toast({ message }) {
  return `<div class="c-toast" role="status" aria-live="polite">${FC.icon('check', 16, 2.75)}<span>${FC.util.esc(message)}</span></div>`;
};
