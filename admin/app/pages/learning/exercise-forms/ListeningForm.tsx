import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Headphones } from 'lucide-react'
import { Textarea } from '../../../components/ui/textarea'
import type { QuestionFormProps } from './types'
import { getOptionsObject } from './types'

interface DraftState {
  question: string
  keywords: string[]
  transcriptType: 'exact' | 'keywords'
}

function initialFromProps(initial: QuestionFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const correct = (initial?.correctAnswer ?? {}) as { transcript?: unknown }
  let keywords: string[] = []
  if (Array.isArray(opts.keywords)) {
    keywords = (opts.keywords as unknown[]).map((s) => String(s))
  }
  const transcript = typeof correct.transcript === 'string' ? correct.transcript : ''
  if (transcript && !keywords.includes(transcript)) keywords.unshift(transcript)
  return {
    question: String(initial?.question ?? ''),
    keywords: keywords.length ? keywords : [''],
    transcriptType:
      opts.transcriptType === 'exact' ? 'exact' : 'keywords',
  }
}

export function ListeningForm({ initial, onChange }: QuestionFormProps) {
  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const payload = useMemo(() => {
    const cleaned = state.keywords.filter(Boolean)
    return {
      question: state.question,
      options: {
        type: 'listening' as const,
        transcriptType: state.transcriptType,
        keywords: cleaned,
        // audioUrl is read from the shell's questionAudioUrl by the parent.
        audioUrl: '',
      } as Record<string, unknown>,
      correctAnswer: { transcript: cleaned[0] ?? '' },
    }
  }, [state])

  const validate = () => {
    if (!state.question.trim()) return 'Hãy nhập câu hỏi / hướng dẫn'
    const cleaned = state.keywords.filter((s) => s.trim())
    if (cleaned.length === 0) return 'Cần ít nhất 1 đáp án/keyword'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const setKw = (i: number, value: string) =>
    setState((prev) => {
      const next = [...prev.keywords]
      next[i] = value
      return { ...prev, keywords: next }
    })

  const removeKw = (i: number) =>
    setState((prev) =>
      prev.keywords.length <= 1
        ? prev
        : { ...prev, keywords: prev.keywords.filter((_, idx) => idx !== i) },
    )

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-foreground">
          Câu hỏi / Hướng dẫn
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <Textarea
          value={state.question}
          onChange={(e) => setState((prev) => ({ ...prev, question: e.target.value }))}
          placeholder="Ví dụ: Nghe và viết lại câu vừa nghe..."
          className="mt-1.5 min-h-20"
          autoFocus
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Audio được cấu hình ở mục “Audio câu hỏi” phía trên
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Cách chấm điểm</label>
        <div className="mt-1.5 flex gap-2">
          <ModeChip
            active={state.transcriptType === 'exact'}
            onClick={() =>
              setState((prev) => ({ ...prev, transcriptType: 'exact' }))
            }
            label="So khớp chính xác"
            hint="Đáp án đầu tiên là transcript đúng"
          />
          <ModeChip
            active={state.transcriptType === 'keywords'}
            onClick={() =>
              setState((prev) => ({ ...prev, transcriptType: 'keywords' }))
            }
            label="Theo từ khoá"
            hint="Đúng nếu bài viết chứa các từ khoá"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">
          {state.transcriptType === 'exact' ? 'Transcript chấp nhận' : 'Các từ khoá bắt buộc'}
          <span className="text-destructive ml-0.5">*</span>
        </label>
        <div className="mt-1.5 rounded-lg border-2 border-border bg-card overflow-hidden">
          {state.keywords.map((kw, i) => (
            <div
              key={i}
              className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20 ${
                i > 0 ? 'border-t border-border/50' : ''
              }`}
            >
              <Headphones className="h-4 w-4 text-muted-foreground/70 shrink-0" />
              <input
                value={kw}
                onChange={(e) => setKw(i, e.target.value)}
                placeholder={
                  state.transcriptType === 'exact'
                    ? 'Transcript đầy đủ...'
                    : 'Từ khoá...'
                }
                className="flex-1 bg-transparent border-none outline-none p-0 m-0 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => removeKw(i)}
                disabled={state.keywords.length <= 1}
                className="h-7 w-7 shrink-0 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30 transition-colors"
                aria-label="Xóa"
              >
                <Trash2 className="h-3.5 w-3.5 mx-auto" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setState((prev) => ({ ...prev, keywords: [...prev.keywords, ''] }))
          }
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {state.transcriptType === 'exact' ? 'Thêm transcript' : 'Thêm từ khoá'}
        </button>
      </div>
    </div>
  )
}

function ModeChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-foreground/30'
      }`}
    >
      <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </button>
  )
}
