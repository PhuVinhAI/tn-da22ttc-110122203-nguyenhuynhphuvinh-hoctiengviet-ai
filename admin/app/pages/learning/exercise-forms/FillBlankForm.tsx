import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, X, Library } from 'lucide-react'
import { useAdminExercise } from '../../../features/learning/api/use-learning-admin'
import { useParams } from 'react-router'
import type { QuestionFormProps } from './types'
import { getOptionsObject } from './types'

type Part =
  | { id: string; kind: 'text'; value: string }
  | { id: string; kind: 'blank'; answers: string[] }

interface DraftState {
  parts: Part[]
  wordBank: string[]
}

const BLANK_MARKER = /_{3,}/g
let nextId = 1
const genId = () => `p-${nextId++}`

function partsFromSentence(sentence: string, accepted: string[][]): Part[] {
  if (!sentence) return [{ id: genId(), kind: 'text', value: '' }]
  const parts: Part[] = []
  let cursor = 0
  let blankIndex = 0
  for (const match of sentence.matchAll(BLANK_MARKER)) {
    if (match.index === undefined) continue
    if (match.index > cursor) {
      parts.push({ id: genId(), kind: 'text', value: sentence.slice(cursor, match.index) })
    }
    parts.push({
      id: genId(),
      kind: 'blank',
      answers: accepted[blankIndex] ?? [''],
    })
    cursor = match.index + match[0].length
    blankIndex++
  }
  if (cursor < sentence.length) {
    parts.push({ id: genId(), kind: 'text', value: sentence.slice(cursor) })
  }
  if (parts.length === 0 || parts[0].kind === 'blank') {
    parts.unshift({ id: genId(), kind: 'text', value: '' })
  }
  if (parts[parts.length - 1].kind === 'blank') {
    parts.push({ id: genId(), kind: 'text', value: '' })
  }
  return parts
}

function initialFromProps(initial: QuestionFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const sentence = String(opts.sentence ?? initial?.question ?? '')
  const accepted = Array.isArray(opts.acceptedAnswers)
    ? (opts.acceptedAnswers as unknown[]).map((g) =>
        Array.isArray(g) ? (g as unknown[]).map((s) => String(s)) : [String(g)],
      )
    : []
  const wordBank = Array.isArray(opts.wordBank)
    ? (opts.wordBank as unknown[]).map((s) => String(s)).filter(Boolean)
    : []
  return { parts: partsFromSentence(sentence, accepted), wordBank }
}

export function FillBlankForm({ initial, onChange }: QuestionFormProps) {
  const { exerciseId } = useParams()
  const { data: exercise } = useAdminExercise(exerciseId)
  const lessonVocab = exercise?.lesson?.vocabularies ?? []

  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))
  const [activeTextId, setActiveTextId] = useState<string | null>(null)
  const activeCursorRef = useRef<number | null>(null)

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const blanks = useMemo(
    () => state.parts.filter((p): p is Extract<Part, { kind: 'blank' }> => p.kind === 'blank'),
    [state.parts],
  )

  const payload = useMemo(() => {
    const sentence = state.parts
      .map((p) => (p.kind === 'text' ? p.value : '___'))
      .join('')
    const acceptedAnswers = blanks.map((b) => b.answers.filter(Boolean))
    const answers = blanks.map((b) => b.answers[0] ?? '')
    const bankSet = new Set<string>()
    for (const w of state.wordBank) {
      const t = w.trim()
      if (t) bankSet.add(t)
    }
    for (const a of answers) {
      const t = a.trim()
      if (t) bankSet.add(t)
    }
    const wordBank = Array.from(bankSet)
    return {
      question: null,
      options: {
        type: 'fill_blank' as const,
        sentence,
        blanks: blanks.length,
        acceptedAnswers,
        wordBank,
      },
      correctAnswer: { answers },
    }
  }, [state.parts, state.wordBank, blanks])

  const validate = () => {
    const sentence = payload.options.sentence.trim()
    if (!sentence && blanks.length === 0) return 'Hãy nhập câu có chỗ trống'
    if (blanks.length === 0) return 'Cần ít nhất 1 chỗ trống'
    if (blanks.some((b) => !b.answers.some((a) => a.trim())))
      return 'Mỗi chỗ trống cần ít nhất 1 đáp án'
    if (payload.options.wordBank.length < blanks.length)
      return 'Kho từ phải có đủ số từ cho các chỗ trống'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const setTextAt = (id: string, value: string) =>
    setState((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === id && p.kind === 'text' ? { ...p, value } : p,
      ),
    }))

  const setBlankAnswer = (id: string, answer: string) =>
    setState((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === id && p.kind === 'blank' ? { ...p, answers: [answer] } : p,
      ),
    }))

  const removeBlank = (id: string) =>
    setState((prev) => {
      const next = prev.parts.filter((p) => p.id !== id)
      const merged: Part[] = []
      for (const part of next) {
        const last = merged[merged.length - 1]
        if (last && last.kind === 'text' && part.kind === 'text') {
          merged[merged.length - 1] = {
            ...last,
            value: last.value + part.value,
          }
        } else {
          merged.push(part)
        }
      }
      if (merged.length === 0) merged.push({ id: genId(), kind: 'text', value: '' })
      if (merged[0].kind === 'blank') merged.unshift({ id: genId(), kind: 'text', value: '' })
      if (merged[merged.length - 1].kind === 'blank')
        merged.push({ id: genId(), kind: 'text', value: '' })
      return { ...prev, parts: merged }
    })

  /** Insert a blank with the given word as answer — at cursor or auto-find */
  const insertBlankWithWord = (word: string) => {
    setState((prev) => {
      const targetId = activeTextId ?? prev.parts[prev.parts.length - 1]?.id
      const cursor = activeCursorRef.current
      const idx = prev.parts.findIndex((p) => p.id === targetId)

      if (idx >= 0 && prev.parts[idx].kind === 'text') {
        const target = prev.parts[idx] as Extract<Part, { kind: 'text' }>
        const pos = cursor ?? target.value.indexOf(word)
        const safePos = pos >= 0 ? pos : target.value.length
        const before = target.value.slice(0, safePos)
        const after = target.value.slice(safePos)
        const next: Part[] = [
          ...prev.parts.slice(0, idx),
          { id: genId(), kind: 'text', value: before },
          { id: genId(), kind: 'blank', answers: [word] },
          { id: genId(), kind: 'text', value: after },
          ...prev.parts.slice(idx + 1),
        ]
        return { ...prev, parts: next }
      }

      // No active text — find first occurrence of word in any text part
      for (let i = 0; i < prev.parts.length; i++) {
        const part = prev.parts[i]
        if (part.kind !== 'text') continue
        const wIdx = part.value.indexOf(word)
        if (wIdx < 0) continue
        const before = part.value.slice(0, wIdx)
        const after = part.value.slice(wIdx + word.length)
        const next: Part[] = [
          ...prev.parts.slice(0, i),
          { id: genId(), kind: 'text', value: before },
          { id: genId(), kind: 'blank', answers: [word] },
          { id: genId(), kind: 'text', value: after },
          ...prev.parts.slice(i + 1),
        ]
        return { ...prev, parts: next }
      }

      // Word not found anywhere — append at end
      const last = prev.parts[prev.parts.length - 1]
      const next: Part[] = [...prev.parts]
      if (!last || last.kind === 'blank') {
        next.push({ id: genId(), kind: 'text', value: ' ' })
      }
      next.push({ id: genId(), kind: 'blank', answers: [word] })
      next.push({ id: genId(), kind: 'text', value: ' ' })
      return { ...prev, parts: next }
    })
  }

  const addWord = (word: string) => {
    const t = word.trim()
    if (!t) return
    setState((prev) =>
      prev.wordBank.some((w) => w.toLowerCase() === t.toLowerCase())
        ? prev
        : { ...prev, wordBank: [...prev.wordBank, t] },
    )
  }

  const removeWord = (word: string) =>
    setState((prev) => ({
      ...prev,
      wordBank: prev.wordBank.filter((w) => w !== word),
    }))

  const addAllVocab = () => {
    if (lessonVocab.length === 0) return
    setState((prev) => {
      const set = new Set(prev.wordBank.map((w) => w.toLowerCase()))
      const next = [...prev.wordBank]
      for (const v of lessonVocab) {
        const t = v.word?.trim()
        if (t && !set.has(t.toLowerCase())) {
          set.add(t.toLowerCase())
          next.push(t)
        }
      }
      return { ...prev, wordBank: next }
    })
  }

  // Sentence text used to check if a bank word exists in the sentence
  const sentenceText = useMemo(
    () => state.parts.filter((p): p is Extract<Part, { kind: 'text' }> => p.kind === 'text').map((p) => p.value).join(''),
    [state.parts],
  )

  const correctSet = new Set(
    blanks
      .map((b) => (b.answers[0] ?? '').trim().toLowerCase())
      .filter(Boolean),
  )

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-foreground">
          Câu có chỗ trống
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Nhập câu đầy đủ, rồi bấm vào từ ở kho từ bên dưới để biến từ đó thành chỗ trống
        </p>
      </div>

      <div className="rounded-lg border-2 border-border bg-card px-5 py-5">
        <div className="text-2xl font-semibold leading-relaxed text-foreground"
             style={{ wordBreak: 'break-word' }}>
          {state.parts.map((part, idx) =>
            part.kind === 'text' ? (
              <FlowingText
                key={part.id}
                value={part.value}
                onChange={(v) => setTextAt(part.id, v)}
                onFocus={() => setActiveTextId(part.id)}
                onSelectionChange={(pos) => {
                  activeCursorRef.current = pos
                }}
                placeholder={idx === 0 && part.value === '' ? 'Bắt đầu nhập câu...' : ''}
              />
            ) : (
              <BlankInput
                key={part.id}
                index={blanks.findIndex((b) => b.id === part.id)}
                answer={part.answers[0] ?? ''}
                onChange={(a) => setBlankAnswer(part.id, a)}
                onRemove={() => removeBlank(part.id)}
              />
            ),
          )}
        </div>
      </div>

      <WordBankEditor
        words={state.wordBank}
        correctSet={correctSet}
        sentenceText={sentenceText}
        onAdd={addWord}
        onRemove={removeWord}
        onWordClick={insertBlankWithWord}
        onAddAllVocab={addAllVocab}
        vocabCount={lessonVocab.length}
      />
    </div>
  )
}

function WordBankEditor({
  words,
  correctSet,
  sentenceText,
  onAdd,
  onRemove,
  onWordClick,
  onAddAllVocab,
  vocabCount,
}: {
  words: string[]
  correctSet: Set<string>
  sentenceText: string
  onAdd: (word: string) => void
  onRemove: (word: string) => void
  onWordClick: (word: string) => void
  onAddAllVocab: () => void
  vocabCount: number
}) {
  const [draft, setDraft] = useState('')
  const submit = () => {
    const t = draft.trim()
    if (!t) return
    onAdd(t)
    setDraft('')
  }
  return (
    <div className="rounded-lg border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Kho từ — bấm vào từ để tạo chỗ trống
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Từ xuất hiện trong câu sẽ được chèn thành ___ tại vị trí con trỏ khi bấm vào
          </p>
        </div>
        <button
          type="button"
          onClick={onAddAllVocab}
          disabled={vocabCount === 0}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={vocabCount === 0 ? 'Bài học chưa có từ vựng' : `Thêm ${vocabCount} từ của bài`}
        >
          <Library className="h-3.5 w-3.5" />
          Thêm tất cả từ vựng ({vocabCount})
        </button>
      </div>

      {words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => {
            const isAnswer = correctSet.has(w.trim().toLowerCase())
            const existsInSentence = sentenceText.indexOf(w) >= 0
            return (
              <span
                key={w}
                role={!isAnswer ? 'button' : undefined}
                tabIndex={!isAnswer ? 0 : undefined}
                onClick={!isAnswer ? () => onWordClick(w) : undefined}
                onKeyDown={
                  !isAnswer
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onWordClick(w)
                        }
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${
                  isAnswer
                    ? 'border-primary bg-primary/10 text-primary'
                    : existsInSentence
                      ? 'border-border bg-muted/50 text-foreground cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5'
                      : 'border-border bg-muted/50 text-foreground cursor-pointer hover:border-primary/50 hover:text-primary/70'
                }`}
              >
                {w}
                {isAnswer ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70">
                    đáp án
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(w)
                    }}
                    className="h-4 w-4 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:bg-destructive/15 hover:text-destructive"
                    aria-label={`Xóa từ ${w}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Thêm từ gây nhiễu rồi nhấn Enter..."
          className="flex-1 rounded-lg border-2 border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-primary"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border bg-card px-3 py-2 text-sm font-bold hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm từ
        </button>
      </div>
    </div>
  )
}

function FlowingText({
  value,
  onChange,
  onFocus,
  onSelectionChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
  onSelectionChange?: (pos: number) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>(20)

  useLayoutEffect(() => {
    if (measureRef.current) {
      const w = measureRef.current.offsetWidth
      setWidth(Math.max(w + 2, 8))
    }
  }, [value, placeholder])

  const measured = value.length > 0 ? value : placeholder ?? ''

  return (
    <>
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute whitespace-pre text-2xl font-semibold leading-relaxed"
        style={{ left: '-9999px', top: 0 }}
      >
        {measured}
      </span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          onSelectionChange?.(e.target.selectionStart ?? e.target.value.length)
        }}
        onFocus={(e) => {
          onFocus?.()
          onSelectionChange?.(e.target.selectionStart ?? e.target.value.length)
        }}
        onSelect={(e) => {
          const el = e.target as HTMLInputElement
          onSelectionChange?.(el.selectionStart ?? el.value.length)
        }}
        onKeyUp={(e) => {
          const el = e.target as HTMLInputElement
          onSelectionChange?.(el.selectionStart ?? el.value.length)
        }}
        placeholder={placeholder}
        style={{ width }}
        className="inline bg-transparent border-none outline-none p-0 m-0 text-2xl font-semibold leading-relaxed text-foreground placeholder:text-muted-foreground/40 placeholder:italic"
      />
    </>
  )
}

function BlankInput({
  index,
  answer,
  onChange,
  onRemove,
}: {
  index: number
  answer: string
  onChange: (a: string) => void
  onRemove: () => void
}) {
  const measureRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState<number>(60)
  useLayoutEffect(() => {
    if (measureRef.current) {
      setInputWidth(Math.max(measureRef.current.offsetWidth + 2, 60))
    }
  }, [answer])
  const measured = answer.length > 0 ? answer : 'đáp án'

  return (
    <span className="mx-0.5 inline-flex items-baseline gap-1.5 rounded-lg border-2 border-primary bg-primary/10 pl-2 pr-1.5 py-0.5 align-baseline">
      <span className="self-center flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">
        {index + 1}
      </span>
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute whitespace-pre text-2xl font-bold leading-relaxed"
        style={{ left: '-9999px', top: 0 }}
      >
        {measured}
      </span>
      <input
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="đáp án"
        style={{ width: inputWidth }}
        className="inline bg-transparent border-none outline-none p-0 m-0 text-2xl font-bold leading-relaxed text-primary placeholder:text-primary/50 placeholder:italic placeholder:font-semibold"
      />
      <button
        type="button"
        onClick={onRemove}
        className="self-center h-6 w-6 rounded-full text-primary/60 hover:bg-primary/10 hover:text-primary"
        aria-label="Xóa chỗ trống"
        title="Xóa chỗ trống"
      >
        <X className="h-3.5 w-3.5 mx-auto" />
      </button>
    </span>
  )
}
