import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaProvider>
        <SafeAreaView style={styles.boot}>
          <Text style={styles.bootLine}>CHRONOS-LENS · CALIBRATING …</Text>
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    // Keeps the header below the status bar / Dynamic Island and the transmit
    // row above the home indicator.
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <AppShell />
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
