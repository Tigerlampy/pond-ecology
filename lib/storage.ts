import { createClient } from '@/lib/supabase/client'

export function generateStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}_${sanitized}`
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// EXIF 제거 + 서버사이드 업로드 (VULN-06 대응)
export async function uploadImage(bucket: string, path: string, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  formData.append('path', path)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? '업로드 실패')
  }
  const { publicUrl } = await res.json()
  return publicUrl
}
