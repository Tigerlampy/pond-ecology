import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function RankingPage() {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: ranking } = await supabase
    .from('profiles')
    .select('display_name, points')
    .order('points', { ascending: false })

  const list = ranking ?? []

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif-kr text-2xl font-bold text-stone-800 mb-1">명예의 전당</h1>
      <p className="text-sm text-stone-400 mb-8">도감 기여도가 높은 학생들을 소개합니다.</p>

      {/* 포인트 기준 안내 */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8">
        <h2 className="font-serif-kr font-semibold text-emerald-800 mb-3">포인트 부여 기준</h2>
        <ul className="space-y-1.5 text-sm text-emerald-700">
          <li className="flex items-center gap-2">
            <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-xs">+10pt</span>
            새로운 생물 종 도감에 등록
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-xs">+5pt</span>
            관측 기록 추가
          </li>
        </ul>
      </div>

      {/* 랭킹 */}
      {list.length === 0 ? (
        <p className="text-center text-stone-400 mt-12">아직 참여한 학생이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((profile: { display_name: string; points: number }, i: number) => (
            <li
              key={i}
              className={`flex items-center gap-4 bg-white border rounded-xl px-5 py-4 ${
                i === 0 ? 'border-yellow-300 shadow-md' :
                i === 1 ? 'border-stone-300 shadow-sm' :
                i === 2 ? 'border-orange-200 shadow-sm' :
                'border-stone-200'
              }`}
            >
              <span className="text-2xl w-8 text-center">
                {MEDALS[i] ?? <span className="text-stone-400 text-base font-bold">{i + 1}</span>}
              </span>
              <div className="flex-1">
                <p className="font-serif-kr font-semibold text-stone-800">{profile.display_name}</p>
              </div>
              <span className={`font-bold text-lg ${i === 0 ? 'text-yellow-500' : 'text-emerald-600'}`}>
                {profile.points}pt
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
