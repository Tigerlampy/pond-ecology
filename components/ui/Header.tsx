'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface ProfileInfo {
  display_name: string
  points: number
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileInfo | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, points')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchProfile(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-emerald-900 text-stone-100 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/species" className="font-serif-kr text-xl font-semibold tracking-wide hover:text-emerald-200 transition-colors">
          🌿 경기북과학고 연못 생태 도감
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/species" className="hover:text-emerald-300 transition-colors">도감</Link>
          <Link href="/observations" className="hover:text-emerald-300 transition-colors">관측 기록</Link>
          <Link href="/stats" className="hover:text-emerald-300 transition-colors">통계</Link>
          {user ? (
            <div className="flex items-center gap-3">
              {profile && (
                <span className="text-xs bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-700">
                  {profile.display_name} · {profile.points}pt
                </span>
              )}
              <button onClick={handleLogout} className="hover:text-emerald-300 transition-colors">로그아웃</button>
            </div>
          ) : (
            <Link href="/login" className="hover:text-emerald-300 transition-colors">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
