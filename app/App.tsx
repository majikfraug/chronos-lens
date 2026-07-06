import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from './src/navigation/AppShell';
import { useGameStore } from './src/state/gameStore';
import { colors } from './src/theme/colors';
import { fonts, useAppFonts } from './src/theme/typography';

export default function App(): React.JSX.Element {
  const fontsLoaded = useAppFonts();
  const hydrate = useGameStore((s) => s.hydrate);
  const hydrated = useGameStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootLine}>CHRONOS-LENS · CALIBRATING …</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppShell />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootLine: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphorDim,
  },
});
