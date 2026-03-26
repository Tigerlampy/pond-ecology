import SpeciesCard from './SpeciesCard'
import type { Species } from '@/types'

export default function SpeciesList({ species }: { species: Species[] }) {
  if (species.length === 0) return (
    <p className="text-center text-gray-500 mt-12">아직 등록된 생물이 없습니다.</p>
  )
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {species.map(s => <SpeciesCard key={s.id} species={s} />)}
    </div>
  )
}
