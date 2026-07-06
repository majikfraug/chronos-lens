import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Props = { label: string; milestone: string };

/** Placeholder for a tab not yet built — see docs/brief.md §8 roadmap. */
export function ComingSoonScreen({ label, milestone }: Props): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.line}>{label}</Text>
      <Text style={styles.sub}>NOT YET SURVEYED · {milestone}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bg,
  },
  line: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphorDim,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.phosphorFaint,
  },
});
