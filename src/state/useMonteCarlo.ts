import { useEffect, useRef, useState } from 'react'
import { MC_LIMITS } from '../model/config'
import type { McInput, McResult } from '../model/montecarlo'
import type { McRequest, McResponse } from '../workers/mc.worker'

// Запускає симуляцію у воркері з затримкою після останньої зміни; застарілі відповіді ігноруються
export function useMonteCarlo(input: McInput) {
  const workerRef = useRef<Worker | null>(null)
  const lastId = useRef(0)
  const [result, setResult] = useState<McResult | null>(null)
  const [ms, setMs] = useState<number | null>(null)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    const w = new Worker(new URL('../workers/mc.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<McResponse>) => {
      if (e.data.id !== lastId.current) return
      setResult(e.data.result)
      setMs(e.data.ms)
      setRunning(false)
    }
    workerRef.current = w
    return () => {
      w.terminate()
      workerRef.current = null
    }
  }, [])

  const key = JSON.stringify(input)
  useEffect(() => {
    const t = setTimeout(() => {
      const id = ++lastId.current
      setRunning(true)
      const req: McRequest = { id, input: JSON.parse(key) as McInput }
      workerRef.current?.postMessage(req)
    }, MC_LIMITS.debounceMs)
    return () => clearTimeout(t)
  }, [key])

  return { result, ms, running }
}
