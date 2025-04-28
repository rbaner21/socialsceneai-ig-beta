import { useState, useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r=>r.json())

export default function Settings() {
  const { data, error } = useSWR<{ instagram_handle:string, niche:string }>('/api/profile', fetcher)
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('')

  useEffect(()=>{
    if (data) {
      setHandle(data.instagram_handle)
      setNiche(data.niche)
    }
  },[data])

  const save = async () => {
    const res = await fetch('/api/profile', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ instagram_handle: handle, niche })
    })
    if (res.ok) alert('Settings saved!')
    else alert('Error saving settings')
  }

  if (error) return <div>Error loading profile</div>
  if (!data) return <div>Loading…</div>
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Settings</h1>
      <label className="block mb-2">Instagram Handle</label>
      <input className="w-full mb-4 p-2 border rounded" value={handle}
        onChange={e=>setHandle(e.target.value)} />
      <label className="block mb-2">Niche</label>
      <select className="w-full mb-4 p-2 border rounded" value={niche}
        onChange={e=>setNiche(e.target.value)}>
        {[
          'Fitness','Beauty & Fashion','Food & Cooking','Travel','Tech & Gadgets',
          'DIY & Crafts','Parenting & Family','Gaming','Comedy & Entertainment',
          'Art & Illustration','Music & Performance','Photography',
          'Health & Wellness','Finance & Investing','Home Decor',
          'Pets & Animals','Education & Learning','Sports & Outdoor',
          'Automotive','Lifestyle & Inspiration'
        ].map(n=> <option key={n}>{n}</option>)}
      </select>
      <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">
        Save Settings
      </button>
    </div>
  )
}
