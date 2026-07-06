import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScanlineOverlay } from '../components/ScanlineOverlay';
import { HudBar } from '../components/HudBar';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { FieldScreen } from '../screens/FieldScreen';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { ATTUNEMENT_MAX } from '../config/economy';

type Tab = 'field' | 'lens' | 'reliquary';

const TABS: { key: Tab; label: string }[] = [
  { key: 'field', label: 'FIELD' },
  { key: 'lens', label: 'LENS' },
  { key: 'reliquary', label: 'RELIQUARY' },
];

export function AppShell(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('field');
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const attunement = useGameStore((s) => s.attunement);
  const xpToNext = useGameStore((s) => s.xpToNext());
  const register = useGameStore((s) => s.register());

  const xpFraction = xpToNext ? (xp - xpToNext.current) / (xpToNext.next - xpToNext.current) : 1;
  const xpRightLabel = xpToNext ? `${xp}/${xpToNext.next}` : 'MAX';

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>
            CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
          </Text>
          <View style={styles.hud}>
            <Text style={styles.hudText}>
              LVL <Text style={styles.hudValue}>{level}</Text>
            </Text>
            <Text style={styles.hudText}>
              XP <Text style={styles.hudValue}>{xp}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.bars}>
          <HudBar label="PROGRESS" rightLabel={xpRightLabel} fraction={xpFraction} fillColor={colors.phosphorDim} />
          <HudBar
            label="ATTUNEMENT"
            rightLabel={register}
            fraction={attunement / ATTUNEMENT_MAX}
            fillColor={colors.companionAmberDim}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {tab === 'field' && <FieldScreen />}
        {tab === 'lens' && <ComingSoonScreen label="LENS" milestone="M2" />}
        {tab === 'reliquary' && <ComingSoonScreen label="RELIQUARY" milestone="M3" />}
      </View>

      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 21,
    letterSpacing: 2,
    color: colors.bright,
  },
  hud: {
    flexDirection: 'row',
    gap: 10,
  },
  hudText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.phosphorDim,
  },
  hudValue: {
    color: colors.phosphor,
    fontFamily: fonts.bodyMedium,
  },
  bars: {
    flexDirection: 'row',
    gap: 10,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.neon,
  },
  tabText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphorDim,
  },
  tabTextActive: {
    color: colors.neon,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
