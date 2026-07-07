import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ALL_TYPES,
  FEATURE_TYPES,
  SIMULATED_PUBLIC_COUNTS,
  type TypeName,
} from '../config/taxonomy';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * M3 Reliquary: per-type slots lit by the player's actual dithered captures.
 * "Recorded by others" counts are SIMULATED locally (authored constants in
 * taxonomy.ts) — v1 has no backend; real aggregation is v2. Brief §2.4.
 */
export function ReliquaryScreen(): React.JSX.Element {
  const reliquary = useGameStore((s) => s.reliquary);

  const lit = ALL_TYPES.filter((t) => reliquary[t]).length;
  const held = ALL_TYPES.reduce((sum, t) => sum + (reliquary[t]?.count ?? 0), 0);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <View style={styles.regionBar}>
        <Text style={styles.regionName}>SURVEY REGION</Text>
        <Text style={styles.completion}>
          <Text style={styles.completionCount}>{lit}</Text>/{ALL_TYPES.length} TYPES ATTESTED ·{' '}
          {held} HELD
        </Text>
      </View>
      <View style={styles.compTrack}>
        <View style={[styles.compFill, { width: `${(lit / ALL_TYPES.length) * 100}%` }]} />
      </View>

      <Text style={styles.secLabel}>TYPE ARCHIVE · FILLED BY YOUR SURVEY</Text>

      {held === 0 && (
        <Text style={styles.emptyNote}>
          No forms attested. Raise the Lens where density gathers, hold scan, and identify what
          surfaces — each filing lights its slot here, with your capture as the record.
        </Text>
      )}

      <View style={styles.grid}>
        {ALL_TYPES.map((t) => (
          <Slot key={t} type={t} />
        ))}
      </View>
    </ScrollView>
  );
}

function Slot({ type }: { type: TypeName }): React.JSX.Element {
  const slot = useGameStore((s) => s.reliquary[type]);
  const isFeature = (FEATURE_TYPES as readonly string[]).includes(type);
  const pub = SIMULATED_PUBLIC_COUNTS[type];

  return (
    <View style={[styles.slot, slot && styles.slotLit]}>
      {slot && slot.count > 1 && <Text style={styles.stack}>×{slot.count}</Text>}
      <View style={styles.thumb}>
        {slot?.thumbUri ? (
          <Image source={{ uri: slot.thumbUri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbEmpty}>? ?</Text>
        )}
      </View>
      <Text style={[styles.typeName, slot && styles.typeNameLit]}>
        {type}
        {isFeature ? ' ·F' : ''}
      </Text>
      {slot?.taughtFirst && <Text style={styles.taught}>FIRST TAUGHT BY YOU</Text>}
      <Text style={styles.pub}>
        {pub} recorded by others{pub <= 5 ? ' · rare' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { paddingHorizontal: 12, paddingVertical: 10 },
  regionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  regionName: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.phosphor,
  },
  completion: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.phosphorDim,
  },
  completionCount: { color: colors.neon, fontFamily: fonts.bodyMedium },
  compTrack: {
    height: 4,
    backgroundColor: colors.panel2,
    marginTop: 5,
    marginBottom: 12,
  },
  compFill: { height: '100%', backgroundColor: colors.phosphorDim },
  secLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 2.5,
    color: colors.phosphorDim,
    marginBottom: 7,
  },
  emptyNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 17,
    color: colors.phosphorFaint,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: '31%',
    flexGrow: 1,
    minWidth: 104,
    maxWidth: 160,
    minHeight: 118,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 7,
    gap: 3,
  },
  slotLit: { borderColor: 'rgba(113,232,201,0.35)' },
  stack: {
    position: 'absolute',
    top: 4,
    right: 6,
    zIndex: 1,
    fontFamily: fonts.body,
    fontSize: 8.5,
    color: colors.phosphorDim,
  },
  thumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.phosphorFaint,
  },
  typeName: {
    fontFamily: fonts.body,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.phosphorDim,
  },
  typeNameLit: { color: colors.neon },
  taught: {
    fontFamily: fonts.body,
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: colors.interestAmber,
  },
  pub: {
    marginTop: 'auto',
    fontFamily: fonts.body,
    fontSize: 8,
    color: colors.phosphorFaint,
  },
});
