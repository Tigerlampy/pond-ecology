'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SeasonData { season: string; count: number }
interface CategoryData { category: string; count: number }

interface Props {
  seasonData: SeasonData[]
  categoryData: CategoryData[]
}

const SEASON_COLORS: Record<string, string> = {
  '봄': '#f9a8d4',
  '여름': '#86efac',
  '가을': '#fdba74',
  '겨울': '#93c5fd',
}

const CATEGORY_COLOR = '#4ade80'

export default function StatsCharts({ seasonData, categoryData }: Props) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold mb-4">계절별 관측 수</h2>
        {seasonData.every(d => d.count === 0) ? (
          <p className="text-gray-400 text-sm">관측 데이터가 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={seasonData} barSize={40}>
              <XAxis dataKey="season" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v}건`, '관측 수']} />
              <Bar dataKey="count">
                {seasonData.map(entry => (
                  <Cell key={entry.season} fill={SEASON_COLORS[entry.season] ?? '#d1d5db'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">분류별 등록 종 수</h2>
        {categoryData.every(d => d.count === 0) ? (
          <p className="text-gray-400 text-sm">등록된 생물이 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} barSize={40}>
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v}종`, '종 수']} />
              <Bar dataKey="count" fill={CATEGORY_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
