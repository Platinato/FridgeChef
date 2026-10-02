import { Alert, Platform } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message: string;
  /** The destructive button. */
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * A destructive confirm: the native Alert on iOS / Android. React Native Web's Alert does nothing,
 * so the `npm run web` preview falls back to the browser's confirm dialog.
 */
export function confirmDestructive({ title, message, confirmLabel, onConfirm }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) void onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
