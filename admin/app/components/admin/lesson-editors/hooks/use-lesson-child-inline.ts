import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { learningAdminRepository } from '../../../../features/learning/api/learning-admin.repository'
import type { Lesson } from '../../../../features/learning/types'

export type ChildKind = 'contents' | 'vocabularies' | 'grammar'
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const FIELD_BY_KIND: Record<ChildKind, keyof Lesson> = {
  contents: 'contents',
  vocabularies: 'vocabularies',
  grammar: 'grammarRules',
}

const DEBOUNCE_MS = 600
const SAVED_FADE_MS = 1500

type Buffer = {
  pending: Record<string, unknown>
  timer: ReturnType<typeof setTimeout> | null
  promoting: boolean
}

export type InlineRow = { id: string; orderIndex: number }

export function useLessonChildInline<T extends InlineRow>({
  kind,
  lessonId,
  onPromote,
}: {
  kind: ChildKind
  lessonId: string
  onPromote?: (tempId: string, newId: string) => void
}) {
  const qc = useQueryClient()
  const field = FIELD_BY_KIND[kind]
  const lessonKey = ['admin-learning', 'lesson', lessonId] as const

  const buffersRef = useRef<Map<string, Buffer>>(new Map())
  const fadeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [states, setStates] = useState<Record<string, SaveState>>({})
  const onPromoteRef = useRef(onPromote)
  onPromoteRef.current = onPromote

  const { data: rows = [] } = useQuery({
    queryKey: lessonKey,
    queryFn: () => learningAdminRepository.getLesson(lessonId),
    enabled: !!lessonId,
    select: (lesson) => (((lesson?.[field] as unknown) as T[] | undefined) ?? []),
  })

  const getRows = useCallback((): T[] => {
    const lesson = qc.getQueryData<Lesson>(['admin-learning', 'lesson', lessonId])
    return ((lesson?.[field] as unknown) as T[] | undefined) ?? []
  }, [qc, field, lessonId])

  const setRows = useCallback(
    (fn: (rows: T[]) => T[]) => {
      qc.setQueryData<Lesson>(['admin-learning', 'lesson', lessonId], (lesson) => {
        if (!lesson) return lesson
        const current = ((lesson[field] as unknown) as T[]) ?? []
        return { ...lesson, [field]: fn(current) } as Lesson
      })
    },
    [qc, field, lessonId],
  )

  const setStateFor = useCallback((id: string, next: SaveState) => {
    setStates((prev) => {
      if (next === 'idle') {
        if (!(id in prev)) return prev
        const { [id]: _, ...rest } = prev
        return rest
      }
      if (prev[id] === next) return prev
      return { ...prev, [id]: next }
    })
    if (next === 'saved') {
      const existing = fadeTimersRef.current.get(id)
      if (existing) clearTimeout(existing)
      const t = setTimeout(() => {
        setStates((prev) => {
          if (!(id in prev)) return prev
          const { [id]: _, ...rest } = prev
          return rest
        })
        fadeTimersRef.current.delete(id)
      }, SAVED_FADE_MS)
      fadeTimersRef.current.set(id, t)
    }
  }, [])

  const flushRow = useCallback(
    async (id: string) => {
      const buf = buffersRef.current.get(id)
      if (!buf) return
      if (buf.promoting) return
      if (buf.timer) {
        clearTimeout(buf.timer)
        buf.timer = null
      }
      const payload = { ...buf.pending }
      buf.pending = {}
      const isTemp = id.startsWith('temp-')
      if (!isTemp && Object.keys(payload).length === 0) return
      setStateFor(id, 'saving')
      try {
        if (isTemp) {
          buf.promoting = true
          const draft = getRows().find((r) => r.id === id)
          const fullPayload: Record<string, unknown> = { ...(draft ?? {}), ...payload }
          delete fullPayload.id
          const created = (await learningAdminRepository.createLessonChild(
            kind,
            lessonId,
            fullPayload,
          )) as T
          buf.promoting = false
          // Migrate buffer to new id
          buffersRef.current.delete(id)
          if (Object.keys(buf.pending).length > 0) {
            buffersRef.current.set(created.id, {
              pending: { ...buf.pending },
              timer: null,
              promoting: false,
            })
          }
          setRows((arr) => arr.map((r) => (r.id === id ? created : r)))
          onPromoteRef.current?.(id, created.id)
          setStates((prev) => {
            const { [id]: _, ...rest } = prev
            return { ...rest, [created.id]: 'saved' }
          })
          const existing = fadeTimersRef.current.get(created.id)
          if (existing) clearTimeout(existing)
          const t = setTimeout(() => {
            setStates((prev) => {
              if (!(created.id in prev)) return prev
              const { [created.id]: _, ...rest } = prev
              return rest
            })
            fadeTimersRef.current.delete(created.id)
          }, SAVED_FADE_MS)
          fadeTimersRef.current.set(created.id, t)
          // Flush any patches that came in during promotion
          const followup = buffersRef.current.get(created.id)
          if (followup && Object.keys(followup.pending).length > 0) {
            followup.timer = setTimeout(() => flushRow(created.id), DEBOUNCE_MS)
          }
        } else {
          await learningAdminRepository.updateLessonChild(kind, id, payload)
          setStateFor(id, 'saved')
        }
      } catch (err) {
        buf.promoting = false
        await qc.invalidateQueries({ queryKey: ['admin-learning', 'lesson', lessonId] })
        setStateFor(id, 'error')
      }
    },
    [kind, lessonId, qc, getRows, setRows, setStateFor],
  )

  const patch = useCallback(
    (id: string, partial: Partial<T>) => {
      setRows((arr) => arr.map((r) => (r.id === id ? { ...r, ...partial } : r)))
      const buf =
        buffersRef.current.get(id) ?? { pending: {}, timer: null, promoting: false }
      buf.pending = { ...buf.pending, ...(partial as Record<string, unknown>) }
      if (buf.timer) clearTimeout(buf.timer)
      if (!buf.promoting) {
        buf.timer = setTimeout(() => flushRow(id), DEBOUNCE_MS)
      }
      buffersRef.current.set(id, buf)
    },
    [setRows, flushRow],
  )

  const createDraft = useCallback(
    async (defaults: Partial<T>) => {
      const tempId = `temp-${Math.random().toString(36).slice(2, 10)}`
      const current = getRows()
      const maxOrder = current.reduce((m, r) => Math.max(m, r.orderIndex), -1)
      const draft = { id: tempId, orderIndex: maxOrder + 1, ...defaults } as T
      setRows((arr) => [...arr, draft])
      return tempId
    },
    [getRows, setRows],
  )

  const remove = useCallback(
    async (id: string) => {
      const current = getRows()
      const snapshot = current.find((r) => r.id === id)
      const buf = buffersRef.current.get(id)
      if (buf?.timer) clearTimeout(buf.timer)
      buffersRef.current.delete(id)
      const fadeTimer = fadeTimersRef.current.get(id)
      if (fadeTimer) clearTimeout(fadeTimer)
      fadeTimersRef.current.delete(id)
      setRows((arr) => arr.filter((r) => r.id !== id))
      setStateFor(id, 'idle')
      if (id.startsWith('temp-')) return
      try {
        await learningAdminRepository.deleteLessonChild(kind, id)
      } catch (err) {
        if (snapshot) {
          setRows((arr) => [...arr, snapshot].sort((a, b) => a.orderIndex - b.orderIndex))
        }
        throw err
      }
    },
    [kind, getRows, setRows, setStateFor],
  )

  const reorder = useCallback(
    async (fromId: string, toId: string) => {
      if (fromId === toId) return
      const current = getRows()
      const fromIdx = current.findIndex((r) => r.id === fromId)
      const toIdx = current.findIndex((r) => r.id === toId)
      if (fromIdx < 0 || toIdx < 0) return
      const moved = arrayMove(current, fromIdx, toIdx)
      const reindexed = moved.map((r, i) => ({ ...r, orderIndex: i }))
      setRows(() => reindexed)
      try {
        const changed = reindexed.filter((r, i) => current.find((c) => c.id === r.id)?.orderIndex !== i)
        await Promise.all(
          changed
            .filter((r) => !r.id.startsWith('temp-'))
            .map((r) =>
              learningAdminRepository.updateLessonChild(kind, r.id, { orderIndex: r.orderIndex }),
            ),
        )
      } catch (err) {
        setRows(() => current)
        await qc.invalidateQueries({ queryKey: ['admin-learning', 'lesson', lessonId] })
      }
    },
    [kind, qc, getRows, setRows],
  )

  const saveStateOf = useCallback((id: string): SaveState => states[id] ?? 'idle', [states])

  useEffect(() => {
    const buffers = buffersRef.current
    const fadeTimers = fadeTimersRef.current
    return () => {
      buffers.forEach((b) => {
        if (b.timer) clearTimeout(b.timer)
      })
      fadeTimers.forEach((t) => clearTimeout(t))
    }
  }, [])

  return {
    rows,
    patch,
    createDraft,
    remove,
    reorder,
    saveStateOf,
    flush: flushRow,
  }
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = arr.slice()
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}
