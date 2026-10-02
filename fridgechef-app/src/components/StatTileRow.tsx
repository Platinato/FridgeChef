import { StyleSheet, View } from 'react-native';

import { StatTile, type StatTileProps } from '@/components/StatTile';

export type StatTileRowProps = {
  /** Usually three tiles: time (lime), kcal (white), protein (soft). No match tile (content rules). */
  tiles: Omit<StatTileProps, 'tall'>[];
};

/** Equal-width StatTiles, bottom-aligned; the first stands taller. */
export function StatTileRow({ tiles }: StatTileRowProps) {
  return (
    <View style={styles.row}>
      {tiles.map((tile, i) => (
        <StatTile key={`${tile.caption}-${i}`} {...tile} tall={i === 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
});
