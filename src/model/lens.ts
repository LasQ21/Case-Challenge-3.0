// Лінза пріоритетів (PLAN.md, розділ 6). Пріоритет = добуток оцінок (∏ score^w).
import {
  COMPANY_IDS,
  CRITERIA,
  LENS_LIMITS,
  MC_LIMITS,
  type CompanyId,
  type LensScores,
  type LensWeights,
} from './config'
import { mulberry32 } from './rng'

export function priority(
  scores: Record<string, number>,
  weights?: LensWeights,
): number {
  let p = 1
  for (const c of CRITERIA) p *= scores[c.id] ** (weights ? weights[c.id] : 1)
  return p
}

export function priorities(lens: LensScores, weights?: LensWeights): Record<CompanyId, number> {
  return {
    sec: priority(lens.sec, weights),
    it: priority(lens.it, weights),
    ecom: priority(lens.ecom, weights),
  }
}

export function ranking(lens: LensScores, weights?: LensWeights): CompanyId[] {
  const p = priorities(lens, weights)
  return [...COMPANY_IDS].sort((x, y) => p[y] - p[x])
}

const clampScore = (v: number) => Math.min(LENS_LIMITS.scoreMax, Math.max(LENS_LIMITS.scoreMin, v))

// Тест стійкості: до кожної оцінки додаємо ціле з [−jitter, +jitter], обрізаємо до [1, 5].
// Нічия ділить перше місце порівну між лідерами.
export function robustness(
  lens: LensScores,
  weights: LensWeights | undefined,
  runs: number = LENS_LIMITS.robustnessRuns,
  seed: number = MC_LIMITS.defaultSeed,
): Record<CompanyId, number> {
  const rng = mulberry32(seed)
  const span = 2 * LENS_LIMITS.jitter + 1
  const wins: Record<CompanyId, number> = { sec: 0, it: 0, ecom: 0 }
  const noisy: Record<string, number> = {}
  for (let r = 0; r < runs; r++) {
    let best = -Infinity
    const leaders: CompanyId[] = []
    for (const id of COMPANY_IDS) {
      for (const c of CRITERIA) {
        noisy[c.id] = clampScore(lens[id][c.id] + Math.floor(rng() * span) - LENS_LIMITS.jitter)
      }
      const p = priority(noisy, weights)
      if (p > best) {
        best = p
        leaders.length = 0
        leaders.push(id)
      } else if (p === best) {
        leaders.push(id)
      }
    }
    for (const id of leaders) wins[id] += 1 / leaders.length
  }
  return { sec: wins.sec / runs, it: wins.it / runs, ecom: wins.ecom / runs }
}
