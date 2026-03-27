import Link from 'next/link'
import Image from 'next/image'
import type { Species } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  '어류': 'bg-blue-100 text-blue-800',
  '양서류': 'bg-green-100 text-green-800',
  '곤충': 'bg-yellow-100 text-yellow-800',
  '식물': 'bg-emerald-100 text-emerald-800',
  '조류': 'bg-sky-100 text-sky-800',
  '기타': 'bg-stone-100 text-stone-600',
}

const CATEGORY_EMOJI: Record<string, string> = {
  '어류': '🐟',
  '양서류': '🐸',
  '곤충': '🦗',
  '식물': '🌿',
  '조류': '🐦',
  '기타': '🔍',
}

interface Props {
  species: Species
  isDiscovered?: boolean
}

export default function SpeciesCard({ species, isDiscovered = false }: Props) {
  return (
    <Link
      href={`/species/${species.id}`}
      className="block bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-40 bg-stone-50 relative">
        {species.image_url ? (
          <Image src={species.image_url} alt={species.name_ko} fill className="object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl text-stone-300">
            {CATEGORY_EMOJI[species.category] ?? '🔍'}
          </div>
        )}
        {isDiscovered && (
          <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            ✓ 발견
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-serif-kr font-semibold text-base text-stone-800">{species.name_ko}</h3>
        {species.name_scientific && (
          <p className="text-xs text-stone-400 italic mt-0.5">{species.name_scientific}</p>
        )}
        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[species.category] ?? 'bg-stone-100 text-stone-600'}`}>
          {species.category}
        </span>
      </div>
    </Link>
  )
}
