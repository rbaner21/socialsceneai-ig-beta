/* eslint-disable @next/next/no-img-element */
import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

interface IdeaCard {
  id: string
  prompt: string
  caption: string
  hashtags: string[]
  thumbnail: string
  issued_date: string
}

const fetcher = async (url: string) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/signin'
    return { ideas: [] }
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  if (res.status === 401) {
    window.location.href = '/signin'
    return { ideas: [] }
  }
  return res.json()
}

export default function Library() {
  const { data, error } = useSWR<{ ideas: IdeaCard[] }>('/api/library', fetcher)

  if (error) return <div className="p-4 text-red-600">Error loading library</div>
  if (!data) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Your Saved Ideas</h1>
      {data.ideas.length === 0 && <p>No saved ideas yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.ideas.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 shadow">
            <img
              src={c.thumbnail}
              alt=""
              className="w-full h-40 object-cover rounded"
            />
            <p className="font-semibold mt-2">{c.prompt}</p>
            <p className="text-sm">{c.caption}</p>
            <div className="flex flex-wrap mt-2 text-blue-600 text-xs">
              {c.hashtags.map((ht) => (
                <span key={ht} className="mr-2">
                  #{ht}
                </span>
              ))}
            </div>
            <p className="mt-2 text-gray-500 text-xs">
              Saved on {c.issued_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
