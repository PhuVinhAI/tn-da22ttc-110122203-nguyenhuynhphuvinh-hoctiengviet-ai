import { FormEvent, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import type { FieldConfig } from '../../features/learning/types/forms'

export function ResourceForm({
  fields,
  initialValue,
  submitLabel = 'Lưu',
  onSubmit,
  onChange,
  id,
  hideSubmit = false,
}: {
  fields: FieldConfig[]
  initialValue?: Record<string, unknown>
  submitLabel?: string
  onSubmit: (payload: Record<string, unknown>) => Promise<void> | void
  onChange?: (form: Record<string, unknown>) => void
  id?: string
  hideSubmit?: boolean
}) {
  const initialState = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          initialValue?.[field.name] !== undefined
            ? normalizeValue(initialValue[field.name], field)
            : field.defaultValue !== undefined
              ? normalizeValue(field.defaultValue, field)
              : field.type === 'switch'
                ? false
                : '',
        ])
      ),
    [fields, initialValue]
  )
  const [form, setForm] = useState<Record<string, unknown>>(initialState)
  const [saving, setSaving] = useState(false)

  const updateForm = (updates: Record<string, unknown>) => {
    setForm((current) => {
      const newForm = { ...current, ...updates }
      onChange?.(newForm)
      return newForm
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit(buildPayload(fields, form))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" id={id}>
      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.fullWidth || field.type === 'textarea' || field.type === 'json' ? 'md:col-span-2' : undefined}>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required ? <span className="text-destructive">*</span> : null}
            </Label>
            <div className="mt-1.5">
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  required={field.required}
                  value={String(form[field.name] ?? '')}
                  onChange={(event) => updateForm({ [field.name]: event.target.value })}
                />
              ) : field.type === 'json' ? (
                <Textarea
                  id={field.name}
                  required={field.required}
                  value={String(form[field.name] ?? '')}
                  onChange={(event) => updateForm({ [field.name]: event.target.value })}
                  className="min-h-32 font-mono text-xs"
                />
              ) : field.type === 'select' ? (
                <Select
                  value={String(form[field.name] ?? '')}
                  onValueChange={(value) => updateForm({ [field.name]: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'switch' ? (
                <Switch
                  checked={Boolean(form[field.name])}
                  onCheckedChange={(checked) => updateForm({ [field.name]: checked })}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type === 'number' ? 'number' : 'text'}
                  required={field.required}
                  value={String(form[field.name] ?? '')}
                  onChange={(event) => updateForm({ [field.name]: event.target.value })}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {!hideSubmit && (
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={saving}>
            <Save />
            {saving ? 'Đang lưu...' : submitLabel}
          </Button>
        </div>
      )}
    </form>
  )
}

function normalizeValue(value: unknown, field: FieldConfig) {
  if (field.type === 'json') {
    return value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  }
  return value
}

function buildPayload(fields: FieldConfig[], form: Record<string, unknown>) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = form[field.name]
      if (field.type === 'number') return [field.name, value === '' || value === undefined ? undefined : Number(value)]
      if (field.type === 'switch') return [field.name, Boolean(value)]
      if (field.type === 'json') return [field.name, parseJson(value)]
      return [field.name, value === '' ? undefined : value]
    })
  )
}

function parseJson(value: unknown) {
  if (value === '' || value === undefined || value === null) return null
  if (typeof value !== 'string') return value
  return JSON.parse(value)
}
