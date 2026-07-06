import { useFonts, VT323_400Regular } from '@expo-google-fonts/vt323';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

/** VT323 for display/wordmark; IBM Plex Mono for everything else. See brief §6. */
export const fonts = {
  display: 'VT323_400Regular',
  body: 'IBMPlexMono_400Regular',
  bodyMedium: 'IBMPlexMono_500Medium',
} as const;

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    VT323_400Regular,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  return loaded;
}

/** Letter-spaced uppercase labels, per brief §6. */
export const labelStyle = {
  fontFamily: fonts.body,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
};
