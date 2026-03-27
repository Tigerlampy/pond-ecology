'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage, generateStoragePath } from '@/lib/storage'
import ImageUpload from '@/components/upload/ImageUpload'
import type { SpeciesCategory } from '@/types'

const CATEGORIES: SpeciesCategory[] = ['어류', '양서류', '곤충', '식물', '조류', '기타']

export default function SpeciesForm() {
  const [file, setFile] = useState<File | null>(null)
  const [nameKo, setNameKo] = useState('')
  const [nameScientific, setNameScientific] = useState('')
  const [category, setCategory] = useState<SpeciesCategory>('기타')
  const [description, setDescription] = useState('')
  const [habitat, setHabitat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDuplicateId(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      let imageUrl: string | null = null
      if (file) {
        const path = generateStoragePath(user.id, file.name)
        imageUrl = await uploadImage('species-images', path, file)
      }

      const { data, error: dbError } = await supabase.from('species').insert({
        name_ko: nameKo,
        name_scientific: nameScientific || null,
        category,
        description: description || null,
        habitat: habitat || null,
        image_url: imageUrl,
        created_by: user.id,
      }).select().single()

      if (dbError) {
        if (dbError.code === '23505') {
          const { data: existing } = await supabase
            .from('species').select('id').eq('name_ko', nameKo).single()
          setDuplicateId(existing?.id ?? null)
          throw new Error(`이미 등록된 생물종입니다.`)
        }
        throw new Error(dbError.message)
      }
      router.push(`/species/${data.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '등록 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">생물 등록</h1>
      <ImageUpload onFileSelect={setFile} />

      <div>
        <label className="block text-sm font-medium mb-1">생물 이름 *</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={nameKo} onChange={e => setNameKo(e.target.value)} required
          placeholder="예: 개구리"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">학명</label>
        <input
          className="w-full border rounded px-3 py-2 italic"
          value={nameScientific} onChange={e => setNameScientific(e.target.value)}
          placeholder="예: Rana nigromaculata"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">분류 *</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={category} onChange={e => setCategory(e.target.value as SpeciesCategory)}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">설명</label>
        <textarea
          className="w-full border rounded px-3 py-2 h-24"
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="생물의 특징, 생태적 역할 등"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">서식지</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={habitat} onChange={e => setHabitat(e.target.value)}
          placeholder="예: 연못 가장자리, 수초 주변"
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">
          <p>{error}</p>
          {duplicateId && (
            <a href={`/observations/new?species_id=${duplicateId}`} className="text-green-600 underline">
              관측 기록에 추가하기
            </a>
          )}
        </div>
      )}
      <button
        type="submit" disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '생물 등록하기'}
      </button>
    </form>
  )
}
