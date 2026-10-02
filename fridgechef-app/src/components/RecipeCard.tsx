import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StatusDot } from '@/components/Badge';
import { Disc } from '@/components/Disc';
import { FallbackImage } from '@/components/FallbackImage';
import { Icon } from '@/components/Icon';
import { LevelBars } from '@/components/LevelBars';
import { TicketCard } from '@/components/TicketCard';
import { bodyFont } from '@/theme/fonts';
import { colors, spacing } from '@/theme/tokens';

/** The recipe fields the card shows (Sprint 04's domain `Recipe` is expected to satisfy this). */
export type RecipeCardRecipe = {
  id: string;
  name: string;
  timeMin: number;
  image?: string;
  cuisine: string;
  /** 1-5 */
  effort: number;
};

/** On-device match result for the confirmed ingredients (computed by `domain/`, passed in). */
export type RecipeCardMatch = {
  pct: number;
  have: number;
  total: number;
  missing: { name: string }[];
};

type Base = {
  recipe: RecipeCardRecipe;
  /** Top-half colour; the bottom is white under lime, light otherwise. Default `lime`. */
  variant?: 'lime' | 'light' | 'white';
  onPress?: () => void;
};

export type RecipeCardProps = Base &
  (
    | { compact?: false; match: RecipeCardMatch; stat?: never }
    /** Home "Cook again": compact with match %. */
    | { compact: true; stat?: 'match'; match: RecipeCardMatch }
    /** Saved: compact with effort bars instead of match % (content rules). */
    | { compact: true; stat: 'effort'; match?: RecipeCardMatch }
  );

/**
 * A TicketCard modelled on the reference match card: name · time disc · photo on top; the
 * cuisine, match % and effort below the notched seam, then have / missing.
 */
export function RecipeCard(props: RecipeCardProps) {
  const { recipe, variant = 'lime', onPress } = props;
  const compact = props.compact === true;
  const showEffort = props.compact === true && props.stat === 'effort';
  const match = props.match;

  const top = (
    <View style={styles.top}>
      <AppText
        variant="display"
        size={compact ? 24 : 30}
        color="ink"
        style={[styles.name, { lineHeight: Math.round((compact ? 24 : 30) * 0.92) }]}
        numberOfLines={3}
      >
        {recipe.name}
      </AppText>
      <Disc label={`${recipe.timeMin}'`} size={compact ? 46 : 54} />
      <FallbackImage
        uri={recipe.image}
        label={recipe.name}
        initialsSize={20}
        style={[styles.photo, compact ? styles.photoCompact : styles.photoFull]}
      />
    </View>
  );

  const effortCell = (
    <View
      style={[
        styles.cell,
        styles.dashed,
        compact ? [styles.metaCell, styles.effortRow] : styles.grow,
      ]}
    >
      <LevelBars
        level={recipe.effort}
        color="ink"
        size={8}
        label={`Effort ${recipe.effort} of 5`}
      />
      <AppText variant="display" size={13} style={styles.small}>
        Effort
      </AppText>
    </View>
  );

  const cuisineCell = (
    <View style={[styles.cell, styles.dashed, compact ? styles.metaCell : styles.grow]}>
      <AppText variant="display" size={compact ? 17 : 19} color="ink" numberOfLines={1}>
        {recipe.cuisine}
      </AppText>
    </View>
  );

  const pct = (big: number) =>
    match ? (
      <View style={compact ? styles.pctRow : styles.pctCol} testID="recipe-match">
        <AppText
          variant="display"
          size={big}
          color="ink"
          style={{ lineHeight: Math.round(big * 0.9) }}
        >
          {`${match.pct}%`}
        </AppText>
        <AppText variant="display" size={13} style={styles.small}>
          match
        </AppText>
      </View>
    ) : null;

  const bottom = compact ? (
    <View style={styles.meta}>
      {cuisineCell}
      {showEffort ? effortCell : pct(32)}
    </View>
  ) : (
    <>
      <View style={styles.stats}>
        {cuisineCell}
        <View style={[styles.cell, styles.grow]}>{pct(40)}</View>
        {effortCell}
      </View>
      {match ? (
        <View style={styles.foot}>
          {match.missing.length ? (
            <>
              <AppText style={styles.footText}>
                {`Have ${match.have} of ${match.total} · Missing:`}
              </AppText>
              {match.missing.map((m) => (
                <View key={m.name} style={styles.miss}>
                  <StatusDot />
                  <AppText style={styles.missText}>{m.name.toLowerCase()}</AppText>
                </View>
              ))}
            </>
          ) : (
            <>
              <Icon name="check" size={14} color={colors.ink2} strokeWidth={2.5} />
              <AppText style={styles.footText}>You have everything</AppText>
            </>
          )}
        </View>
      ) : null}
    </>
  );

  const label = showEffort
    ? `${recipe.name}, ${recipe.timeMin} minutes, effort ${recipe.effort} of 5`
    : `${recipe.name}, ${recipe.timeMin} minutes, ${match?.pct ?? 0}% match`;

  return (
    <TicketCard
      top={top}
      bottom={bottom}
      variant={variant}
      bottomVariant={variant === 'lime' ? 'white' : 'light'}
      compact={compact}
      onPress={onPress}
      label={label}
      testID={`recipe-card-${recipe.id}`}
    />
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  name: { flex: 1, minWidth: 0 },
  photo: { borderRadius: 999, borderWidth: 3, borderColor: colors.photoRing, flexShrink: 0 },
  photoFull: { width: 72, height: 72 },
  photoCompact: { width: 56, height: 56 },
  stats: { flexDirection: 'row', alignItems: 'stretch', gap: spacing[2] },
  grow: { flex: 1 },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 66,
    paddingHorizontal: 6,
    borderRadius: 18,
  },
  dashed: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkDash },
  small: { color: colors.inkCaption, lineHeight: 14 },
  pctCol: { alignItems: 'center', gap: 2 },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 4,
    columnGap: 6,
    marginTop: spacing[3],
  },
  footText: { fontSize: 13, lineHeight: 18, color: colors.ink2 },
  miss: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  missText: { fontFamily: bodyFont(600), fontSize: 13, lineHeight: 18, color: colors.ink },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  metaCell: { minHeight: 40, paddingHorizontal: 14 },
  effortRow: { flexDirection: 'row', gap: spacing[2] },
});
