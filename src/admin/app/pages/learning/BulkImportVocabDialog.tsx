import { useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Sparkles, Upload, Download, X } from 'lucide-react'
import { read, utils, write } from 'xlsx'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Textarea } from '@/app/components/ui/textarea'
import { POS_OPTIONS } from '@/app/components/admin/lesson-editors/shared/PartOfSpeechPicker'

type ParsedItem = {
  word: string
  translation: string
  partOfSpeech?: string
  exampleSentence?: string
}

const POS_VALUES = new Set(POS_OPTIONS.map((p) => p.value))

// Map Vietnamese labels (and lowercase forms) → enum value
const POS_VIET_TO_VALUE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const opt of POS_OPTIONS) {
    map[opt.value.toLowerCase()] = opt.value
    map[opt.label.toLowerCase()] = opt.value
    // unaccented form
    map[stripAccents(opt.label).toLowerCase()] = opt.value
  }
  return map
})()

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizePos(raw: string): string | undefined {
  const k = raw.trim().toLowerCase()
  if (!k) return undefined
  if (POS_VALUES.has(k)) return k
  if (POS_VIET_TO_VALUE[k]) return POS_VIET_TO_VALUE[k]
  const stripped = stripAccents(k)
  if (POS_VIET_TO_VALUE[stripped]) return POS_VIET_TO_VALUE[stripped]
  return undefined
}

const HEADER_ALIASES: Record<keyof ParsedItem, string[]> = {
  word: [
    'từ tiếng việt', 'từ', 'tu tieng viet', 'tu', 'word', 'vietnamese', 'vi', 'tiếng việt', 'tieng viet',
  ],
  translation: [
    'bản dịch', 'ban dich', 'nghĩa', 'nghia', 'dịch', 'dich',
    'translation', 'meaning', 'english', 'en',
  ],
  partOfSpeech: [
    'loại từ', 'loai tu', 'loại', 'loai', 'từ loại', 'tu loai',
    'partofspeech', 'part of speech', 'pos',
  ],
  exampleSentence: [
    'câu ví dụ', 'cau vi du', 'ví dụ', 'vi du',
    'example', 'examplesentence', 'example sentence',
  ],
}

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function findField(header: string): keyof ParsedItem | null {
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(header)) return field as keyof ParsedItem
  }
  // Try unaccented match
  const stripped = stripAccents(header)
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => stripAccents(a) === stripped)) return field as keyof ParsedItem
  }
  return null
}

function parseTSV(input: string): ParsedItem[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.map((line) => {
    const cols = line.split(/\t|\s{2,}|\s\|\s|;/).map((c) => c.trim())
    const [word, translation, maybePos, example] = cols
    return {
      word: word ?? '',
      translation: translation ?? '',
      partOfSpeech: maybePos ? normalizePos(maybePos) : undefined,
      exampleSentence: example || undefined,
    }
  })
}

function parseSheet(rows: unknown[][]): ParsedItem[] {
  if (rows.length === 0) return []
  const firstRow = rows[0].map(normalizeHeader)
  const hasHeader = firstRow.some((h) => findField(h) !== null)

  if (hasHeader) {
    const fieldMap = firstRow.map(findField)
    return rows.slice(1).map((row) => {
      const item: ParsedItem = { word: '', translation: '' }
      row.forEach((cell, i) => {
        const field = fieldMap[i]
        if (!field) return
        const val = String(cell ?? '').trim()
        if (field === 'partOfSpeech') {
          item.partOfSpeech = val ? normalizePos(val) : undefined
        } else if (val) {
          ;(item as Record<string, string>)[field] = val
        }
      })
      return item
    })
  }

  return rows.map((row) => {
    const cells = row.map((c) => String(c ?? '').trim())
    const [word, translation, maybePos, example] = cells
    return {
      word: word ?? '',
      translation: translation ?? '',
      partOfSpeech: maybePos ? normalizePos(maybePos) : undefined,
      exampleSentence: example || undefined,
    }
  })
}

const TEMPLATE_EXAMPLES: Array<[string, string, string, string]> = [
  ['xin chào', 'hello', 'Cụm từ', 'Tôi xin chào bạn.'],
  ['tạm biệt', 'goodbye', 'Cụm từ', 'Tạm biệt, hẹn gặp lại.'],
  ['cảm ơn', 'thank you', 'Cụm từ', 'Cảm ơn bạn rất nhiều.'],
  ['xin lỗi', 'sorry', 'Cụm từ', 'Xin lỗi vì đến muộn.'],
  ['quyển sách', 'book', 'Danh từ', 'Tôi đọc quyển sách mới.'],
  ['nhà', 'house', 'Danh từ', 'Nhà tôi ở Hà Nội.'],
  ['người', 'person', 'Danh từ', 'Anh ấy là người tốt.'],
  ['ăn', 'to eat', 'Động từ', 'Tôi ăn cơm trưa.'],
  ['đi', 'to go', 'Động từ', 'Chúng tôi đi học.'],
  ['học', 'to study', 'Động từ', 'Em học tiếng Anh.'],
  ['đẹp', 'beautiful', 'Tính từ', 'Cô ấy rất đẹp.'],
  ['lớn', 'big', 'Tính từ', 'Ngôi nhà này lớn.'],
  ['nhanh', 'quickly', 'Trạng từ', 'Anh ấy chạy nhanh.'],
  ['tôi', 'I, me', 'Đại từ', 'Tôi là sinh viên.'],
  ['trong', 'in', 'Giới từ', 'Sách ở trong cặp.'],
  ['và', 'and', 'Liên từ', 'Tôi và bạn.'],
  ['ôi', 'oh', 'Thán từ', 'Ôi, đẹp quá!'],
]

function downloadTemplate() {
  const wb = utils.book_new()

  // Sheet 1 — Từ vựng (data)
  const headers = ['Từ tiếng Việt', 'Bản dịch', 'Loại từ', 'Câu ví dụ']
  const data: unknown[][] = [headers, ...TEMPLATE_EXAMPLES]
  const ws = utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 32 }]
  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  utils.book_append_sheet(wb, ws, 'Từ vựng')

  // Sheet 2 — Hướng dẫn loại từ
  const guideHeaders = ['Loại từ (tiếng Việt)', 'Mã hệ thống', 'Ví dụ']
  const guideRows = POS_OPTIONS.map((opt) => {
    const example = TEMPLATE_EXAMPLES.find((row) => stripAccents(row[2]).toLowerCase() === stripAccents(opt.label).toLowerCase())
    return [opt.label, opt.value, example?.[0] ?? '']
  })
  const guideData: unknown[][] = [
    ['Cột "Loại từ" trong sheet "Từ vựng" có thể nhập tiếng Việt hoặc mã hệ thống.'],
    ['Hệ thống tự nhận diện các giá trị sau:'],
    [],
    guideHeaders,
    ...guideRows,
  ]
  const guideWs = utils.aoa_to_sheet(guideData)
  guideWs['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 24 }]
  guideWs['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ]
  utils.book_append_sheet(wb, guideWs, 'Hướng dẫn loại từ')

  const buf = write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mau-tu-vung.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function BulkImportVocabDialog({
  open,
  onOpenChange,
  existingCount,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCount: number
  onImport: (items: ParsedItem[]) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [fileItems, setFileItems] = useState<ParsedItem[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parsedFromText = useMemo(() => parseTSV(text), [text])
  const parsed = fileItems ?? parsedFromText
  const valid = parsed.filter((p) => p.word && p.translation)

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer()
      const wb = read(buf, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) {
        toast.error('File không có sheet nào')
        return
      }
      const rows = utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: '' })
      const items = parseSheet(rows)
      if (items.length === 0) {
        toast.warning('Không tìm thấy dữ liệu trong file')
        return
      }
      setFileItems(items)
      setFileName(file.name)
      setText('')
      toast.success(`Đã đọc ${items.length} dòng từ ${file.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đọc file')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearFile = () => {
    setFileItems(null)
    setFileName(null)
  }

  const handleImport = async () => {
    if (valid.length === 0) return
    setBusy(true)
    try {
      await onImport(valid)
      toast.success(`Đã thêm ${valid.length} từ vựng`)
      setText('')
      clearFile()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể nhập')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dimBackdrop={false} showCloseButton={false} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Nhập từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên file <strong>.xlsx</strong> hoặc <strong>.csv</strong>, hoặc dán dữ liệu từ Excel/Google Sheets vào ô bên dưới.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* File upload + template (parallel tiles, same height) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            {fileName ? (
              <div className="flex items-center gap-3 rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-3 h-full">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{fileName}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {parsed.length} dòng đọc được
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8 shrink-0" aria-label="Bỏ file">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleFile(file)
                }}
                className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 text-left h-full"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">Chọn file hoặc kéo thả</div>
                  <div className="text-xs text-muted-foreground">Hỗ trợ .xlsx, .xls, .csv</div>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5 text-left h-full"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold">Tải mẫu Excel</div>
                <div className="text-xs text-muted-foreground">Có sẵn ví dụ + hướng dẫn</div>
              </div>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="sr-only"
            aria-hidden
          />

          {/* OR divider + paste textarea */}
          {!fileName && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hoặc dán</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="rounded-lg border-2 border-border bg-muted/30 p-3 text-xs text-muted-foreground font-mono whitespace-pre">
                {`xin chào\thello\tCụm từ\tTôi xin chào bạn.
cảm ơn\tthank you\tCụm từ
quyển sách\tbook\tDanh từ`}
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Dán dữ liệu từ Excel/Google Sheets vào đây (mỗi dòng một từ, cột cách bằng Tab)..."
                className="min-h-28 font-mono text-sm"
              />
            </>
          )}

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b-2 border-border bg-muted/30 px-3 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Xem trước
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <strong className="text-foreground">{valid.length}</strong> hợp lệ
                  {parsed.length - valid.length > 0 && ` · ${parsed.length - valid.length} bỏ qua`}
                  {' · '}sẽ thêm từ #{existingCount + 1}
                </span>
              </div>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Từ</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Bản dịch</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Loại</th>
                      <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 50).map((item, i) => {
                      const isValid = item.word && item.translation
                      return (
                        <tr
                          key={i}
                          className={`border-b border-border last:border-b-0 ${isValid ? '' : 'opacity-50 bg-destructive/5'}`}
                        >
                          <td className="px-2 py-1 font-bold">{item.word || '—'}</td>
                          <td className="px-2 py-1">{item.translation || '—'}</td>
                          <td className="px-2 py-1 text-muted-foreground">{item.partOfSpeech ?? 'phrase'}</td>
                          <td className="px-2 py-1 text-muted-foreground truncate max-w-[200px]">{item.exampleSentence ?? ''}</td>
                        </tr>
                      )
                    })}
                    {parsed.length > 50 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-1 text-center text-muted-foreground italic">
                          ... và {parsed.length - 50} dòng nữa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={handleImport} disabled={busy || valid.length === 0}>
            {busy ? 'Đang nhập...' : `Nhập ${valid.length} từ`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
