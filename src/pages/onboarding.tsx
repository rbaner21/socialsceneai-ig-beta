// src/pages/onboarding.tsx
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function Onboarding() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('Fitness')

  const signUp = async () => {
    // 1) Create the new user
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (signUpError) {
      return alert(signUpError.message)
    }

    // 2) Immediately sign them in to establish a session
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return alert(signInError.message)
    }
    const user = signInData.user
    if (!user) {
      return alert('Unexpected error: no user after sign-in')
    }

    // 3) Create their profile record
    const profileRes = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        instagram_handle: handle,
        niche,
      }),
    })
    if (!profileRes.ok) {
      const { error } = await profileRes.json()
      return alert(error || 'Error creating profile')
    }

    // 4) Send them to the feed
    window.location.href = '/feed'
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">SocialSceneAI IG Beta</h1>
      <input
        className="block mb-2 w-full p-2 border rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="block mb-2 w-full p-2 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="block mb-2 w-full p-2 border rounded"
        placeholder="Instagram handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />
      <select
        className="block mb-4 w-full p-2 border rounded"
        value={niche}
        onChange={(e) => setNiche(e.target.value)}
      >
        {[
          'Fitness','Beauty & Fashion','Food & Cooking','Travel','Tech & Gadgets',
          'DIY & Crafts','Parenting & Family','Gaming','Comedy & Entertainment',
          'Art & Illustration','Music & Performance','Photography','Health & Wellness',
          'Finance & Investing','Home Decor','Pets & Animals','Education & Learning',
          'Sports & Outdoor','Automotive','Lifestyle & Inspiration'
        ].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button
        onClick={signUp}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign Up
      </button>
      <p className="text-sm mt-4 text-center">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-500 underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}
