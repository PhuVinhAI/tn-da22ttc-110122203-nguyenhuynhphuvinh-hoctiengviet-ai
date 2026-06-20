import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Languages } from 'lucide-react'
import { Textarea } from '../../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import type { QuestionFormProps } from './types'
import { LANGUAGE_OPTIONS, getOptionsObject } from './types'

interface DraftState {
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  translation: string
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

function initialFromProps(initial: QuestionFormProps['initial']): DraftState {
  const opts = getOptionsObject(initial)
  const accepted = Array.isArray(opts.acceptedTranslations)
    ? (opts.acceptedTranslations as unknown[]).map((t) => String(t))
    : []
  const correct = (initial?.correctAnswer ?? {}) as { translation?: unknown }
  const translation = typeof correct.translation === 'string' ? correct.translation : accepted[0] ?? ''
  return {
    sourceText: String(opts.sourceText ?? initial?.question ?? ''),
    sourceLanguage: normaliseLang(String(opts.sourceLanguage ?? 'en'), 'en'),
    targetLanguage: normaliseLang(String(opts.targetLanguage ?? 'vi'), 'vi'),
    translation,
  }
}

export function TranslationForm({ initial, onChange }: QuestionFormProps) {
  const [state, setState] = useState<DraftState>(() => initialFromProps(initial))

  useEffect(() => {
    setState(initialFromProps(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id])

  const payload = useMemo(() => {
    const t = state.translation.trim()
    return {
      question: null,
      options: {
        type: 'translation' as const,
        sourceText: state.sourceText,
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        acceptedTranslations: t ? [t] : [],
      },
      correctAnswer: { translation: t },
    }
  }, [state])

  const validate = () => {
    if (!state.sourceText.trim()) return 'Hãy nhập văn bản cần dịch'
    if (!state.translation.trim()) return 'Cần nhập bản dịch'
    return null
  }

  useEffect(() => {
    onChange({ payload, validate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload])

  const swapLanguages = () =>
    setState((prev) => ({
      ...prev,
      sourceLanguage: prev.targetLanguage,
      targetLanguage: prev.sourceLanguage,
      sourceText: prev.translation,
      translation: prev.sourceText,
    }))

  return (
    <div className="space-y-6">
      {/* Language pair selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Ngôn ngữ gốc
          </label>
          <Select
            value={state.sourceLanguage}
            onValueChange={(v) => setState((prev) => ({ ...prev, sourceLanguage: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {LANGUAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={swapLanguages}
          className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          title="Đổi chiều ngôn ngữ"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Ngôn ngữ đích
          </label>
          <Select
            value={state.targetLanguage}
            onValueChange={(v) => setState((prev) => ({ ...prev, targetLanguage: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {LANGUAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Two-panel translation */}
      <div className="grid grid-cols-2 gap-0 rounded-lg border-2 border-border bg-card overflow-hidden">
        {/* Source panel */}
        <div className="border-r-2 border-border">
          <div className="px-4 py-2.5 bg-muted/40 border-b-2 border-border">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Languages className="h-3 w-3" />
              Văn bản gốc
              <span className="text-destructive">*</span>
            </span>
          </div>
          <Textarea
            value={state.sourceText}
            onChange={(e) => setState((prev) => ({ ...prev, sourceText: e.target.value }))}
            rows={4}
            placeholder="Nhập văn bản cần dịch..."
            className="border-none rounded-none focus-visible:ring-0 min-h-[120px] text-base font-semibold resize-none"
          />
        </div>

        {/* Target panel */}
        <div>
          <div className="px-4 py-2.5 bg-muted/40 border-b-2 border-border">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Languages className="h-3 w-3" />
              Bản dịch
              <span className="text-destructive">*</span>
            </span>
          </div>
          <Textarea
            value={state.translation}
            onChange={(e) => setState((prev) => ({ ...prev, translation: e.target.value }))}
            rows={4}
            placeholder="Nhập bản dịch..."
            className="border-none rounded-none focus-visible:ring-0 min-h-[120px] text-base font-semibold resize-none"
          />
        </div>
      </div>
    </div>
  )
}
