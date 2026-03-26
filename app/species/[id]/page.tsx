import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, formatCount } from '@/lib/utils'

export default async function SpeciesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: species } = await supabase
    .from('species').select('*').eq('id', id).single()

  if (!species) notFound()

  const { data: observations } = await supabase
    .from('observations')
    .select('*')
    .eq('species_id', id)
    .order('observed_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto">
      {species.image_url && (
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <Image src={species.image_url} alt={species.name_ko} fill className="object-cover" />
        </div>
      )}
      <h1 className="text-3xl font-bold">{species.name_ko}</h1>
      {species.name_scientific && (
        <p className="text-gray-500 italic mb-2">{species.name_scientific}</p>
      )}
      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-4">
        {species.category}
      </span>
      {species.description && <p className="text-gray-700 mb-4">{species.description}</p>}
      {species.habitat && (
        <p className="text-sm text-gray-500 mb-6">서식지: {species.habitat}</p>
      )}
      <div className="flex gap-3 mb-8">
        <Link href="/species" className="text-sm text-green-600 hover:underline">← 도감으로</Link>
        <Link href="/observations/new" className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
          관측 기록 추가
        </Link>
      </div>

      {observations && observations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">최근 관측 기록</h2>
          <ul className="space-y-2">
            {observations.map(obs => (
              <li key={obs.id} className="border rounded p-3 text-sm">
                {formatDate(obs.observed_at)} · {obs.season} · {formatCount(obs.count)}
                {obs.notes && <p className="text-gray-500 mt-1">{obs.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
