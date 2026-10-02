import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DashedLine } from '@/components/DashedLine';
import { spacing } from '@/theme/tokens';

export type FormSectionProps = {
  title: string;
  /** Grey line under the title. */
  hint?: string;
  /** Control beside the title (e.g. a Stepper). */
  right?: ReactNode;
  /** The inputs. */
  children?: ReactNode;
  /**
   * Dashed rule above the section. The mockup draws it between consecutive sections,
   * so pass it on every section except the first.
   */
  divider?: boolean;
};

/** A labelled group of inputs (Mood, onboarding taste setup, Profile). */
export function FormSection({ title, hint, right, children, divider = false }: FormSectionProps) {
  return (
    <View style={[styles.section, divider && styles.divided]}>
      {divider ? <DashedLine style={styles.rule} /> : null}
      <View style={styles.head}>
        <View style={styles.text}>
          <AppText variant="display" size={26} accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
          {hint ? (
            <AppText variant="caption" style={styles.hint}>
              {hint}
            </AppText>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  divided: { paddingTop: spacing[5] },
  rule: { position: 'absolute', top: 0, left: 0, right: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  text: { flex: 1, minWidth: 0 },
  title: { lineHeight: 26, paddingTop: 3 },
  hint: { marginTop: 4, lineHeight: 18 },
});
