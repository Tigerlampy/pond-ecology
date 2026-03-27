import { createClient } from '@/lib/supabase/server'
import StatsCharts from '@/components/stats/StatsCharts'
import type { Season, SpeciesCategory } from '@/types'

const SEASONS: Season[] = ['봄', '여름', '가을', '겨울']
const CATEGORIES: SpeciesCategory[] = ['어류', '양서류', '곤충', '식물', '조류', '기타']

export default async function StatsPage() {
  const supabase = await createClient()

  const [{ data: observations }, { data: species }] = await Promise.all([
    supabase.from('observations').select('season'),
    supabase.from('species').select('category'),
  ])

  const seasonData = SEASONS.map(season => ({
    season,
    count: observations?.filter(o => o.season === season).length ?? 0,
  }))

  const categoryData = CATEGORIES.map(category => ({
    category,
    count: species?.filter(s => s.category === category).length ?? 0,
  }))

  const totalObservations = observations?.length ?? 0
  const totalSpecies = species?.length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">생태 통계</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalSpecies}</p>
          <p className="text-sm text-gray-500 mt-1">등록 종</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalObservations}</p>
          <p className="text-sm text-gray-500 mt-1">총 관측 건수</p>
        </div>
      </div>

      <StatsCharts seasonData={seasonData} categoryData={categoryData} />
    </div>
  )
}
