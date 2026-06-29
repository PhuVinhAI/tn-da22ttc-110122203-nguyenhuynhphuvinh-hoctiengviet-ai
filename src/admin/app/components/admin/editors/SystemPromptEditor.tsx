import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'

export interface PromptVariable {
  key: string
  label: string
  description: string
}

export interface PromptVariableGroup {
  groupLabel: string
  variables: PromptVariable[]
}

export interface SystemPromptCharacterRef {
  id?: string
  name: string
  role?: string
  isPlayable?: boolean
  orderIndex?: number
}

const STATIC_GROUPS: PromptVariableGroup[] = [
  {
    groupLabel: 'Học viên',
    variables: [
      {
        key: 'learner.level',
        label: 'Cấp độ học viên',
        description: 'Trình độ CEFR hiện tại (A1, A2, B1, B2, C1, C2)',
      },
      {
        key: 'learner.nativeLanguage',
        label: 'Tiếng mẹ đẻ',
        description: 'Tiếng mẹ đẻ học viên đã khai báo trong hồ sơ',
      },
      {
        key: 'learner.preferredDialect',
        label: 'Phương ngữ ưa thích',
        description: 'Phương ngữ tiếng Việt ưa thích (Bắc, Trung, Nam)',
      },
    ],
  },
  {
    groupLabel: 'Nhân vật học viên chọn',
    variables: [
      {
        key: 'playable.name',
        label: 'Tên nhân vật học viên',
        description:
          'Tên nhân vật học viên chọn đóng vai (xác định khi bắt đầu phiên)',
      },
      {
        key: 'playable.role',
        label: 'Vai trò nhân vật học viên',
        description: 'Vai trò của nhân vật học viên chọn đóng vai',
      },
      {
        key: 'playable.personality',
        label: 'Tính cách nhân vật học viên',
        description: 'Tính cách của nhân vật học viên chọn đóng vai',
      },
      {
        key: 'playable.speechStyle',
        label: 'Phong cách nói nhân vật học viên',
        description: 'Phong cách nói của nhân vật học viên chọn đóng vai',
      },
      {
        key: 'playable.profile',
        label: 'Hồ sơ đầy đủ nhân vật học viên',
        description:
          'Khối đa dòng gộp 4 trường (tên, vai trò, tính cách, phong cách nói) của nhân vật học viên chọn',
      },
    ],
  },
  {
    groupLabel: 'Nhân vật AI điều khiển',
    variables: [
      {
        key: 'npcs.profile',
        label: 'Hồ sơ tất cả nhân vật AI',
        description:
          'Danh sách đầy đủ tất cả nhân vật không-playable (AI sẽ đóng vai) — mỗi nhân vật một khối với 4 trường',
      },
    ],
  },
  {
    groupLabel: 'Tình huống',
    variables: [
      {
        key: 'scenario.title',
        label: 'Tên tình huống',
        description: 'Tên tình huống đã đặt ở phần Thông tin tình huống',
      },
      {
        key: 'scenario.description',
        label: 'Mô tả tình huống',
        description: 'Mô tả bối cảnh tình huống',
      },
    ],
  },
  {
    groupLabel: 'Cấu hình phiên',
    variables: [
      {
        key: 'maxTurns',
        label: 'Số lượt tối đa',
        description: 'Số lượt nói tối đa (hoặc "unlimited" nếu không giới hạn)',
      },
    ],
  },
]

function buildVariableGroups(
  characters: SystemPromptCharacterRef[] | undefined,
): PromptVariableGroup[] {
  const groups: PromptVariableGroup[] = [...STATIC_GROUPS]
  if (!characters || characters.length === 0) return groups

  const sorted = [...characters].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  )

  sorted.forEach((char, idx) => {
    const playableNote = char.isPlayable ? ' (học viên đóng vai)' : ''
    const roleNote = char.role ? ` · ${char.role}` : ''
    groups.push({
      groupLabel: `${char.name}${roleNote}${playableNote}`,
      variables: [
        {
          key: `characters[${idx}].name`,
          label: `Tên — ${char.name}`,
          description: `Tên nhân vật ${char.name}`,
        },
        {
          key: `characters[${idx}].role`,
          label: `Vai trò — ${char.name}`,
          description: `Vai trò của ${char.name}`,
        },
        {
          key: `characters[${idx}].personality`,
          label: `Tính cách — ${char.name}`,
          description: `Tính cách của ${char.name}`,
        },
        {
          key: `characters[${idx}].speechStyle`,
          label: `Phong cách nói — ${char.name}`,
          description: `Phong cách nói của ${char.name}`,
        },
        {
          key: `characters[${idx}].profile`,
          label: `Hồ sơ đầy đủ — ${char.name}`,
          description: `Khối đa dòng gộp 4 trường của ${char.name}`,
        },
      ],
    })
  })

  return groups
}

const PLACEHOLDER_REGEX = /\{\{([^{}]+?)\}\}/g
// Matches `{{` followed by optional partial key right before the caret.
// `[\w.\[\]]` allows letters, digits, `_`, `.`, `[`, `]` — exactly the
// charset used in variable keys like `characters[0].name`.
const INLINE_TRIGGER_REGEX = /\{\{([\w.[\]]*)$/

const CHIP_CLASS =
  'inline-flex items-center align-baseline rounded-md bg-primary/10 text-primary border-2 border-primary/30 px-1.5 py-0.5 mx-0.5 text-xs font-bold cursor-default'

function createChip(
  key: string,
  lookup: Map<string, PromptVariable>,
): HTMLElement {
  const span = document.createElement('span')
  span.setAttribute('data-prompt-variable', key)
  span.setAttribute('contenteditable', 'false')
  span.className = CHIP_CLASS
  const variable = lookup.get(key)
  span.textContent = variable?.label ?? key
  return span
}

function appendText(root: HTMLElement, text: string) {
  if (!text) return
  const parts = text.split('\n')
  parts.forEach((part, index) => {
    if (index > 0) root.appendChild(document.createElement('br'))
    if (part) root.appendChild(document.createTextNode(part))
  })
}

function renderTemplate(
  template: string,
  root: HTMLElement,
  lookup: Map<string, PromptVariable>,
) {
  root.replaceChildren()
  if (!template) return
  PLACEHOLDER_REGEX.lastIndex = 0
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = PLACEHOLDER_REGEX.exec(template)) !== null) {
    if (match.index > lastIndex) {
      appendText(root, template.slice(lastIndex, match.index))
    }
    const key = match[1].trim()
    root.appendChild(createChip(key, lookup))
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < template.length) {
    appendText(root, template.slice(lastIndex))
  }
}

function serializeEditor(root: HTMLElement): string {
  let result = ''

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const key = el.getAttribute('data-prompt-variable')
    if (key) {
      result += `{{${key}}}`
      return
    }
    if (el.tagName === 'BR') {
      result += '\n'
      return
    }
    const isBlock = el.tagName === 'DIV' || el.tagName === 'P'
    if (isBlock && result.length > 0 && !result.endsWith('\n')) {
      result += '\n'
    }
    Array.from(el.childNodes).forEach(walk)
  }

  Array.from(root.childNodes).forEach(walk)
  return result
}

function isEditorEmpty(root: HTMLElement): boolean {
  if (root.querySelector('[data-prompt-variable]')) return false
  return (root.textContent ?? '').length === 0
}

interface InlinePickerState {
  query: string
  caretLeft: number
  caretBottom: number
  caretTop: number
}

export function SystemPromptEditor({
  value,
  onChange,
  placeholder,
  required,
  characters,
  readOnly,
}: {
  value: string
  onChange?: (next: string) => void
  placeholder?: string
  required?: boolean
  characters?: SystemPromptCharacterRef[]
  readOnly?: boolean
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const pickerListRef = useRef<HTMLDivElement>(null)
  const lastSerialized = useRef<string>(value)
  const [empty, setEmpty] = useState(value.length === 0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [inlinePicker, setInlinePicker] = useState<InlinePickerState | null>(
    null,
  )
  const [inlineIndex, setInlineIndex] = useState(0)

  useEffect(() => {
    if (!pickerOpen) setPickerQuery('')
  }, [pickerOpen])

  const variableGroups = useMemo(
    () => buildVariableGroups(characters),
    [characters],
  )
  const variablesByKey = useMemo(() => {
    const map = new Map<string, PromptVariable>()
    for (const group of variableGroups) {
      for (const variable of group.variables) {
        map.set(variable.key, variable)
      }
    }
    return map
  }, [variableGroups])
  const flatVariables = useMemo(
    () =>
      variableGroups.flatMap((g) =>
        g.variables.map((v) => ({ ...v, groupLabel: g.groupLabel })),
      ),
    [variableGroups],
  )

  const filteredPickerGroups = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return variableGroups
    return variableGroups
      .map((g) => ({
        ...g,
        variables: g.variables.filter(
          (v) =>
            v.key.toLowerCase().includes(q) ||
            v.label.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            g.groupLabel.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.variables.length > 0)
  }, [variableGroups, pickerQuery])

  const filteredPickerCount = useMemo(
    () =>
      filteredPickerGroups.reduce((sum, g) => sum + g.variables.length, 0),
    [filteredPickerGroups],
  )

  const inlineMatches = useMemo(() => {
    if (!inlinePicker) return []
    const q = inlinePicker.query.toLowerCase()
    if (!q) return flatVariables
    return flatVariables.filter(
      (v) =>
        v.key.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q) ||
        v.groupLabel.toLowerCase().includes(q),
    )
  }, [inlinePicker, flatVariables])

  useEffect(() => {
    setInlineIndex(0)
  }, [inlinePicker?.query])

  useLayoutEffect(() => {
    const list = pickerListRef.current
    if (!list) return
    const item = list.children[inlineIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [inlineIndex])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const editorHasContent = editor.childNodes.length > 0
    // Re-render template into the editor DOM when:
    //   - the prop `value` no longer matches what we last serialized, OR
    //   - the editor DOM is out of sync with the value (e.g. just remounted
    //     after toggling readOnly, so the new node is empty even though we
    //     have content to display).
    if (
      value === lastSerialized.current &&
      editorHasContent === Boolean(value)
    ) {
      return
    }
    renderTemplate(value, editor, variablesByKey)
    lastSerialized.current = value
    setEmpty(isEditorEmpty(editor))
  }, [value, variablesByKey, readOnly])

  useEffect(() => {
    if (!placeholderRef.current) return
    renderTemplate(placeholder ?? '', placeholderRef.current, variablesByKey)
  }, [placeholder, variablesByKey])

  const emitChange = () => {
    const editor = editorRef.current
    if (!editor || !onChange) return
    const serialized = serializeEditor(editor)
    lastSerialized.current = serialized
    setEmpty(isEditorEmpty(editor))
    onChange(serialized)
  }

  const detectInlineTrigger = () => {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (
      !selection ||
      selection.rangeCount === 0 ||
      !selection.isCollapsed ||
      !selection.anchorNode ||
      !editor.contains(selection.anchorNode)
    ) {
      setInlinePicker(null)
      return
    }
    const range = selection.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) {
      setInlinePicker(null)
      return
    }
    const textBefore = (node as Text).data.slice(0, range.startOffset)
    const match = textBefore.match(INLINE_TRIGGER_REGEX)
    if (!match) {
      setInlinePicker(null)
      return
    }
    const caretRange = range.cloneRange()
    caretRange.collapse(true)
    const rect = caretRange.getBoundingClientRect()
    setInlinePicker({
      query: match[1],
      caretLeft: rect.left,
      caretBottom: rect.bottom,
      caretTop: rect.top,
    })
  }

  const acceptInlineVariable = (variable: PromptVariable) => {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return
    const textNode = node as Text
    const textBefore = textNode.data.slice(0, range.startOffset)
    const match = textBefore.match(INLINE_TRIGGER_REGEX)
    if (!match) return

    const matchLen = match[0].length
    const startOffset = range.startOffset - matchLen
    textNode.deleteData(startOffset, matchLen)

    const insertRange = document.createRange()
    insertRange.setStart(textNode, startOffset)
    insertRange.collapse(true)

    const chip = createChip(variable.key, variablesByKey)
    const trailingSpace = document.createTextNode(' ')
    insertRange.insertNode(trailingSpace)
    insertRange.insertNode(chip)

    const newRange = document.createRange()
    newRange.setStartAfter(trailingSpace)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)

    setInlinePicker(null)
    emitChange()
  }

  const handlePaste = (e: ReactClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') ?? ''
    if (!text) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const fragment = document.createDocumentFragment()
    const parts = text.split('\n')
    parts.forEach((part, index) => {
      if (index > 0) fragment.appendChild(document.createElement('br'))
      if (part) fragment.appendChild(document.createTextNode(part))
    })
    const lastNode = fragment.lastChild
    range.insertNode(fragment)
    if (lastNode) {
      range.setStartAfter(lastNode)
      range.setEndAfter(lastNode)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    emitChange()
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!inlinePicker) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setInlinePicker(null)
      return
    }
    if (inlineMatches.length === 0) {
      if (e.key === 'Tab') {
        e.preventDefault()
        setInlinePicker(null)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setInlineIndex((i) => (i + 1) % inlineMatches.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setInlineIndex((i) => (i - 1 + inlineMatches.length) % inlineMatches.length)
      return
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      acceptInlineVariable(inlineMatches[inlineIndex])
      return
    }
  }

  const insertVariable = (key: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const selection = window.getSelection()
    let range: Range
    if (
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editor.contains(selection.anchorNode)
    ) {
      range = selection.getRangeAt(0)
    } else {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    }
    range.deleteContents()
    const variable = variablesByKey.get(key)
    const chip = createChip(key, variablesByKey)
    const trailingSpace = document.createTextNode(' ')
    range.insertNode(trailingSpace)
    range.insertNode(chip)
    range.setStartAfter(trailingSpace)
    range.setEndAfter(trailingSpace)
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    void variable
    emitChange()
    setPickerOpen(false)
  }

  const hasCharacters = (characters?.length ?? 0) > 0

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Chèn biến
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={8}
              collisionPadding={16}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="w-96 overflow-hidden rounded-xl border-2 border-border bg-card p-0 flex flex-col"
              style={{
                maxHeight:
                  'var(--radix-popover-content-available-height, 480px)',
              }}
            >
              <div className="border-b-2 border-border bg-muted/30 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {pickerQuery ? 'Kết quả' : 'Tất cả biến'}
                  </span>
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {pickerQuery
                      ? `${filteredPickerCount}/${flatVariables.length}`
                      : flatVariables.length}
                  </span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Tìm biến theo tên, key..."
                    autoFocus
                    className="w-full rounded-md border-2 border-border bg-card pl-8 pr-8 py-1.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-none focus:border-primary"
                  />
                  {pickerQuery && (
                    <button
                      type="button"
                      onClick={() => setPickerQuery('')}
                      title="Xoá tìm kiếm"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-3">
                {!hasCharacters && !pickerQuery && (
                  <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Chưa có nhân vật
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Thêm nhân vật trong tình huống để dùng biến nhân vật.
                    </p>
                  </div>
                )}
                {filteredPickerGroups.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-border px-4 py-8 text-center">
                    <p className="text-sm font-bold text-foreground mb-1">
                      Không có biến phù hợp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Thử từ khoá khác hoặc xoá ô tìm kiếm.
                    </p>
                  </div>
                ) : (
                  filteredPickerGroups.map((group) => (
                    <div key={group.groupLabel} className="space-y-1">
                      <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {group.groupLabel}
                      </p>
                      <div className="space-y-1">
                        {group.variables.map((v) => (
                          <VariableRow
                            key={v.key}
                            variable={v}
                            groupLabel={group.groupLabel}
                            onPick={() => insertVariable(v.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-[11px] text-muted-foreground">
            Hoặc gõ <code className="rounded bg-muted px-1 font-mono">{'{{'}</code> trong nội dung, Tab/Enter để chèn
          </p>
        </div>
      )}

      <div className={readOnly ? '' : 'relative'}>
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          role={readOnly ? undefined : 'textbox'}
          aria-multiline={readOnly ? undefined : true}
          aria-required={readOnly ? undefined : required}
          onInput={
            readOnly
              ? undefined
              : () => {
                  emitChange()
                  detectInlineTrigger()
                }
          }
          onKeyUp={readOnly ? undefined : detectInlineTrigger}
          onClick={readOnly ? undefined : detectInlineTrigger}
          onKeyDown={readOnly ? undefined : handleKeyDown}
          onPaste={readOnly ? undefined : handlePaste}
          onBlur={
            readOnly
              ? undefined
              : () => {
                  requestAnimationFrame(() => setInlinePicker(null))
                }
          }
          className={
            readOnly
              ? 'text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground'
              : 'min-h-44 w-full rounded-md bg-muted/30 px-3 py-2 text-sm leading-relaxed outline-none whitespace-pre-wrap break-words focus:bg-card focus:ring-2 focus:ring-primary/40 transition-colors'
          }
        />
        {!readOnly && (
          <>
            <div
              ref={placeholderRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-3 top-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground opacity-70 ${empty ? '' : 'hidden'}`}
            />
            {required && (
              <input
                tabIndex={-1}
                aria-hidden="true"
                required
                value={value}
                onChange={() => {}}
                className="absolute inset-0 h-px w-px opacity-0 pointer-events-none"
              />
            )}
          </>
        )}
      </div>

      {!readOnly && inlinePicker && (
        <InlinePicker
          state={inlinePicker}
          matches={inlineMatches}
          selectedIndex={inlineIndex}
          onPick={acceptInlineVariable}
          onHover={setInlineIndex}
          listRef={pickerListRef}
        />
      )}
    </div>
  )
}

function VariableRow({
  variable,
  groupLabel,
  selected,
  onPick,
  onHover,
}: {
  variable: PromptVariable
  groupLabel: string
  selected?: boolean
  onPick: () => void
  onHover?: () => void
}) {
  const charName = groupLabel.split('·')[0].trim()
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseDown={(e) => {
        e.preventDefault()
        onPick()
      }}
      onMouseEnter={onHover}
      title={variable.description}
      className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-transparent hover:border-border hover:bg-muted/40'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-foreground truncate">
          {variable.label}
        </div>
        <div className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
          {`{{${variable.key}}}`}
        </div>
      </div>
      <span className="rounded-md border-2 border-border bg-muted/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 max-w-[7rem] truncate">
        {charName}
      </span>
    </button>
  )
}

function InlinePicker({
  state,
  matches,
  selectedIndex,
  onPick,
  onHover,
  listRef,
}: {
  state: InlinePickerState
  matches: Array<PromptVariable & { groupLabel: string }>
  selectedIndex: number
  onPick: (variable: PromptVariable) => void
  onHover: (index: number) => void
  listRef: React.RefObject<HTMLDivElement | null>
}) {
  const VIEW_MARGIN = 8
  const POPUP_MAX_H = 420
  const POPUP_WIDTH = 384
  const wouldOverflowBottom =
    state.caretBottom + POPUP_MAX_H + VIEW_MARGIN > window.innerHeight
  const top = wouldOverflowBottom
    ? Math.max(VIEW_MARGIN, state.caretTop - POPUP_MAX_H - 8)
    : state.caretBottom + 8
  const left = Math.min(
    Math.max(VIEW_MARGIN, state.caretLeft),
    window.innerWidth - POPUP_WIDTH - VIEW_MARGIN,
  )

  return (
    <div
      role="listbox"
      style={{
        position: 'fixed',
        top,
        left,
        width: POPUP_WIDTH,
        maxHeight: POPUP_MAX_H,
        zIndex: 100,
      }}
      className="overflow-hidden rounded-xl border-2 border-border bg-card flex flex-col"
    >
      <div className="border-b-2 border-border bg-muted/30 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            {state.query ? 'Lọc' : 'Tất cả biến'}
          </span>
          {state.query && (
            <code className="rounded-md bg-card border-2 border-border px-1.5 py-0.5 text-xs font-mono font-bold text-foreground truncate">
              {state.query}
            </code>
          )}
        </div>
        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
          {matches.length}
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {matches.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border px-4 py-6 text-center">
            <p className="text-sm font-bold text-foreground mb-1">
              Không có biến phù hợp
            </p>
            <p className="text-xs text-muted-foreground">
              Đổi từ khoá hoặc bấm Esc để đóng
            </p>
          </div>
        ) : (
          matches.map((v, i) => (
            <VariableRow
              key={v.key}
              variable={v}
              groupLabel={v.groupLabel}
              selected={i === selectedIndex}
              onPick={() => onPick(v)}
              onHover={() => onHover(i)}
            />
          ))
        )}
      </div>

      <div className="border-t-2 border-border bg-muted/30 px-3 py-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 font-mono font-bold text-[10px] text-foreground">
              ↑↓
            </kbd>
            <span>chọn</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 font-mono font-bold text-[10px] text-foreground">
              Tab
            </kbd>
            <span>chèn</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 font-mono font-bold text-[10px] text-foreground">
            Esc
          </kbd>
          <span>đóng</span>
        </span>
      </div>
    </div>
  )
}
