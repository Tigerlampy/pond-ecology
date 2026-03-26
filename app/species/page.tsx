import { createClient } from '@/lib/supabase/server'
import SpeciesList from '@/components/species/SpeciesList'
import Link from 'next/link'

export default async function SpeciesPage() {
  const supabase = await createClient()
  const { data: species } = await supabase
    .from('species')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">생물 도감</h1>
        <Link href="/species/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
          + 생물 등록
        </Link>
      </div>
      <SpeciesList species={species ?? []} />
    </div>
  )
}
