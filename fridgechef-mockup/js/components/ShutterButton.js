/* ShutterButton - white ring with a lime core. RN: <Pressable> around expo-camera takePictureAsync */
FC.components.ShutterButton = function ShutterButton({ action = 'shutter', disabled = false }) {
  return `<button class="c-shutter" ${FC.util.act(action)} aria-label="Take photo" ${disabled ? 'disabled' : ''}><span></span></button>`;
};
