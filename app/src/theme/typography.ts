import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

/**
 * VT323 for display/wordmark; IBM Plex Mono for everything else (brief §6).
 * Press Start 2P is the HII voice only — the "boss" AI's thick Game-Boy-era
 * boot text, function over form, never updated in 10,000 years (director,
 * 2026-07-11). Do not use it for the companion or general UI.
 */
export const fonts = {
  display: 'VT323_400Regular',
  body: 'IBMPlexMono_400Regular',
  bodyMedium: 'IBMPlexMono_500Medium',
  hii: 'PressStart2P_400Regular',
} as const;

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    VT323_400Regular,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    PressStart2P_400Regular,
  });
  return loaded;
}

/** Letter-spaced uppercase labels, per brief §6. */
export const labelStyle = {
  fontFamily: fonts.body,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
};
