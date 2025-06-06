// src/pages/signin.tsx
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signIn = async () => {
    // 1) Sign in
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      return alert(loginError.message)
    }
    const session = loginData.session
    if (!session) {
      return alert('Unexpected error: no session returned')
    }
    const token = session.access_token

    // 2) Fetch today's ideas
    const ideasRes = await fetch('/api/ideas', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (ideasRes.status === 401) {
      // Not signed in? shouldn't happen, but redirect
      return (window.location.href = '/signin')
    }
    const { ideas } = await ideasRes.json()

    // 3) If no ideas yet for today, generate 10 now
    if (!ideas?.length) {
      const genRes = await fetch('/api/generateDailyIdeas', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!genRes.ok) {
        console.warn('Could not generate initial ideas:', await genRes.text())
      }
    }

    // 4) Finally, send them to the feed
    window.location.href = '/feed'
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Welcome Back</h1>
      <input
        className="block mb-2 w-full p-2 border rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="block mb-4 w-full p-2 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={signIn}
        className="w-full px-4 py-2 bg-green-600 text-white rounded mb-4"
      >
        Sign In
      </button>
      <p className="text-sm text-center">
        Don’t have an account?{' '}
        <Link href="/onboarding" className="text-blue-500 underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}
