/**
 * Live ambient synthesis — the instrument's hum (director 2026-08-27).
 *
 * Design brief: like a service robot that hums while wandering about its
 * duties — ambient, not a tune, and never a flat loop. Two detuned oscillators
 * wander slowly in pitch through a lowpass filter over a faint noise bed; the
 * phone's actual motion (expo-sensors DeviceMotion) stirs the hum — brighter
 * and more restless in the hand, settling toward a hush when the device rests.
 *
 * Runs on react-native-audio-api (native Web Audio). Where the native module
 * is absent (Expo Go), start() returns false and the engine falls back to the
 * pre-rendered ambient stem — engine.ts owns that decision.
 */

type AnyNode = {
  connect: (dest: unknown) => unknown;
  disconnect?: () => void;
};
type Param = {
  value: number;
  setValueAtTime: (v: number, t: number) => unknown;
  setTargetAtTime: (v: number, t: number, tc: number) => unknown;
};
type Osc = AnyNode & { frequency: Param; detune: Param; type: string; start: () => void; stop: () => void };
type Gain = AnyNode & { gain: Param };
type Filter = AnyNode & { frequency: Param; Q: Param; type: string };
type Ctx = {
  currentTime: number;
  destination: unknown;
  state?: string;
  resume?: () => Promise<void>;
  close?: () => Promise<void>;
  createOscillator: () => Osc;
  createGain: () => Gain;
  createBiquadFilter: () => Filter;
  createBufferSource: () => AnyNode & { buffer: unknown; loop: boolean; start: () => void; stop: () => void };
  createBuffer: (ch: number, len: number, rate: number) => {
    getChannelData: (ch: number) => Float32Array;
  };
};

const CENTER_HZ = 104; // wander center — low hum, below speech, above rumble
const IDLE_GAIN = 0.05;
const ACTIVE_GAIN = 0.15;
const PULSE_GAIN = 0.07;

class AmbientSynth {
  private ctx: Ctx | null = null;
  private master: Gain | null = null;
  private filter: Filter | null = null;
  private oscA: Osc | null = null;
  private oscB: Osc | null = null;
  private noiseGain: Gain | null = null;
  private muted = false;
  private running = false;
  private motionSub: { remove: () => void } | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private wanderTimer: ReturnType<typeof setTimeout> | null = null;

  /** Smoothed 0..1 activity envelope from device motion + walking speed. */
  private activity = 0;
  private motionRaw = 0;
  private walkBoost = 0;
  private pulseUntil = 0;
  private humHz = CENTER_HZ;

  start(): boolean {
    if (this.running) return true;
    try {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { AudioContext } = require('react-native-audio-api');
      const { DeviceMotion } = require('expo-sensors');
      /* eslint-enable @typescript-eslint/no-require-imports */
      const ctx: Ctx = new AudioContext();
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now); // fade in via the update loop
      master.connect(ctx.destination);

      // The hum: two oscillators a few cents apart — the beat between them is
      // the "alive" texture — through a lowpass that motion opens and closes.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      filter.Q.setValueAtTime(0.9, now);
      filter.connect(master);

      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(CENTER_HZ, now);
      const oscGainA = ctx.createGain();
      oscGainA.gain.setValueAtTime(0.6, now);
      oscA.connect(oscGainA);
      oscGainA.connect(filter);

      const oscB = ctx.createOscillator();
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(CENTER_HZ, now);
      oscB.detune.setValueAtTime(9, now); // ~9 cents sharp: slow beating
      const oscGainB = ctx.createGain();
      oscGainB.gain.setValueAtTime(0.35, now);
      oscB.connect(oscGainB);
      oscGainB.connect(filter);

      // Faint carrier-static bed under the hum (2s brown-noise loop).
      const rate = 44100;
      const buf = ctx.createBuffer(1, rate * 2, rate);
      const data = buf.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) {
        brown = (brown + (Math.random() * 2 - 1) * 0.02) * 0.996;
        data[i] = brown * 3.2;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(320, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);

      oscA.start();
      oscB.start();
      noise.start();

      this.ctx = ctx;
      this.master = master;
      this.filter = filter;
      this.oscA = oscA;
      this.oscB = oscB;
      this.noiseGain = noiseGain;
      this.running = true;

      // Motion input: rotation is the dominant "in the hand" signal.
      DeviceMotion.setUpdateInterval(250);
      this.motionSub = DeviceMotion.addListener(
        (m: { rotationRate?: { alpha: number; beta: number; gamma: number } | null }) => {
          const r = m.rotationRate;
          if (!r) return;
          const mag = Math.abs(r.alpha ?? 0) + Math.abs(r.beta ?? 0) + Math.abs(r.gamma ?? 0);
          // ~0 at rest; a phone in a moving hand reads tens of deg/s.
          this.motionRaw = Math.min(1, mag / 120);
        }
      );

      this.updateTimer = setInterval(() => this.update(), 300);
      this.scheduleWander();
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  /** The living part: smooth activity, steer gain/filter, glide the pitch. */
  private update(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.filter) return;
    const target = Math.max(this.motionRaw, this.walkBoost);
    // Fast attack, slow release — stirs quickly, settles gradually.
    const k = target > this.activity ? 0.45 : 0.06;
    this.activity += (target - this.activity) * k;

    const t = ctx.currentTime;
    const pulsing = Date.now() < this.pulseUntil;
    const gain = this.muted
      ? 0
      : IDLE_GAIN + this.activity * (ACTIVE_GAIN - IDLE_GAIN) + (pulsing ? PULSE_GAIN : 0);
    this.master.gain.setTargetAtTime(gain, t, 0.4);
    this.filter.frequency.setTargetAtTime(380 + this.activity * 760, t, 0.5);
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0.08 + this.activity * 0.1, t, 0.6);
  }

  /**
   * Pitch wander — the hum drifts to a new nearby frequency every few seconds,
   * more restlessly when the device is moving. Random walk, not a melody.
   */
  private scheduleWander(): void {
    if (!this.running) return;
    const idleMs = 3800 + Math.random() * 3200;
    const activeMs = 1800 + Math.random() * 1600;
    const wait = idleMs + (activeMs - idleMs) * this.activity;
    this.wanderTimer = setTimeout(() => {
      const ctx = this.ctx;
      if (ctx && this.oscA && this.oscB) {
        // Drift up to ±3 semitones per step, pulled gently back toward center.
        const step = (Math.random() * 2 - 1) * (1 + this.activity * 2);
        const semis = Math.max(-6, Math.min(6, 12 * Math.log2(this.humHz / CENTER_HZ) + step)) * 0.85;
        this.humHz = CENTER_HZ * Math.pow(2, semis / 12);
        const t = ctx.currentTime;
        const glide = 0.9 + Math.random() * 1.4;
        this.oscA.frequency.setTargetAtTime(this.humHz, t, glide);
        this.oscB.frequency.setTargetAtTime(this.humHz, t, glide);
      }
      this.scheduleWander();
    }, wait);
  }

  /** Survey activity (scan filed, ground discovered, answer kept): brief swell. */
  pulse(): void {
    this.pulseUntil = Date.now() + 2600;
  }

  /** Walking speed feeds the activity envelope alongside device motion. */
  setWalkSpeed(speedMs: number): void {
    const s = speedMs > 6 ? 0 : Math.min(2, Math.max(0, speedMs)); // vehicles: quiet
    this.walkBoost = (s / 2) * 0.55;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const ctx = this.ctx;
    if (ctx && this.master) this.master.gain.setTargetAtTime(muted ? 0 : IDLE_GAIN, ctx.currentTime, 0.15);
  }

  /** Resume after an audio-session interruption (foreground return, capture). */
  reassert(): void {
    void this.ctx?.resume?.().catch(() => {});
  }

  isRunning(): boolean {
    return this.running;
  }

  stop(): void {
    this.running = false;
    if (this.updateTimer) clearInterval(this.updateTimer);
    if (this.wanderTimer) clearTimeout(this.wanderTimer);
    this.updateTimer = null;
    this.wanderTimer = null;
    this.motionSub?.remove();
    this.motionSub = null;
    try {
      this.oscA?.stop();
      this.oscB?.stop();
      void this.ctx?.close?.();
    } catch {
      // teardown best-effort
    }
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.oscA = null;
    this.oscB = null;
    this.noiseGain = null;
  }
}

export const ambientSynth = new AmbientSynth();
