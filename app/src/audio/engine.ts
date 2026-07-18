import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

/**
 * The audio engine facade — game code only ever talks to this interface.
 *
 * Current implementation plays stems rendered offline by
 * tools/render-audio-stems.mjs (the §7 synth spec in executable form);
 * Expo Go cannot run react-native-audio-api, see docs/decisions.md
 * (2026-07-07). When a dev-client build lands, live synthesis swaps in
 * behind this same interface without touching call sites.
 */

export type SoundName =
  | 'resolve'
  | 'file'
  | 'discard'
  | 'discover'
  | 'levelup'
  | 'sync'
  | 'deplete';

export type VoiceMood = 'neutral' | 'curious' | 'somber' | 'warm';

 
const SOURCES: Record<string, number> = {
  ambient: require('../../assets/audio/ambient.wav'),
  scan: require('../../assets/audio/scan.wav'),
  resolve: require('../../assets/audio/resolve.wav'),
  file: require('../../assets/audio/file.wav'),
  discard: require('../../assets/audio/discard.wav'),
  discover: require('../../assets/audio/discover.wav'),
  levelup: require('../../assets/audio/levelup.wav'),
  sync: require('../../assets/audio/sync.wav'),
  deplete: require('../../assets/audio/deplete.wav'),
  voice_neutral: require('../../assets/audio/voice_neutral.wav'),
  voice_curious: require('../../assets/audio/voice_curious.wav'),
  voice_somber: require('../../assets/audio/voice_somber.wav'),
  voice_warm: require('../../assets/audio/voice_warm.wav'),
};
 

const AMBIENT_VOLUME = 0.8;

let started = false;
let muted = false;
let players: Record<string, AudioPlayer> | null = null;

/**
 * Reactive ambient (director 2026-07-18): the bed subtly responds to what the
 * player does — playback rate drifts with walking speed (pitch/tempo breathe),
 * volume swells briefly after survey activity and settles when idle. All
 * transitions glide; nothing jumps. True sensor-driven synthesis (inertia,
 * light) needs the live audio engine in the next dev build — docs/future.md.
 */
let ambientRateTarget = 1.0;
let lastActivityTs = 0;
let glideTimer: ReturnType<typeof setInterval> | null = null;

function startAmbientGlide(): void {
  if (glideTimer) return;
  glideTimer = setInterval(() => {
    const p = players;
    if (!p?.ambient || muted || !started) return;
    try {
      // Volume: brief swell after activity, slow settle toward hush when idle.
      const idleMs = Date.now() - lastActivityTs;
      const volTarget = idleMs < 30000 ? 0.92 : idleMs > 120000 ? 0.66 : AMBIENT_VOLUME;
      p.ambient.volume = p.ambient.volume + (volTarget - p.ambient.volume) * 0.08;
      // Rate: glide toward the movement-driven target (±1.5% — felt, not heard).
      const rate = p.ambient.playbackRate ?? 1;
      const next = rate + (ambientRateTarget - rate) * 0.05;
      if (Math.abs(next - rate) > 0.0005) p.ambient.setPlaybackRate(next);
    } catch {
      // player mid-teardown; next tick recovers
    }
  }, 700);
}

function getPlayers(): Record<string, AudioPlayer> | null {
  if (players) return players;
  try {
    players = {};
    for (const [name, source] of Object.entries(SOURCES)) {
      players[name] = createAudioPlayer(source);
    }
    players.ambient.loop = true;
    players.ambient.volume = 0;
    players.scan.loop = true;
  } catch {
    players = null; // stay silent rather than crash — audio is atmosphere, not function
  }
  return players;
}

function shoot(name: string): void {
  if (muted) return;
  const p = getPlayers();
  if (!p?.[name]) return;
  void p[name].seekTo(0);
  p[name].play();
}

function applyAudioMode(): void {
  void setAudioModeAsync({
    // Plays through the hardware silent switch: the instrument has its own mute
    // (header toggle), and respecting the switch made the app appear silently
    // broken to a tester whose phone lives in silent mode. Deviation from the
    // first reading of brief §7 — logged in docs/decisions.md (2026-07-07);
    // a settings toggle arrives with the M5 settings screen.
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    // Coexist with the camera's capture session instead of being killed by it —
    // without this, opening the Lens silences all playback on iOS.
    interruptionMode: 'mixWithOthers',
  }).catch(() => {});
}

export const audio = {
  /**
   * Initialize after first user interaction (brief §7: the bed fades in after
   * first interaction). Safe to call repeatedly.
   */
  kick(): void {
    if (started) return;
    started = true;
    applyAudioMode();
    // The session can be torn down while backgrounded or by other AV activity;
    // re-assert it whenever the app returns to the foreground.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') audio.reassert();
    });
    const p = getPlayers();
    if (!p) return;
    if (!muted) {
      p.ambient.volume = AMBIENT_VOLUME;
      p.ambient.play();
    }
    lastActivityTs = Date.now();
    startAmbientGlide();
  },

  /** Movement input for the reactive bed: walking speed bends the rate slightly. */
  ambientInput(input: { speedMs?: number }): void {
    if (input.speedMs == null) return;
    // 0 m/s → 0.985 (settled), 2 m/s brisk walk → 1.015 (brighter); vehicles neutral.
    const s = input.speedMs > 6 ? 0 : Math.min(2, Math.max(0, input.speedMs));
    ambientRateTarget = 0.985 + (s / 2) * 0.03;
  },

  /** Survey activity (scan filed, ground discovered, answer kept): brief swell. */
  ambientPulse(): void {
    lastActivityTs = Date.now();
  },

  /** Re-activate the audio session and resume the bed after an interruption. */
  reassert(): void {
    if (!started) return;
    applyAudioMode();
    const p = getPlayers();
    if (p && !muted && !p.ambient.playing) {
      p.ambient.volume = AMBIENT_VOLUME;
      p.ambient.play();
    }
  },

  play(name: SoundName): void {
    shoot(name);
  },

  voice(mood: VoiceMood): void {
    shoot(`voice_${mood}`);
  },

  scanStart(): void {
    if (muted) return;
    const p = getPlayers();
    if (!p) return;
    void p.scan.seekTo(0);
    p.scan.play();
  },

  scanStop(): void {
    const p = getPlayers();
    p?.scan.pause();
  },

  /** Returns the new muted state. */
  toggleMute(): boolean {
    muted = !muted;
    const p = getPlayers();
    if (p) {
      if (muted) {
        p.ambient.pause();
        p.scan.pause();
      } else if (started) {
        p.ambient.volume = AMBIENT_VOLUME;
        p.ambient.play();
      }
    }
    return muted;
  },

  isMuted(): boolean {
    return muted;
  },
};
