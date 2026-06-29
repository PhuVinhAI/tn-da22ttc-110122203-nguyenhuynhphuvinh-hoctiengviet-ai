import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'

export type GrammarExample = { vi: string; en: string; note?: string }

export function GrammarExamplesEditor({
  value,
  onChange,
}: {
  value: GrammarExample[]
  onChange: (next: GrammarExample[]) => void
}) {
  const [items, setItems] = useState<GrammarExample[]>(value.length ? value : [{ vi: '', en: '' }])

  const sync = (next: GrammarExample[]) => {
    setItems(next)
    onChange(next)
  }

  const updateAt = (index: number, patch: Partial<GrammarExample>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    sync(next)
  }

  const removeAt = (index: number) => {
    if (items.length <= 1) return
    sync(items.filter((_, i) => i !== index))
  }

  const add = () => sync([...items, { vi: '', en: '' }])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ví dụ {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAt(index)}
              disabled={items.length <= 1}
              className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-3 space-y-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tiếng Việt</label>
              <Input
                value={item.vi}
                onChange={(e) => updateAt(index, { vi: e.target.value })}
                placeholder="Câu ví dụ tiếng Việt"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Bản dịch</label>
              <Input
                value={item.en}
                onChange={(e) => updateAt(index, { en: e.target.value })}
                placeholder="Bản dịch (tiếng Anh hoặc ngôn ngữ học viên)"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ghi chú (tùy chọn)</label>
              <Textarea
                value={item.note ?? ''}
                onChange={(e) => updateAt(index, { note: e.target.value })}
                placeholder="Ghi chú thêm cho ví dụ này"
                className="mt-1 min-h-16"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="w-full justify-center border-dashed"
      >
        <Plus className="h-4 w-4" />
        Thêm ví dụ
      </Button>
    </div>
  )
}
