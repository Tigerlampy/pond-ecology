import { createClient } from '@/lib/supabase/server'
import SpeciesList from '@/components/species/SpeciesList'
import Link from 'next/link'

export default async function SpeciesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: species }, { data: myObs }] = await Promise.all([
    supabase.from('species').select('*').order('created_at', { ascending: false }),
    user
      ? supabase.from('observations').select('species_id').eq('observer_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const observedIds = Array.from(new Set((myObs ?? []).map(o => o.species_id)))
  const total = species?.length ?? 0

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-serif-kr text-2xl font-bold text-stone-800">생물 도감</h1>
        <Link href="/species/new" className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm shadow-sm transition-colors">
          + 생물 등록
        </Link>
      </div>

      {user && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>내가 발견한 종</span>
            <span>{observedIds.length} / {total}종</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: total > 0 ? `${(observedIds.length / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400 mb-4">모든 정보는 유저에 의해 작성되므로 틀린 부분이 있을 수 있습니다.</p>
      <SpeciesList species={species ?? []} observedIds={observedIds} />
    </div>
  )
}
