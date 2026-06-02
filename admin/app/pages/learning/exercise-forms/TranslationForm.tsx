import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ArrowDown, Languages } from 'lucide-react'
import type { ExerciseFormProps } from './types'
import { getOptionsObject } from './types'

interface DraftState {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  translations: string[]
}

function normaliseLang(value: string, fallback: string): string {
  const map: Record<string, string> = {
    vi: 'vi', vietnamese: 'vi',
    en: 'en', english: 'en',
    fr: 'fr', french: 'fr',
    ja: 'ja', japanese: 'ja',
    ko: 'ko', korean: 'ko',
    zh: 'zh', chinese: 'zh',
  }
  return map[value.toLowerCase()] ?? fallback
}

function initialFromProps(initial: ExerciseFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const accepted = Array.isArray(opts.acceptedTranslations)
    ? (opts.acceptedTranslations as unknown[]).map((t) => String(t))
    : []
  const correct = (initial?.correctAnswer ?? {}) as { translation?: unknown }
  const translation = typeof correct.translation === 'string' ? correct.translation : ''
  const merged: string[] = []
  if (translation) merged.push(translation)
  for (const t of accepted) if (!merged.includes(t)) merged.push(t)
  return {
    sourceText: String(opts.sourceText ?? initial?.question ?? ''),
    sourceLanguage: normaliseLang(String(opts.sourceLanguage ?? 'en'), 'en'),
    targetLanguage: normaliseLang(String(opts.targetLanguage ?? 'vi'), 'vi'),
    translations: merged.length ? merged : [''],
  }
}

export function TranslationForm({ initial, onChange }: ExerciseFormProps) {
  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const payload = useMemo(() => {
    const cleaned = state.translations.filter(Boolean)
    return {
      question: null,
      options: {
        type: 'translation' as const,
        sourceText: state.sourceText,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        acceptedTranslations: cleaned,
      },
      correctAnswer: { translation: cleaned[0] ?? '' },
    }
  }, [state])

  const validate = () => {
    if (!state.sourceText.trim()) return 'Hãy nhập văn bản cần dịch'
    const cleaned = state.translations.filter((t) => t.trim())
    if (cleaned.length === 0) return 'Cần ít nhất 1 bản dịch'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const setTrans = (i: number, value: string) =>
    setState((prev) => {
      const next = [...prev.translations]
      next[i] = value
      return { ...prev, translations: next }
    })

  const removeTrans = (i: number) =>
    setState((prev) =>
      prev.translations.length <= 1
        ? prev
        : { ...prev, translations: prev.translations.filter((_, idx) => idx !== i) },
    )

  const srcBadge = state.sourceLanguage.toUpperCase()
  const tgtBadge = state.targetLanguage.toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-2">
          <Languages className="h-3.5 w-3.5" />
          Dịch {srcBadge} → {tgtBadge}
        </p>
        <p className="text-xs text-muted-foreground">
          Học viên dịch từ văn bản gốc sang bản dịch
        </p>
      </div>

      {/* Source */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-2.5 border-b-2 border-border bg-muted/30">
          <span className="rounded-md bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
            {srcBadge}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Văn bản gốc
          </span>
        </div>
        <textarea
          value={state.sourceText}
          onChange={(e) =>
            setState((prev) => ({ ...prev, sourceText: e.target.value }))
          }
          rows={3}
          placeholder="Nhập văn bản cần dịch..."
          className="w-full bg-transparent px-5 py-4 text-xl font-semibold leading-relaxed outline-none resize-y"
        />
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Target */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-2.5 border-b-2 border-border bg-muted/30">
          <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {tgtBadge}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bản dịch chấp nhận
          </span>
          <span className="text-xs text-muted-foreground">
            · bản đầu tiên là đáp án chính
          </span>
        </div>
        <div className="p-4 space-y-2">
          {state.translations.map((t, i) => (
            <div
              key={i}
              className={`group flex items-center gap-3 rounded-xl border-2 px-4 min-h-[56px] ${
                i === 0
                  ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-border'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i === 0 ? '★' : i + 1}
              </span>
              <input
                value={t}
                onChange={(e) => setTrans(i, e.target.value)}
                placeholder={i === 0 ? 'Bản dịch chính...' : `Biến thể ${i}`}
                className="flex-1 bg-transparent text-lg font-semibold leading-snug outline-none py-3"
              />
              {state.translations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTrans(i)}
                  className="h-8 w-8 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Xóa bản dịch"
                >
                  <Trash2 className="h-4 w-4 mx-auto" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                translations: [...prev.translations, ''],
              }))
            }
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm biến thể bản dịch
          </button>
        </div>
      </div>
    </div>
  )
}
