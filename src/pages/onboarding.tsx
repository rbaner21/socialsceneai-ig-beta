import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Onboarding() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('Fitness')

  const signUp = async () => {
    // 1) sign up user
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert(error.message)
    // 2) store profile
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: data.user?.id,
        instagram_handle: handle,
        niche,
      }),
    })
    // 3) go to feed
    window.location.href = '/feed'
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl mb-4">SocialSceneAI Beta</h1>
      <input className="block mb-2" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)} />
      <input className="block mb-2" type="password" placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)} />
      <input className="block mb-2" placeholder="Instagram handle"
        value={handle} onChange={e => setHandle(e.target.value)} />
      <select className="block mb-4" value={niche}
        onChange={e => setNiche(e.target.value)}>
        {[
          'Fitness','Beauty & Fashion','Food & Cooking','Travel','Tech & Gadgets',
          'DIY & Crafts','Parenting','Gaming','Comedy','Art','Music','Photography',
          'Health','Finance','Home Decor','Pets','Education','Sports','Automotive','Lifestyle'
        ].map(n => <option key={n}>{n}</option>)}
      </select>
      <button onClick={signUp} className="px-4 py-2 bg-blue-600 text-white">
        Sign Up
      </button>
    </div>
  )
}
