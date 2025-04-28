// src/pages/onboarding.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Onboarding() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('Fitness')

  const signUp = async () => {
    // 1) Sign up with Supabase
    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({ email, password })

    // 2) Extract the user safely
    const user = data?.user
    if (signUpError || !user) {
      return alert(signUpError?.message || 'Error signing up')
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

    // 4) Redirect to the feed
    window.location.href = '/feed'
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">SocialSceneAI IG Beta</h1>
      <input
        className="block mb-2 w-full p-2 border"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="block mb-2 w-full p-2 border"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="block mb-2 w-full p-2 border"
        placeholder="Instagram handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />
      <select
        className="block mb-4 w-full p-2 border"
        value={niche}
        onChange={(e) => setNiche(e.target.value)}
      >
        {[
          'Fitness',
          'Beauty & Fashion',
          'Food & Cooking',
          'Travel',
          'Tech & Gadgets',
          'DIY & Crafts',
          'Parenting & Family',
          'Gaming',
          'Comedy & Entertainment',
          'Art & Illustration',
          'Music & Performance',
          'Photography',
          'Health & Wellness',
          'Finance & Investing',
          'Home Decor',
          'Pets & Animals',
          'Education & Learning',
          'Sports & Outdoor',
          'Automotive',
          'Lifestyle & Inspiration',
        ].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <button
        onClick={signUp}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign Up
      </button>
    </div>
  )
}
