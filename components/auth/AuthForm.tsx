'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props { mode: 'login' | 'signup' }

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName, student_number: studentNumber } },
        })
        if (error) throw error
      }
      router.push('/species')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-2xl font-bold text-center">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h1>
      {mode === 'signup' && (
        <>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="이름"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="학번 (예: 10215)"
            value={studentNumber}
            onChange={e => setStudentNumber(e.target.value)}
            required
          />
        </>
      )}
      <input
        className="w-full border rounded px-3 py-2"
        type="email" placeholder="이메일"
        value={email} onChange={e => setEmail(e.target.value)} required
      />
      <input
        className="w-full border rounded px-3 py-2"
        type="password" placeholder="비밀번호"
        value={password} onChange={e => setPassword(e.target.value)} required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
      >
        {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
      </button>
      <p className="text-center text-sm text-stone-500">
        {mode === 'login' ? (
          <a href="/signup" className="text-emerald-700 hover:underline">계정 만들기</a>
        ) : (
          <a href="/login" className="text-emerald-700 hover:underline">이미 계정이 있으신가요?</a>
        )}
      </p>
    </form>
  )
}
