import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { bodyFont } from '@/theme/fonts';
import { colors, radii } from '@/theme/tokens';

export type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Also the accessibility label. Default "Search". */
  placeholder?: string;
  onSubmit?: () => void;
  /** Inside a `Sheet`: uses the sheet-aware input so the keyboard pushes the sheet up. */
  inSheet?: boolean;
  autoFocus?: boolean;
};

/** Pill text input with a search icon (controlled). Lime ring while focused. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  onSubmit,
  inSheet = false,
  autoFocus,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <View style={[styles.field, focused && styles.focused]}>
      <Icon name="search" size={18} color={colors.text2} />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text2}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.lime}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  focused: { boxShadow: `0px 0px 0px 2px ${colors.lime}` },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: bodyFont(400),
    fontSize: 15,
    color: colors.white,
  },
});
