const KNOWN_MODELS: Record<string, string> = {
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash (Exp)',
  'gemini-2.0-flash-thinking-exp': 'Gemini 2.0 Flash Thinking',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
}

export function formatModelName(model?: string | null): string {
  if (!model) return '—'
  const trimmed = model.trim()
  if (!trimmed) return '—'
  if (KNOWN_MODELS[trimmed]) return KNOWN_MODELS[trimmed]

  return trimmed
    .replace(/^gemini-/i, 'Gemini ')
    .replace(/^gpt-/i, 'GPT-')
    .replace(/^claude-/i, 'Claude ')
    .replace(/-flash\b/i, ' Flash')
    .replace(/-pro\b/i, ' Pro')
    .replace(/-lite\b/i, ' Lite')
    .replace(/-exp\b/i, ' (Exp)')
    .replace(/-thinking\b/i, ' Thinking')
    .replace(/\s+/g, ' ')
    .trim()
}
