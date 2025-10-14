// ZzFX - Zuper Zmall Zound Zynth
// This is a compact version of zzfx.
// Full documentation and credits: https://github.com/KilledByAPixel/zzfx

// ZzFXMicro - Zuper Zmall Zound Zynth Micro v1.1.5
// @ts-nocheck
const zzfxV = .3; // volume

// FIX: Changed signature to (volume, ...z) to correctly handle parameters.
// This prevents a crash caused by misaligned arguments where a float was
// passed as the number of channels. All internal indices were decremented
// by 1 to match the new `z` array, and the volume is now applied.
const zzfx = (volume = zzfxV, ...z) => {
  let a = new AudioContext(),
    b = a.createBufferSource(),
    c = a.createBuffer(z[5] || 1, 44100 * (z[3] || 1) + (z[4] || 0), 44100),
    d = c.getChannelData(0),
    e = 0,
    f = 0,
    g = 0,
    h = 1,
    i = 0,
    j = 0,
    k = 0,
    l = 1,
    m = z[11] || 0,
    n = (z[3] || 1) + (z[4] || 0),
    o = (z[12] || 0) * 44100,
    p = (z[13] || 0) * 44100,
    q = (z[14] || 0) * 44100,
    r = z[15] || 0,
    s = z[0] || 0,
    t = 2 * Math.PI,
    u = z[16] || 0,
    v = z[17] || 0,
    w = z[18] || 0,
    x = z[19] || 0,
    y = x / (44100 * t);
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
  slash: () => zzfx(zzfxV, 0, 90, , .01, .03, 1, .1, -0.1, , , , .02, , , , .4),
  // A short, low-pitched thump, indicating a successful hit.
  hit: () => zzfx(zzfxV, 0.01, 120, .02, .02, .01, 1, .3, -9.5, , , , , , .1, , .6, .02),
  // A descending arpeggio with noise for casting a fire spell.
  fireball: () => zzfx(zzfxV, 0.2, 220, .02, .22, .5, 1, 1.3, -2.8, , , , .08, , .1, , .5, .02, .2),
  // An ascending arpeggio for healing effects.
  heal: () => zzfx(zzfxV, 0.05, 220, .03, .18, .3, 1, 1.5, 5.8, -0.1, , , .08, , .1, .1, .8, .04),
  // A short, triumphant melodic fanfare for victory.
  victory: () => zzfx(zzfxV * 1.5, 0.5, 440, .1, .3, .4, 3, 2.2, , , , , , .2, , .2, .1, .8, .05),
  // A crackly, repetitive noise sound for ongoing burn damage.
  burn: () => zzfx(zzfxV * 0.5, 0, 40, .01, .01, .3, 4, , , , , , .1, , , .2, , .6, .1),
  // A high-pitched "zip" sound for a missed attack.
  miss: () => zzfx(zzfxV, 0, 880, .01, , .1, 2, 2.3, 1.7),
};