// src/pages/signin.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return alert(error.message)
    // On success, send them to the feed
    window.location.href = '/feed'
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Welcome Back</h1>
      <input
        className="block mb-2 w-full p-2 border"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="block mb-4 w-full p-2 border"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={signIn}
        className="px-4 py-2 bg-green-600 text-white rounded mb-4"
      >
        Sign In
      </button>
      <p className="text-sm">
        Don’t have an account?{' '}
        <a href="/onboarding" className="text-blue-500 underline">
          Sign Up
        </a>
      </p>
    </div>
  )
}
