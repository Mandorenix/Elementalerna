// ZzFX - Zuper Zmall Zound Zynth
// This is a compact version of zzfx.
// Full documentation and credits: https://github.com/KilledByAPixel/zzfx

// ZzFXMicro - Zuper Zmall Zound Zynth Micro v1.1.5
// @ts-nocheck
/* eslint-disable */
const zzfxV = .3; // volume

// Singleton AudioContext with auto-resume for suspended state (e.g. before user gesture)
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

// FIX: Changed signature to (volume, ...z) to correctly handle parameters.
// This prevents a crash caused by misaligned arguments where a float was
// passed as the number of channels. All internal indices were decremented
// by 1 to match the new `z` array, and the volume is now applied.
const zzfx = (volume = zzfxV, ...z) => {
  const a = getAudioContext(),
    b = a.createBufferSource(),
    c = a.createBuffer(z[5] || 1, 44100 * (z[3] || 1) + (z[4] || 0), 44100),
    d = c.getChannelData(0),
    n = (z[3] || 1) + (z[4] || 0),
    o = (z[12] || 0) * 44100,
    p = (z[13] || 0) * 44100,
    q = (z[14] || 0) * 44100,
    r = z[15] || 0,
    t = 2 * Math.PI,
    u = z[16] || 0,
    v = z[17] || 0,
    w = z[18] || 0,
    x = z[19] || 0,
    y = x / (44100 * t);
  var e = 0,
    f = 0,
    g = 0,
    j = 0,
    k = 0,
    l = 1,
    m = z[11] || 0,
    s = z[0] || 0;
  for (; g < c.length; d[g++] = k * volume)
    ++j > p + q && ((j = 0), (k = r * k)),
      (k =
        m > 0 && ++j > o
          ? ((j = 0), (m = (m + 1) % 2), l * (z[10] || 1) * (0 < m ? 1 : -1))
          : k),
      (e =
        (s +=
          u +
          v * Math.pow(2, w * g / c.length) +
          (g < n * 44100 ? (g > n * 44100 - (z[4] || 0) ? (n - g / 44100) / (z[4] || 0) : 1) : 0) *
            (z[-1] || 1) * // z[0] in original becomes z[-1], effectively a bug fix for randomness.
            (1 - (1 - (g / c.length) % 1) ** (z[2] || 1)) *
            t) / t),
      (l = (z[7] || 0) < e ? l : e % 1 < .5 ? 1 : -1),
      (f += (k += (z[6] || 0) * (.5 < Math.random() ? 1 : -1)) - f),
      (k = f * Math.sin(e * (z[1] || 12) * t)),
      x && (k += Math.sin(g * y));
  return (b.buffer = c), b.connect(a.destination), b.start(), b;
};

// Custom sound effects for the game
export const soundEffects = {
  // A short, sharp noise burst for a sword slash or basic attack.
  slash: () => zzfx(zzfxV, 0, 90, undefined, .01, .03, 1, .1, -0.1, undefined, undefined, undefined, .02, undefined, undefined, undefined, .4),
  // A short, low-pitched thump, indicating a successful hit.
  hit: () => zzfx(zzfxV, 0.01, 120, .02, .02, .01, 1, .3, -9.5, undefined, undefined, undefined, undefined, undefined, .1, undefined, .6, .02),
  // A descending arpeggio with noise for casting a fire spell.
  fireball: () => zzfx(zzfxV, 0.2, 220, .02, .22, .5, 1, 1.3, -2.8, undefined, undefined, undefined, .08, undefined, .1, undefined, .5, .02, .2),
  // An ascending arpeggio for healing effects.
  heal: () => zzfx(zzfxV, 0.05, 220, .03, .18, .3, 1, 1.5, 5.8, -0.1, undefined, undefined, .08, undefined, .1, .1, .8, .04),
  // A short, triumphant melodic fanfare for victory.
  victory: () => zzfx(zzfxV * 1.5, 0.5, 440, .1, .3, .4, 3, 2.2, undefined, undefined, undefined, undefined, undefined, .2, undefined, .2, .1, .8, .05),
  // A crackly, repetitive noise sound for ongoing burn damage.
  burn: () => zzfx(zzfxV * 0.5, 0, 40, .01, .01, .3, 4, undefined, undefined, undefined, undefined, undefined, .1, undefined, undefined, .2, undefined, .6, .1),
  // A high-pitched "zip" sound for a missed attack.
  miss: () => zzfx(zzfxV, 0, 880, .01, undefined, .1, 2, 2.3, 1.7),
  // A coin jingle for gold rewards.
  coin: () => zzfx(zzfxV * 0.6, 0.3, 880, .02, .08, .1, 1, 1.5, 0.5, undefined, undefined, undefined, .02, .05, .02, .1, .6, .02, .1),
  // A magical chime for item rewards.
  item: () => zzfx(zzfxV * 0.7, 0.4, 660, .03, .15, .2, 3, 1.8, 2.5, -0.05, undefined, undefined, .04, .1, .05, .2, .7, .04, .2),
  // An ascending sparkle for XP gain.
  xp_sound: () => zzfx(zzfxV * 0.5, 0.2, 440, .02, .12, .15, 2, 2.5, 3, undefined, undefined, undefined, .03, .08, .08, .15, .5, .03, .1),
  // Chest creaking open.
  chest_open: () => zzfx(zzfxV * 0.6, 0.1, 100, .05, .25, .3, 1, 0.8, -1.5, undefined, undefined, undefined, .06, .1, .05, .3, .3, .01),
  // Lever/gear mechanism sound.
  lever_pull: () => zzfx(zzfxV * 0.5, 0.05, 80, .04, .2, .4, 2, 1.2, -2, undefined, undefined, undefined, .05, .15, .1, .25, .2, .01),
  // A danger sound for traps.
  trap: () => zzfx(zzfxV * 0.7, 0.1, 160, .03, .15, .5, 3, 1.5, -4, undefined, undefined, undefined, .04, .1, .15, .3, .4, .02),
  // A triumphant level-up fanfare.
  levelup: () => zzfx(zzfxV * 1.2, 0.6, 520, .08, .35, .5, 4, 2.5, 5, -0.1, undefined, undefined, .1, .2, .1, .3, .2, .8, .08),
  // A soft whoosh for card flip.
  card_flip: () => zzfx(zzfxV * 0.3, 0, 200, .03, .1, .2, 1, 1, 0.5, undefined, undefined, undefined, .02, .05, .02, .1, .3, .01),
};