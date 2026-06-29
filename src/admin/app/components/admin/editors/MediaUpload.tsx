import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  UploadCloud, Image as ImageIcon, Volume2, Video as VideoIcon,
  X, RefreshCw, FileWarning, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadsRepository, type MediaKind } from '../../../features/uploads/api/uploads.repository'
import { resolveMediaUrl } from '../../../../lib/shared/media-url'

const ACCEPT: Record<MediaKind, string> = {
  image: 'image/*',
  audio: 'audio/*',
  video: 'video/*',
}

const MAX_BYTES: Record<MediaKind, number> = {
  image: 5 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
}

const KIND_LABEL: Record<MediaKind, string> = {
  image: 'hình ảnh',
  audio: 'âm thanh',
  video: 'video',
}

const HINT: Record<MediaKind, string> = {
  image: 'PNG, JPG, WEBP, GIF · tối đa 5MB',
  audio: 'MP3, M4A, OGG, WAV · tối đa 10MB',
  video: 'MP4, WEBM, MOV · tối đa 50MB',
}

const KindIcon: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  audio: Volume2,
  video: VideoIcon,
}

export function MediaUpload({
  kind,
  value,
  onChange,
}: {
  kind: MediaKind
  value?: string | null
  onChange: (url: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const Icon = KindIcon[kind]

  const validate = (file: File): string | null => {
    if (!file.type.startsWith(`${kind}/`)) {
      return `Sai định dạng. Cần ${KIND_LABEL[kind]}.`
    }
    if (file.size > MAX_BYTES[kind]) {
      return `File quá lớn. Giới hạn ${(MAX_BYTES[kind] / 1024 / 1024).toFixed(0)}MB.`
    }
    return null
  }

  const handleFile = async (file: File) => {
    const err = validate(file)
    if (err) {
      toast.error(err)
      return
    }
    const previousUrl = value || null
    setProgress(0)
    try {
      const result = await uploadsRepository.upload(kind, file, setProgress)
      onChange(result.url)
      toast.success('Tải lên thành công')
      // best-effort cleanup of replaced file
      if (previousUrl) {
        uploadsRepository.deleteByUrl(previousUrl).catch(() => undefined)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tải lên thất bại'
      toast.error(msg)
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const remove = async () => {
    if (!value) return
    const oldUrl = value
    onChange(null)
    uploadsRepository.deleteByUrl(oldUrl).catch(() => {
      toast.warning('Không xóa được file cũ trên server')
    })
  }

  const trigger = () => fileRef.current?.click()

  const isUploading = progress !== null
  const filename = value ? value.split('/').pop() ?? value : null
  const previewUrl = resolveMediaUrl(value)

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT[kind]}
        onChange={onSelect}
        className="sr-only"
        aria-hidden
      />

      {value && previewUrl ? (
        <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
          {kind === 'image' && (
            <div className="bg-muted/30 max-h-64 overflow-hidden flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 w-auto object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.opacity = '0.3'
                }}
              />
            </div>
          )}
          {kind === 'audio' && (
            <div className="p-4 bg-muted/30">
              <audio controls src={previewUrl} className="w-full" />
            </div>
          )}
          {kind === 'video' && (
            <div className="bg-black flex items-center justify-center">
              <video controls src={previewUrl} className="max-h-64 w-full object-contain" />
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-border">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm font-semibold truncate" title={filename ?? undefined}>
              {filename}
            </span>
            <button
              type="button"
              onClick={trigger}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thay
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-destructive/30 bg-card px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={trigger}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              trigger()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-lg border-2 border-dashed cursor-pointer transition-colors p-8 flex flex-col items-center justify-center gap-2 text-center ${
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">
            Kéo thả {KIND_LABEL[kind]} vào đây, hoặc bấm để chọn
          </p>
          <p className="text-xs text-muted-foreground">{HINT[kind]}</p>
        </div>
      )}

      {isUploading && (
        <div className="rounded-lg border-2 border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang tải lên… <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function MediaUploadInlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
      <FileWarning className="h-4 w-4" />
      {message}
    </div>
  )
}
