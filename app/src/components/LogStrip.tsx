import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGameStore, type LogEntry } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * The companion/system feed — the permanent home of the AI interface.
 * M2: displays system telemetry, discoveries, and milestone lines.
 * M4 replaces the disabled transmit row with the real dialogue engine
 * (AuthoredBrain, questions, keyword router) — see docs/brief.md §5.
 */
export function LogStrip(): React.JSX.Element {
  const log = useGameStore((s) => s.log);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Follow the newest entry, like the prototype's log.scrollTop behavior.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [log.length]);

  return (
    <View style={styles.wrap}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollInner}>
        {log.length === 0 && (
          <Text style={styles.empty}>▸ CHANNEL QUIET · SURVEY DATA WILL BE REPORTED HERE</Text>
        )}
        {log.map((entry) => (
          <LogLine key={entry.id} entry={entry} />
        ))}
      </ScrollView>
      <View style={styles.transmitRow}>
        <TextInput
          style={styles.transmitInput}
          placeholder="transmit to the Lens · channel opens at a later calibration"
          placeholderTextColor={colors.phosphorFaint}
          editable={false}
        />
        <View style={styles.sendBtn}>
          <Text style={styles.sendText}>SEND</Text>
        </View>
      </View>
    </View>
  );
}

function LogLine({ entry }: { entry: LogEntry }): React.JSX.Element {
  switch (entry.kind) {
    case 'ai':
      return (
        <View style={styles.aiBlock}>
          <Text style={styles.aiLabel}>LENS</Text>
          <Text style={styles.aiText}>{entry.text}</Text>
        </View>
      );
    case 'disc':
      return <Text style={styles.disc}>◇ {entry.text}</Text>;
    case 'milestone':
      return <Text style={styles.milestone}>{entry.text}</Text>;
    case 'sys':
    default:
      return <Text style={styles.sys}>▸ {entry.text}</Text>;
  }
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panel,
  },
  scroll: {
    maxHeight: 110,
    minHeight: 64,
  },
  scrollInner: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.phosphorFaint,
  },
  sys: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.phosphorDim,
  },
  disc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.discover,
  },
  milestone: {
    fontFamily: fonts.display,
    fontSize: 17,
    letterSpacing: 3,
    color: colors.bright,
    textAlign: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 4,
  },
  aiBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.companionAmberDim,
    backgroundColor: 'rgba(217,201,138,0.045)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  aiLabel: {
    fontFamily: fonts.body,
    fontSize: 8,
    letterSpacing: 3,
    color: colors.companionAmberDim,
    marginBottom: 2,
  },
  aiText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.companionAmber,
  },
  transmitRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  transmitInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bright,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  sendBtn: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    opacity: 0.35,
  },
  sendText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
  },
});
