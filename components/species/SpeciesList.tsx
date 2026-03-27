import SpeciesCard from './SpeciesCard'
import type { Species } from '@/types'

interface Props {
  species: Species[]
  observedIds?: string[]
}

export default function SpeciesList({ species, observedIds = [] }: Props) {
  if (species.length === 0) return (
    <p className="text-center text-stone-400 mt-12">아직 등록된 생물이 없습니다.</p>
  )
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {species.map(s => (
        <SpeciesCard key={s.id} species={s} isDiscovered={observedIds.includes(s.id)} />
      ))}
    </div>
  )
}
