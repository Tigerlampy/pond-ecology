import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatCount } from '@/lib/utils'
import type { Observation } from '@/types'

type ObservationWithRelations = Observation & {
  species: { name_ko: string; image_url: string | null } | null
  observer: { display_name: string; student_number: string | null } | null
}

const SEASON_BADGE: Record<string, string> = {
  '봄': 'bg-pink-100 text-pink-800',
  '여름': 'bg-green-100 text-green-800',
  '가을': 'bg-orange-100 text-orange-800',
  '겨울': 'bg-blue-100 text-blue-800',
}

export default async function ObservationsPage() {
  const supabase = await createClient()
  const { data: observations } = await supabase
    .from('observations')
    .select('*, species(name_ko, image_url), observer:profiles(display_name, student_number)')
    .order('observed_at', { ascending: false })

  const list = (observations ?? []) as ObservationWithRelations[]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif-kr text-2xl font-bold text-stone-800">관측 기록</h1>
        <Link href="/observations/new" className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm shadow-sm transition-colors">
          + 관측 기록 추가
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-stone-400 mt-12">아직 관측 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {list.map(obs => (
            <li key={obs.id} className="bg-white border border-stone-200 rounded-xl p-4 flex gap-4 items-start hover:shadow-md transition-all duration-200">
              {obs.image_url ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image src={obs.image_url} alt={obs.species?.name_ko ?? ''} fill className="object-cover" />
                </div>
              ) : obs.species?.image_url ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image src={obs.species.image_url} alt={obs.species.name_ko} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center text-3xl shrink-0">
                  🌿
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/species/${obs.species_id}`} className="font-serif-kr font-semibold text-emerald-800 hover:underline">
                    {obs.species?.name_ko ?? '알 수 없음'}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEASON_BADGE[obs.season] ?? 'bg-stone-100 text-stone-600'}`}>
                    {obs.season}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  {formatDate(obs.observed_at)} · {formatCount(obs.count)}
                  {obs.location && ` · ${obs.location}`}
                  {obs.weather && ` · ${obs.weather}`}
                </p>
                {obs.notes && <p className="text-sm text-stone-600 mt-1">{obs.notes}</p>}
                {obs.observer && (
                  <p className="text-xs text-stone-400 mt-1">
                    기록: {obs.observer.display_name}
                    {obs.observer.student_number && ` (${obs.observer.student_number})`}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
