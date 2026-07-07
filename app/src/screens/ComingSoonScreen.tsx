import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Props = {
  title: string;
  body: string;
  /** Honest dev-status line, e.g. which milestone brings the module. */
  note: string;
};

/** Placeholder for a tab not yet built — see docs/brief.md §8 roadmap. */
export function ComingSoonScreen({ title, body, note }: Props): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    backgroundColor: colors.bg,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.phosphorDim,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.phosphor,
    textAlign: 'center',
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.phosphorFaint,
    textAlign: 'center',
  },
});
