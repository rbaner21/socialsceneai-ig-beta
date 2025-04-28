import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

interface Profile {
  instagram_handle: string
  niche: string
}

const fetcher = async (url: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/signin'
    return {} as Profile
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  if (res.status === 401) {
    window.location.href = '/signin'
    return {} as Profile
  }
  return res.json()
}

export default function Settings() {
  const { data, error } = useSWR<Profile>('/api/profile', fetcher)
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('')

  useEffect(() => {
    if (data) {
      setHandle(data.instagram_handle)
      setNiche(data.niche)
    }
  }, [data])

  const save = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ instagram_handle: handle, niche }),
    })
    alert('Settings saved!')
  }

  if (error) return <div className="p-4 text-red-600">Error loading profile</div>
  if (!data) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Settings</h1>
      <label className="block mb-2">Instagram Handle</label>
      <input
        className="w-full mb-4 p-2 border rounded"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />
      <label className="block mb-2">Niche</label>
      <select
        className="w-full mb-4 p-2 border rounded"
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
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Settings
      </button>
    </div>
  )
}
