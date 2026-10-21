// Монте-Карло у Web Worker, щоб UI не зависав
import { runMonteCarlo, type McInput, type McResult } from '../model/montecarlo'

export interface McRequest {
  id: number
  input: McInput
}

export interface McResponse {
  id: number
  result: McResult
  ms: number
}

self.onmessage = (e: MessageEvent<McRequest>) => {
  const t0 = performance.now()
  const result = runMonteCarlo(e.data.input)
  const msg: McResponse = { id: e.data.id, result, ms: performance.now() - t0 }
  ;(self as unknown as Worker).postMessage(msg)
}
