import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Disc } from '@/components/Disc';
import type { IconName } from '@/components/Icon';
import { PrimaryButton, type PrimaryButtonProps } from '@/components/PrimaryButton';
import { colors, radii, spacing } from '@/theme/tokens';

export type EmptyStateProps = {
  /** Default `search`. */
  icon?: IconName;
  title: string;
  body: string;
  /** Recovery actions, rendered as small hugging buttons ("Loosen filters", "Add 30 min"). */
  actions?: (PrimaryButtonProps & { key?: string })[];
};

/** Dashed card with an icon disc, headline, body and recovery actions. */
export function EmptyState({ icon = 'search', title, body, actions = [] }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <Disc icon={icon} size={64} variant="dark" />
      <AppText
        variant="display"
        size={34}
        align="center"
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </AppText>
      <AppText variant="body" align="center" style={styles.body}>
        {body}
      </AppText>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map(({ key, ...a }) => (
            <PrimaryButton key={key ?? a.label} size="sm" full={false} {...a} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[8],
    paddingHorizontal: 18,
    borderRadius: radii.l,
    backgroundColor: colors.surface1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  title: { lineHeight: 34, marginTop: 4 },
  body: { maxWidth: 270 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: 4,
  },
});
