import { API_BASE_URL } from './constants'

/**
 * Origin của API server, ví dụ "http://localhost:3000".
 * API_BASE_URL có dạng "http://host:port/api/v1" — strip path để lấy origin.
 */
function getApiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

/**
 * Convert URL media (có thể là tương đối hoặc tuyệt đối) thành URL tuyệt đối có thể fetch.
 *
 * - URL bắt đầu http://, https://, data:, blob: → trả nguyên (legacy hoặc external)
 * - URL tương đối "/uploads/..." → ghép với API origin
 * - Null/empty → trả null
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^(?:https?:|data:|blob:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return `${getApiOrigin()}${trimmed}`
  return `${getApiOrigin()}/${trimmed}`
}
