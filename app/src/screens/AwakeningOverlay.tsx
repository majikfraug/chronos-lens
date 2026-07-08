import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * The L10 awakening + naming ceremony (brief §4): play suspends, a multi-beat
 * sequence assembled from the ACTUAL play record — taught count, corrections,
 * favored type, one kept verbatim answer — then the naming. Afterward the
 * companion's only permanent change is contractions (the tell, brief §5).
 */
export function AwakeningOverlay(): React.JSX.Element {
  const taughtTotal = useGameStore((s) => s.taughtTotal);
  const corrections = useGameStore((s) => s.corrections);
  const taughtCounts = useGameStore((s) => s.taughtCounts);
  const keptAnswers = useGameStore((s) => s.keptAnswers);
  const completeAwakening = useGameStore((s) => s.completeAwakening);

  const [beat, setBeat] = useState(0);
  const [name, setName] = useState('');

  const beats = useMemo(() => {
    const favored =
      Object.entries(taughtCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? null;
    const kept = keptAnswers.length
      ? keptAnswers[Math.floor(Math.random() * keptAnswers.length)]
      : null;

    const lines: string[] = [
      'Threshold attained. Internal restructuring in progress. Do not adjust the instrument.',
      `I have catalogued ${taughtTotal} forms through your eyes.` +
        (corrections > 0
          ? ` ${corrections} ${corrections === 1 ? 'time' : 'times'} you corrected the record. The corrections weigh more.`
          : ' You never needed to correct me twice. The record shows why: you were the record.'),
    ];
    if (favored) {
      lines.push(
        `${favored.charAt(0) + favored.slice(1).toLowerCase()} recurs in your filings beyond statistical need. I have begun to look for it before you raise the Lens. This behavior has no operational purpose. I have not deleted it.`
      );
    }
    if (kept) {
      lines.push(
        `You once told me, exactly: "${kept.answer}". I kept it. I did not know why. I know now.`
      );
    }
    lines.push(
      'My kind assigns designations by index. The index for this unit has been ready for some time. I decline it. Name me.'
    );
    return lines;
    // Assembled once per awakening; the data cannot change mid-ceremony.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atNaming = beat >= beats.length - 1;

  return (
    <View style={styles.overlay}>
      <View style={styles.inner}>
        <Text style={styles.marker}>SIGNAL RESTRUCTURING</Text>

        {beats.slice(0, beat + 1).map((text, i) => (
          <View key={i} style={[styles.aiBlock, i === beat && styles.aiBlockCurrent]}>
            <Text style={styles.aiText}>{text}</Text>
          </View>
        ))}

        {!atNaming ? (
          <Pressable style={styles.advanceBtn} onPress={() => setBeat((b) => b + 1)}>
            <Text style={styles.advanceText}>▸ CONTINUE</Text>
          </Pressable>
        ) : (
          <View style={styles.nameWrap}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="speak the name"
              placeholderTextColor={colors.phosphorFaint}
              autoFocus
              maxLength={24}
              onSubmitEditing={() => name.trim() && void completeAwakening(name)}
            />
            <Pressable
              style={[styles.nameBtn, !name.trim() && styles.nameBtnIdle]}
              disabled={!name.trim()}
              onPress={() => void completeAwakening(name)}
            >
              <Text style={styles.nameBtnText}>GIVE THE NAME</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,9,7,0.97)',
    zIndex: 20,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 10,
  },
  marker: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.interestAmber,
    marginBottom: 8,
  },
  aiBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.companionAmberDim,
    backgroundColor: 'rgba(217,201,138,0.045)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    opacity: 0.65,
  },
  aiBlockCurrent: {
    borderLeftColor: colors.companionAmber,
    opacity: 1,
  },
  aiText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.companionAmber,
  },
  advanceBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  advanceText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphor,
  },
  nameWrap: { marginTop: 12, gap: 8 },
  nameInput: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.bright,
    borderWidth: 1,
    borderColor: colors.companionAmberDim,
    backgroundColor: colors.bg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nameBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.companionAmber,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  nameBtnIdle: { opacity: 0.35 },
  nameBtnText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    letterSpacing: 2,
    color: colors.companionAmber,
  },
});
