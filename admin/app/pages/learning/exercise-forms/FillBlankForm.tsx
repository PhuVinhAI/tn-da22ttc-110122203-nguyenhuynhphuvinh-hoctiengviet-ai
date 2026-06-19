import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, X, Trash2, Library } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
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
    // Auto-include every primary answer in wordBank so the bank always
    // contains at least the correct words. Distractors come from the user.
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

  const setBlankAnswers = (id: string, answers: string[]) =>
    setState((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === id && p.kind === 'blank'
          ? { ...p, answers: answers.length ? answers : [''] }
          : p,
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

  const insertBlank = () => {
    setState((prev) => {
      const targetId = activeTextId ?? prev.parts[prev.parts.length - 1]?.id
      const cursor = activeCursorRef.current
      const idx = prev.parts.findIndex((p) => p.id === targetId)
      if (idx < 0 || prev.parts[idx].kind !== 'text') {
        const last = prev.parts[prev.parts.length - 1]
        const next: Part[] = [...prev.parts]
        if (!last || last.kind === 'blank') {
          next.push({ id: genId(), kind: 'text', value: ' ' })
        }
        next.push({ id: genId(), kind: 'blank', answers: [''] })
        next.push({ id: genId(), kind: 'text', value: ' ' })
        return { ...prev, parts: next }
      }
      const target = prev.parts[idx] as Extract<Part, { kind: 'text' }>
      const pos = cursor ?? target.value.length
      const before = target.value.slice(0, pos)
      const after = target.value.slice(pos)
      const next: Part[] = [
        ...prev.parts.slice(0, idx),
        { id: genId(), kind: 'text', value: before },
        { id: genId(), kind: 'blank', answers: [''] },
        { id: genId(), kind: 'text', value: after },
        ...prev.parts.slice(idx + 1),
      ]
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

  // Words that already match a primary correct answer — pinned (cannot remove)
  const correctSet = new Set(
    blanks
      .map((b) => (b.answers[0] ?? '').trim().toLowerCase())
      .filter(Boolean),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Câu có chỗ trống
        </p>
        <p className="text-xs text-muted-foreground">
          Gõ câu rồi bấm <span className="font-bold">+ Thêm chỗ trống</span> để chèn ô đáp án tại con trỏ
        </p>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card px-5 py-5">
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
                answers={part.answers}
                onChange={(a) => setBlankAnswers(part.id, a)}
                onRemove={() => removeBlank(part.id)}
              />
            ),
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={insertBlank}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Thêm chỗ trống tại con trỏ
      </button>

      <WordBankEditor
        words={state.wordBank}
        correctSet={correctSet}
        onAdd={addWord}
        onRemove={removeWord}
        onAddAllVocab={addAllVocab}
        vocabCount={lessonVocab.length}
      />
    </div>
  )
}

function WordBankEditor({
  words,
  correctSet,
  onAdd,
  onRemove,
  onAddAllVocab,
  vocabCount,
}: {
  words: string[]
  correctSet: Set<string>
  onAdd: (word: string) => void
  onRemove: (word: string) => void
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
    <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Kho từ — học viên bấm chọn để điền
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Đáp án chính tự động có trong kho. Thêm các từ gây nhiễu để học viên phải lựa chọn.
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
            const isCorrect = correctSet.has(w.trim().toLowerCase())
            return (
              <span
                key={w}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-border bg-muted/50 text-foreground'
                }`}
              >
                {w}
                {isCorrect ? (
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider text-emerald-700/70 dark:text-emerald-300/70"
                    title="Đáp án — luôn nằm trong kho"
                  >
                    đáp án
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemove(w)}
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
          placeholder="Thêm một từ rồi nhấn Enter..."
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
  answers,
  onChange,
  onRemove,
}: {
  index: number
  answers: string[]
  onChange: (a: string[]) => void
  onRemove: () => void
}) {
  const primary = answers[0] ?? ''
  const variants = answers.slice(1)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState<number>(60)
  useLayoutEffect(() => {
    if (measureRef.current) {
      setInputWidth(Math.max(measureRef.current.offsetWidth + 2, 60))
    }
  }, [primary])
  const measured = primary.length > 0 ? primary : 'đáp án'

  return (
    <span className="mx-0.5 inline-flex items-baseline gap-1.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 pl-2 pr-1.5 py-0.5 align-baseline">
      <span className="self-center flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white tabular-nums">
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
        value={primary}
        onChange={(e) => onChange([e.target.value, ...variants])}
        placeholder="đáp án"
        style={{ width: inputWidth }}
        className="inline bg-transparent border-none outline-none p-0 m-0 text-2xl font-bold leading-relaxed text-emerald-700 dark:text-emerald-300 placeholder:text-emerald-700/50 dark:placeholder:text-emerald-300/50 placeholder:italic placeholder:font-semibold"
      />
      {variants.length > 0 && (
        <span className="self-center text-xs font-bold text-emerald-700/70 dark:text-emerald-300/70">
          +{variants.length}
        </span>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="self-center h-6 w-6 rounded-full text-emerald-700/60 hover:bg-emerald-700/10 hover:text-emerald-700 dark:text-emerald-300/70 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-200"
            aria-label="Biến thể đáp án"
            title="Thêm biến thể đáp án"
          >
            <Plus className="h-3.5 w-3.5 mx-auto" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Biến thể đáp án
            </span>
            <span className="text-xs text-muted-foreground">Chỗ trống #{index + 1}</span>
          </div>
          <VariantEditor answers={answers} onChange={onChange} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onRemove}
        className="self-center h-6 w-6 rounded-full text-emerald-700/60 hover:bg-emerald-700/10 hover:text-emerald-700 dark:text-emerald-300/70 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-200"
        aria-label="Xóa chỗ trống"
        title="Xóa chỗ trống"
      >
        <X className="h-3.5 w-3.5 mx-auto" />
      </button>
    </span>
  )
}

function VariantEditor({
  answers,
  onChange,
}: {
  answers: string[]
  onChange: (a: string[]) => void
}) {
  const items = answers.length ? answers : ['']
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground w-12 shrink-0">
            {i === 0 ? 'Chính' : `Biến thể ${i}`}
          </span>
          <input
            value={it}
            onChange={(e) => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            placeholder={i === 0 ? 'Đáp án chính' : `Biến thể ${i}`}
            className="flex-1 rounded-lg border-2 border-input bg-card px-3 py-1.5 text-sm outline-none focus-visible:border-primary"
          />
          {items.length > 1 && i > 0 && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="h-7 w-7 rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Xóa biến thể"
            >
              <Trash2 className="h-3.5 w-3.5 mx-auto" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" />
        Thêm biến thể
      </button>
    </div>
  )
}
