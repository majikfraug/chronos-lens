import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { stageFor } from '../config/economy';
import { getFlag } from '../persistence/gameRepository';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const FEEDBACK_EMAIL = 'jeremiah.rounds@gmail.com';

/**
 * Playtest feedback (iOS port brief Part 4.3–4.4): clearly OUTSIDE the game
 * fiction, non-interrupting, and explicit about the minimal local telemetry
 * it attaches — session count, stage reached, naming outcome, app version.
 * Nothing else; no conversation content. Testers attach screenshots
 * themselves in Mail if they want to.
 */
export function FeedbackModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const level = useGameStore((s) => s.level);
  const companionName = useGameStore((s) => s.companionName);
  const [note, setNote] = useState('');
  const [sessions, setSessions] = useState<string>('?');
  const [declines, setDeclines] = useState(0);

  useEffect(() => {
    void getFlag('sessions_count').then((v) => setSessions(v ?? '1'));
    void getFlag('naming_declines').then((v) => setDeclines(v ? Number(v) : 0));
  }, []);

  const namingOutcome = companionName
    ? 'accepted'
    : declines > 0
      ? 'deflected'
      : 'not reached';

  const send = () => {
    const stage = stageFor(level, companionName != null);
    const body = [
      note.trim() || '(no note)',
      '',
      '--- playtest data (as disclosed in the app) ---',
      `app version: ${Constants.expoConfig?.version ?? '?'}`,
      `sessions: ${sessions}`,
      `stage reached: ${stage}`,
      `naming: ${namingOutcome}`,
    ].join('\n');
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Chronos-Lens playtest feedback')}&body=${encodeURIComponent(body)}`;
    void Linking.openURL(url);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.panel}>
          <Text style={styles.title}>PLAYTEST FEEDBACK</Text>
          <Text style={styles.subtitle}>
            This goes to the developer — it is not part of the game.
          </Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="what happened, what worked, what broke…"
            placeholderTextColor={colors.phosphorFaint}
            multiline
            autoFocus
          />
          <Text style={styles.disclosure}>
            Sending opens your mail app with your note plus, as shown: app version, session count,
            stage reached, and whether the naming happened. Nothing else — no conversation content,
            no location. Attach screenshots in Mail if useful.
          </Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={send}>
              <Text style={styles.btnText}>SEND VIA MAIL</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={styles.btnTextDim}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(7,9,7,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 10,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.bright,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.phosphorDim,
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.bright,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    padding: 10,
  },
  disclosure: {
    fontFamily: fonts.body,
    fontSize: 9,
    lineHeight: 13,
    color: colors.phosphorFaint,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnPrimary: {
    borderColor: colors.phosphorDim,
  },
  btnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.bright,
  },
  btnTextDim: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.phosphorDim,
  },
});
