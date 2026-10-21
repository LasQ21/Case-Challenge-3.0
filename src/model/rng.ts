// mulberry32: швидкий 32-бітний seeded PRNG. Однаковий seed → однакова послідовність.
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Стандартна нормальна величина (Box–Muller). Завжди бере рівно два числа з rng,
// щоб послідовність лишалася синхронною між режимами (common random numbers).
export function standardNormal(rng: Rng): number {
  const u1 = 1 - rng()
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// Трикутний розподіл через обернену функцію розподілу від рівномірного u ∈ [0, 1).
export function triangular(u: number, min: number, mode: number, max: number): number {
  if (max <= min) return min
  const f = (mode - min) / (max - min)
  return u < f
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}
