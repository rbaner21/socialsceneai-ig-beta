// src/pages/api/generateDailyIdeas.ts

// ✂️ Disable TS errors in this file
// @ts-nocheck

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase }                      from '@/lib/supabaseClient'

// 🆕 OpenAI v4 SDK default import
import OpenAI from 'openai'

// 🆕 kmeans-ts import
import KMeans from 'kmeans-ts'

// Helper: send failure
function fail(res: NextApiResponse, msg: string, code = 500) {
  return res.status(code).json({ error: msg })
}

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  // 1) Load all scored posts with their original metrics & image URL
  const { data: scoredPosts, error: scoredError } = await supabase
    .from('scored_posts')
    .select('id, signals, trending_posts(image_url, metrics)')
  if (scoredError || !scoredPosts) {
    return fail(res, scoredError?.message || 'Could not load scored_posts')
  }

  // 2) Build your signal vectors
  const vectors = scoredPosts.map((p) =>
    Object.values(p.signals as Record<string, number>)
  )

  // 3) Cluster into 30 groups
  const km       = new KMeans({ K: 30 })
  const clusters = km.cluster(vectors)

  // 4) Pick one post index from each of the first 10 clusters
  const picks = clusters.slice(0, 10).map((c) => c.ids[0])

  // 5) Load **all** beta users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
  if (usersError || !users) {
    return fail(res, usersError?.message || 'Could not load users')
  }

  // 6) Configure OpenAI
  //    - You choose your model via the OPENAI_MODEL env var
  //    - Everyone has access to "gpt-3.5-turbo"; if you have GPT-4 access, use "gpt-4"
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })

  // 7) For each user → for each picked post → generate & insert an IdeaCard
  for (const { id: user_id } of users) {
    for (const pickIdx of picks) {
      const post    = scoredPosts[pickIdx]
      const metrics = post.trending_posts.metrics

      // 7a) Ask OpenAI for prompt / caption / hashtags
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You will output exactly three lines:\n' +
              '1) a concise content prompt\n' +
              '2) a draft Instagram caption\n' +
              '3) five to ten comma-separated hashtags\n'
          },
          {
            role: 'user',
            content: `Post metrics: ${JSON.stringify(metrics)}`
          }
        ]
      })

      // 7b) Split into lines
      const text    = completion.choices[0].message.content
      const [prompt, caption, tagLine] = text.split('\n').map((l) => l.trim())

      // 7c) Insert into Supabase
      await supabase.from('idea_cards').insert([
        {
          user_id,
          scored_post_id: post.id,
          prompt,
          caption,
          hashtags: tagLine.split(',').map((t) => t.trim()).filter((t) => t),
          cluster_id: clusters.findIndex((c) => c.ids.includes(pickIdx)),
          issued_date: new Date().toISOString().slice(0, 10),
        },
      ])
    }
  }

  return res.status(200).json({ ok: true })
}
