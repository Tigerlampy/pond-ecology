import Link from 'next/link'
import Image from 'next/image'
import type { Species } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  '어류': 'bg-blue-100 text-blue-800',
  '양서류': 'bg-green-100 text-green-800',
  '곤충': 'bg-yellow-100 text-yellow-800',
  '식물': 'bg-emerald-100 text-emerald-800',
  '조류': 'bg-sky-100 text-sky-800',
  '기타': 'bg-gray-100 text-gray-800',
}

export default function SpeciesCard({ species }: { species: Species }) {
  return (
    <Link href={`/species/${species.id}`} className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-100 relative">
        {species.image_url ? (
          <Image src={species.image_url} alt={species.name_ko} fill className="object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-4xl">🌿</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-lg">{species.name_ko}</h3>
        {species.name_scientific && (
          <p className="text-xs text-gray-500 italic">{species.name_scientific}</p>
        )}
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[species.category] ?? 'bg-gray-100 text-gray-800'}`}>
          {species.category}
        </span>
      </div>
    </Link>
  )
}
