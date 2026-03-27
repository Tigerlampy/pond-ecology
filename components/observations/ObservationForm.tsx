'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage, generateStoragePath } from '@/lib/storage'
import { getSeasonFromDate } from '@/lib/utils'
import ImageUpload from '@/components/upload/ImageUpload'
import type { Species } from '@/types'

export default function ObservationForm() {
  const [species, setSpecies] = useState<Species[]>([])
  const [speciesId, setSpeciesId] = useState('')
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [count, setCount] = useState(1)
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('species').select('id, name_ko').order('name_ko').then(({ data }) => {
      if (data) {
        setSpecies(data as Species[])
        if (data.length > 0) setSpeciesId(data[0].id)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      let imageUrl: string | null = null
      if (file) {
        const path = generateStoragePath(user.id, file.name)
        imageUrl = await uploadImage('observation-images', path, file)
      }

      const { error: dbError } = await supabase.from('observations').insert({
        species_id: speciesId,
        observer_id: user.id,
        observed_at: new Date(observedAt).toISOString(),
        season: getSeasonFromDate(observedAt),
        count,
        location: location || null,
        weather: weather || null,
        notes: notes || null,
        image_url: imageUrl,
      })

      if (dbError) throw new Error(dbError.message)
      router.push('/observations')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '등록 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">관측 기록 추가</h1>
      <ImageUpload onFileSelect={setFile} />

      <div>
        <label className="block text-sm font-medium mb-1">생물 *</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={speciesId}
          onChange={e => setSpeciesId(e.target.value)}
          required
        >
          {species.map(s => (
            <option key={s.id} value={s.id}>{s.name_ko}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">관측 날짜 *</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={observedAt}
          onChange={e => setObservedAt(e.target.value)}
          required
        />
        {observedAt && (
          <p className="text-xs text-gray-500 mt-1">계절: {getSeasonFromDate(observedAt)} (자동 계산)</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">개체 수 *</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded px-3 py-2"
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">위치</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="예: 연못 북쪽 수초 구역"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">날씨</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={weather}
          onChange={e => setWeather(e.target.value)}
          placeholder="예: 맑음, 흐림, 비"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">메모</label>
        <textarea
          className="w-full border rounded px-3 py-2 h-24"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="특이 사항, 행동 관찰 등"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !speciesId}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '관측 기록 저장'}
      </button>
    </form>
  )
}
