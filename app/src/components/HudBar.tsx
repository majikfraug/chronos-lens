import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Props = {
  label: string;
  rightLabel: string;
  fraction: number; // 0..1
  fillColor: string;
};

/** Thin labeled progress track — XP / attunement bars from brief §6. */
export function HudBar({ label, rightLabel, fraction, fillColor }: Props): React.JSX.Element {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.label}>{rightLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
    textTransform: 'uppercase',
  },
  track: {
    height: 4,
    backgroundColor: colors.panel2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
