#!/usr/bin/env node
/**
 * Renders the Chronos-Lens audio stems as WAV files.
 *
 * This script IS the §7 audio constitution (docs/brief.md) in executable
 * form — a direct port of the prototype's Snd module (prototypes/
 * chronos-lens-v1.html): sine/triangle oscillators, RBJ biquad low/band-pass
 * filters, the same envelopes, frequencies, and mix levels. Expo Go cannot run
 * react-native-audio-api (needs a dev build), so v1 ships these rendered stems
 * played via expo-audio; when the project moves to a dev client the same
 * parameters transfer to live synthesis. See docs/decisions.md (2026-07-07).
 *
 * Usage: node tools/render-audio-stems.mjs
 * Output: app/assets/audio/*.wav (22.05 kHz mono 16-bit — everything in the
 * spec is lowpassed ≤ ~1.1 kHz except clicks/hiss, so 22k is transparent).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const MASTER = 0.5; // prototype master gain baked into the stems
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'assets', 'audio');

/* ---------- primitives ---------- */

function buf(seconds) {
  return new Float64Array(Math.ceil(seconds * SR));
}

function mixInto(target, source, atSec, gain = 1) {
  const off = Math.round(atSec * SR);
  for (let i = 0; i < source.length && off + i < target.length; i++) {
    target[off + i] += source[i] * gain;
  }
}

function osc(type, dur, f0, f1 = f0) {
  const out = buf(dur);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    const f = f0 + (f1 - f0) * t; // linear glide, as linearRampToValueAtTime
    phase += (2 * Math.PI * f) / SR;
    if (type === 'sine') out[i] = Math.sin(phase);
    else if (type === 'triangle') out[i] = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (type === 'square') out[i] = Math.sign(Math.sin(phase));
  }
  return out;
}

function noise(dur) {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
  return out;
}

/** RBJ cookbook biquad, applied in place. */
function biquad(samples, kind, freq, Q = 0.707) {
  const w = (2 * Math.PI * freq) / SR;
  const cosw = Math.cos(w);
  const alpha = Math.sin(w) / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (kind === 'lowpass') {
    b0 = (1 - cosw) / 2; b1 = 1 - cosw; b2 = (1 - cosw) / 2;
    a0 = 1 + alpha; a1 = -2 * cosw; a2 = 1 - alpha;
  } else {
    // bandpass, constant peak gain
    b0 = alpha; b1 = 0; b2 = -alpha;
    a0 = 1 + alpha; a1 = -2 * cosw; a2 = 1 - alpha;
  }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    samples[i] = y0;
  }
  return samples;
}

/** Prototype tone() envelope: 40ms linear attack, hold, setTargetAtTime-style exp release. */
function toneEnv(samples, dur, vol) {
  const atk = 0.04 * SR;
  const relStart = Math.max(0, (dur - 0.06) * SR);
  const tau = 0.05 * SR;
  for (let i = 0; i < samples.length; i++) {
    let g;
    if (i < atk) g = vol * (i / atk);
    else if (i < relStart) g = vol;
    else g = vol * Math.exp(-(i - relStart) / tau);
    samples[i] *= g;
  }
  return samples;
}

/** Prototype hiss() envelope: rise over 30% of dur, exponential decay to ~nothing. */
function hissEnv(samples, dur, vol) {
  const rise = 0.3 * dur * SR;
  const total = dur * SR;
  const tau = (total - rise) / Math.log(vol / 0.0006);
  for (let i = 0; i < samples.length; i++) {
    samples[i] *= i < rise ? vol * (i / rise) : vol * Math.exp(-(i - rise) / tau);
  }
  return samples;
}

/* ---------- prototype voices ---------- */

function tone(f, dur, vol, type = 'sine', glide = f) {
  const s = osc(type, dur + 0.08, f, glide);
  biquad(s, 'lowpass', 1100);
  return toneEnv(s, dur, vol);
}

function click(vol = 0.07) {
  const s = noise(0.04);
  const decay = 0.02 * SR;
  for (let i = 0; i < s.length; i++) s[i] *= vol * Math.exp((-i / decay) * 5);
  return biquad(s, 'bandpass', 2200, 2);
}

function hiss(dur, vol = 0.06, f = 1200, q = 0.7) {
  const s = noise(dur + 0.05);
  biquad(s, 'bandpass', f, q);
  return hissEnv(s, dur, vol);
}

/* ---------- stems ---------- */

const stems = {};

// Bed: sines 52+78Hz through slow-LFO lowpass + faint bandpassed noise (§7).
// 8s seamless loop — 52·8 and 78·8 are integer cycle counts, LFO runs exactly
// one period, noise tail crossfades into its head.
stems.ambient = (() => {
  const dur = 8;
  const out = buf(dur);
  const s52 = osc('sine', dur, 52);
  const s78 = osc('sine', dur, 78);
  const drone = buf(dur);
  for (let i = 0; i < drone.length; i++) drone[i] = s52[i] + s78[i];
  // slow-LFO lowpass: cutoff 200±60Hz at 1/8 Hz — approximated in 16 blocks
  const blocks = 16;
  const blockLen = Math.floor(drone.length / blocks);
  for (let b = 0; b < blocks; b++) {
    const cutoff = 200 + 60 * Math.sin((2 * Math.PI * b) / blocks);
    const seg = drone.subarray(b * blockLen, b === blocks - 1 ? drone.length : (b + 1) * blockLen);
    biquad(seg, 'lowpass', cutoff);
  }
  const n = noise(dur);
  biquad(n, 'bandpass', 1400, 0.4);
  for (let i = 0; i < out.length; i++) out[i] = (drone[i] + n[i] * 0.35) * 0.02;
  // crossfade last 0.5s into first 0.5s for a clean loop seam
  const xf = Math.floor(0.5 * SR);
  for (let i = 0; i < xf; i++) {
    const a = i / xf;
    out[i] = out[i] * a + out[out.length - xf + i] * (1 - a);
  }
  return out.subarray(0, out.length - xf);
})();

// Scan: low hum with rising partial + rhythmic relay clacking, ~9 clicks / 2.2s (§7).
stems.scan = (() => {
  const dur = 2.4;
  const out = buf(dur);
  const hum = osc('sine', dur, 64);
  biquad(hum, 'lowpass', 400);
  const rise = osc('sine', dur, 96, 132); // rising partial as stabilization proceeds
  biquad(rise, 'lowpass', 400);
  for (let i = 0; i < out.length; i++) {
    const g = Math.min(1, i / (0.15 * SR)) * 0.08; // 150ms fade-in like scanLoopStart
    out[i] = hum[i] * g + rise[i] * g * 0.35;
  }
  for (let t = 0; t < dur - 0.1; t += 0.11) {
    mixInto(out, click(0.05), t);
    if (Math.random() < 0.4) mixInto(out, click(0.04), t + 0.05);
  }
  return out;
})();

stems.resolve = (() => {
  const out = buf(0.7);
  mixInto(out, click(0.07), 0);
  mixInto(out, tone(196, 0.4, 0.1, 'triangle'), 0);
  mixInto(out, tone(294, 0.4, 0.07, 'sine'), 0.08);
  return out;
})();

stems.file = (() => {
  const out = buf(0.6);
  mixInto(out, click(0.06), 0);
  mixInto(out, tone(120, 0.4, 0.09, 'sine', 150), 0);
  return out;
})();

stems.discard = (() => {
  const out = buf(0.5);
  mixInto(out, tone(150, 0.35, 0.08, 'sine', 90), 0);
  return out;
})();

stems.discover = (() => {
  const out = buf(0.8);
  mixInto(out, click(0.07), 0);
  mixInto(out, tone(120, 0.5, 0.1, 'sine', 150), 0);
  mixInto(out, hiss(0.5, 0.05, 1600, 0.6), 0.05);
  return out;
})();

stems.levelup = (() => {
  const out = buf(1.6);
  mixInto(out, tone(110, 1.2, 0.1, 'sine'), 0);
  mixInto(out, tone(165, 1.2, 0.08, 'sine'), 0.1);
  mixInto(out, tone(220, 1.1, 0.06, 'sine'), 0.25);
  mixInto(out, hiss(1.1, 0.04, 900, 0.6), 0);
  return out;
})();

stems.sync = (() => {
  const out = buf(1.0);
  for (let i = 0; i < 7; i++) {
    mixInto(out, click(0.05), i * 0.06);
    mixInto(out, tone(440, 0.04, 0.05, 'square'), i * 0.06);
  }
  mixInto(out, tone(70, 0.5, 0.09, 'sine'), 0.3);
  return out;
})();

stems.deplete = (() => {
  const out = buf(0.6);
  mixInto(out, tone(150, 0.4, 0.09, 'sine', 90), 0);
  return out;
})();

// Voice: relay click, 2 clean triangle tones (contour by mood), tape-hiss bed
// that THINS as mood warms — cold=hissy, warm=clear (§7).
for (const [mood, base, hissVol] of [
  ['neutral', 168, 0.06],
  ['curious', 190, 0.06],
  ['somber', 150, 0.06],
  ['warm', 200, 0.03],
]) {
  stems[`voice_${mood}`] = (() => {
    const out = buf(0.9);
    mixInto(out, click(0.06), 0);
    let when = 0.04;
    for (let i = 0; i < 2; i++) {
      const f =
        mood === 'curious' ? base * (1 + 0.12 * i)
        : mood === 'somber' ? base * (1 - 0.08 * i)
        : base * (1 + (i % 2 ? 0.04 : 0));
      mixInto(out, tone(f, 0.16, 0.1, 'triangle'), when);
      when += 0.2;
    }
    mixInto(out, hiss(when + 0.1, hissVol, 1300, 0.7), 0);
    return out;
  })();
}

/* ---------- write WAVs ---------- */

function writeWav(path, samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * MASTER));
    pcm[i] = Math.round(v * 32767);
  }
  const dataSize = pcm.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  writeFileSync(path, Buffer.concat([header, Buffer.from(pcm.buffer)]));
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(stems)) {
  const path = join(OUT_DIR, `${name}.wav`);
  writeWav(path, samples);
  console.log(`${name}.wav  ${(samples.length / SR).toFixed(2)}s  ${Math.round((samples.length * 2 + 44) / 1024)}KB`);
}
console.log(`\nwrote ${Object.keys(stems).length} stems to ${OUT_DIR}`);
