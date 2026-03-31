import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_BUCKETS = ['species-images', 'observation-images']

export async function POST(req: NextRequest) {
  // 1. 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  // 2. FormData 파싱
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const path = formData.get('path') as string | null

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: '파일, 버킷, 경로가 필요합니다' }, { status: 400 })
  }

  // 3. 버킷 이름 검증
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: '허용되지 않는 버킷입니다' }, { status: 400 })
  }

  // 4. 경로가 본인 userId로 시작하는지 검증 (경로 조작 방지)
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: '유효하지 않은 경로입니다' }, { status: 403 })
  }

  // 5. Sharp로 EXIF 제거 후 이미지 처리 (GPS 등 메타데이터 제거)
  const buffer = Buffer.from(await file.arrayBuffer())
  let stripped: Buffer
  try {
    // sharp는 기본적으로 EXIF/GPS 등 모든 메타데이터를 제거함
    // .rotate()로 EXIF orientation을 이미지에 적용한 후 방향 정보도 제거
    stripped = await sharp(buffer)
      .rotate()
      .toBuffer()
  } catch {
    return NextResponse.json({ error: '이미지 처리 실패: 지원하지 않는 형식입니다' }, { status: 400 })
  }

  // 6. 서비스 롤 키로 업로드 (인증은 위에서 직접 검증했으므로 스토리지 RLS 우회)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, stripped, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ publicUrl })
}
