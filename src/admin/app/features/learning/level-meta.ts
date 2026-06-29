export const LEVEL_BG: Record<string, string> = {
  A1: 'bg-emerald-500',
  A2: 'bg-teal-500',
  B1: 'bg-blue-500',
  B2: 'bg-indigo-500',
  C1: 'bg-purple-500',
  C2: 'bg-rose-500',
}

const LEVEL_LABEL_FALLBACK: Record<string, string> = {
  A1: 'Mới bắt đầu',
  A2: 'Sơ cấp',
  B1: 'Trung cấp',
  B2: 'Trên trung cấp',
  C1: 'Cao cấp',
  C2: 'Thông thạo',
}

export function levelLabel(level: string | undefined | null): string {
  return LEVEL_LABEL_FALLBACK[level ?? ''] ?? '—'
}

export function levelBg(level: string | undefined | null): string {
  return LEVEL_BG[level ?? ''] ?? 'bg-muted'
}
