import { apiClient } from '../../../../lib/core/infrastructure/api/client'

export type MediaKind = 'image' | 'audio' | 'video'

export interface UploadResponse {
  id: string
  kind: MediaKind
  url: string
  filename: string
  originalName: string
  mimetype: string
  size: number
}

function unwrap<T>(response: { data: T | { data: T } }): T {
  return (response.data as { data?: T }).data ?? (response.data as T)
}

export class UploadsRepository {
  async upload(
    kind: MediaKind,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> {
    const form = new FormData()
    form.append('file', file, file.name)
    const response = await apiClient.post<{ data: UploadResponse }>(
      `/admin/uploads/${kind}`,
      form,
      {
        onUploadProgress: (e) => {
          if (!onProgress || !e.total) return
          onProgress(Math.round((e.loaded / e.total) * 100))
        },
      },
    )
    return unwrap(response)
  }

  async deleteByUrl(url: string): Promise<void> {
    await apiClient.delete('/admin/uploads', { params: { url } })
  }
}

export const uploadsRepository = new UploadsRepository()
