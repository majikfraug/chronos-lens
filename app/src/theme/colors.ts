/** Palette from docs/brief.md §6. Dark only — no light variant. */
export const colors = {
  bg: '#0B0E0B',
  panel: '#10140F',
  panel2: '#151A13',
  line: '#2A3326',
  phosphor: '#9DB89A',
  phosphorDim: '#5A6B52',
  phosphorFaint: '#39452F',
  companionAmber: '#D9C98A',
  companionAmberDim: '#8A7F58',
  neon: '#71E8C9',
  interestAmber: '#E0A85C',
  warn: '#D98A6A',
  bright: '#E8EBD9',
  somberViolet: '#7a6f9a',
  discover: '#C9A6E8',
} as const;

export type MoodColor = 'neutral' | 'curious' | 'somber' | 'warm' | 'query';

export function moodBorderColor(mood: MoodColor): string {
  switch (mood) {
    case 'warm':
      return colors.neon;
    case 'somber':
      return colors.somberViolet;
    case 'query':
      return colors.interestAmber;
    case 'curious':
    case 'neutral':
    default:
      return colors.companionAmberDim;
  }
}
