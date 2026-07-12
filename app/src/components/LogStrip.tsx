import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGameStore, type LogEntry } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * The companion/system feed and the live transmit channel (M4).
 * Questions from the companion render in interest amber; while one is
 * pending, whatever the player transmits is kept verbatim as the answer.
 */
export function LogStrip(): React.JSX.Element {
  const log = useGameStore((s) => s.log);
  const pendingQuestion = useGameStore((s) => s.pendingQuestion);
  const companionName = useGameStore((s) => s.companionName);
  const submitTransmission = useGameStore((s) => s.submitTransmission);
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    // Follow the newest entry, like the prototype's log.scrollTop behavior.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [log.length]);

  useEffect(() => {
    // Keep the newest lines in view when the keyboard reshapes the layout.
    const sub = Keyboard.addListener('keyboardDidShow', () =>
      scrollRef.current?.scrollToEnd({ animated: false })
    );
    return () => sub.remove();
  }, []);

  const send = () => {
    const text = draft;
    if (!text.trim()) return;
    setDraft('');
    void submitTransmission(text);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        keyboardDismissMode="on-drag"
      >
        {log.length === 0 && (
          <Text style={styles.empty}>▸ CHANNEL QUIET · SURVEY DATA WILL BE REPORTED HERE</Text>
        )}
        {log.map((entry) => (
          <LogLine key={entry.id} entry={entry} label={companionName ?? 'LENS'} />
        ))}
      </ScrollView>
      {pendingQuestion && (
        <View style={styles.pinnedQuery}>
          <Text style={styles.pinnedQueryLabel}>RESPONDING TO</Text>
          <Text style={styles.pinnedQueryText} numberOfLines={3}>
            {pendingQuestion.text}
          </Text>
        </View>
      )}
      <View style={styles.transmitRow}>
        <TextInput
          style={[styles.transmitInput, pendingQuestion && styles.transmitAnswering]}
          value={draft}
          onChangeText={setDraft}
          placeholder={
            pendingQuestion
              ? 'respond · your words will be kept exactly'
              : `transmit to ${companionName ?? 'the Lens'}`
          }
          placeholderTextColor={pendingQuestion ? colors.interestAmber : colors.phosphorFaint}
          onSubmitEditing={send}
          returnKeyType="send"
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        {inputFocused && (
          <Pressable style={styles.dismissBtn} onPress={() => Keyboard.dismiss()} hitSlop={6}>
            <Text style={styles.dismissText}>⌄</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.sendBtn, !draft.trim() && styles.sendBtnIdle]}
          onPress={send}
          disabled={!draft.trim()}
        >
          <Text style={[styles.sendText, draft.trim() ? styles.sendTextReady : null]}>SEND</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LogLine({ entry, label }: { entry: LogEntry; label: string }): React.JSX.Element {
  switch (entry.kind) {
    case 'ai':
      return (
        <View style={styles.aiBlock}>
          <Text style={styles.aiLabel}>{label}</Text>
          <Text style={styles.aiText}>{entry.text}</Text>
        </View>
      );
    case 'query':
      return (
        <View style={[styles.aiBlock, styles.queryBlock]}>
          <Text style={[styles.aiLabel, styles.queryLabel]}>{label} · QUERY</Text>
          <Text style={styles.aiText}>{entry.text}</Text>
        </View>
      );
    case 'player':
      return (
        <View style={styles.playerBlock}>
          <Text style={styles.playerText}>{entry.text}</Text>
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
    flex: 1, // the communication channel owns all space below the square viewport
    minHeight: 0,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panel,
  },
  scroll: {
    flex: 1,
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
  queryBlock: {
    borderLeftColor: colors.interestAmber,
    backgroundColor: 'rgba(224,168,92,0.05)',
  },
  aiLabel: {
    fontFamily: fonts.body,
    fontSize: 8,
    letterSpacing: 3,
    color: colors.companionAmberDim,
    marginBottom: 2,
  },
  queryLabel: {
    color: colors.interestAmber,
  },
  aiText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.companionAmber,
  },
  // Player transmissions: right-justified neon, messaging-app convention.
  playerBlock: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderRightWidth: 2,
    borderRightColor: colors.neon,
    backgroundColor: 'rgba(113,232,201,0.06)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  playerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.bright,
    textAlign: 'right',
  },
  pinnedQuery: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: 'rgba(224,168,92,0.05)',
  },
  pinnedQueryLabel: {
    fontFamily: fonts.body,
    fontSize: 7.5,
    letterSpacing: 2.5,
    color: colors.interestAmber,
    marginBottom: 2,
  },
  pinnedQueryText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
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
  transmitAnswering: {
    borderColor: 'rgba(224,168,92,0.5)',
  },
  dismissBtn: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
  },
  dismissText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.phosphorDim,
  },
  sendBtn: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  sendBtnIdle: { opacity: 0.35 },
  sendText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
  },
  sendTextReady: { color: colors.neon },
});
