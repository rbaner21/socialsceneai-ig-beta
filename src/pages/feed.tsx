/* eslint-disable @next/next/no-img-element */

import React from 'react'
import useSWR from 'swr'

interface IdeaCard {
  id: string
  prompt: string
  caption: string
  hashtags: string[]
  thumbnail: string
}

interface IdeasResponse {
  ideas: IdeaCard[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Feed() {
  const { data, error } = useSWR<IdeasResponse>('/api/ideas', fetcher)

  if (error) return <div className="p-4 text-red-600">Error loading ideas</div>
  if (!data) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.ideas.map((card) => (
        <div key={card.id} className="border rounded-lg p-4 shadow">
          <img
            src={card.thumbnail}
            alt="Example"
            className="w-full h-40 object-cover rounded"
          />
          <h3 className="font-semibold mt-3">{card.prompt}</h3>
          <p className="text-sm mt-1">{card.caption}</p>
          <div className="flex flex-wrap mt-2 text-blue-600 text-xs">
            {card.hashtags.map((ht) => (
              <span key={ht} className="mr-2">#{ht}</span>
            ))}
          </div>
          <div className="mt-4 flex space-x-4">
            <button onClick={() => vote(card.id, 'save')} className="underline text-green-600">Save</button>
            <button onClick={() => vote(card.id, 'dismiss')} className="underline text-red-600">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  )
}

async function vote(id: string, action: 'save' | 'dismiss') {
  await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea_card_id: id, action }),
  })
  window.location.reload()
}
