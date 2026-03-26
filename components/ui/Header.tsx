'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-green-700 text-white shadow">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/species" className="text-xl font-bold">🌿 연못 생태 도감</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/species">도감</Link>
          <Link href="/observations">관측 기록</Link>
          <Link href="/stats">통계</Link>
          {user ? (
            <button onClick={handleLogout}>로그아웃</button>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
