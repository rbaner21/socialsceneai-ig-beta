// src/pages/api/generateDailyIdeas.js
import { supabase } from '@/lib/supabaseClient'
import OpenAI from 'openai'
import KMeans from 'kmeans-ts'

export default async function handler(req, res) {
  // 1) Load all scored posts
  const { data: scoredPosts, error: scoredError } = await supabase
    .from('scored_posts')
    .select('id, signals, trending_posts(image_url, metrics)')
  if (scoredError || !scoredPosts) {
    return res.status(500).json({ error: scoredError?.message || 'Failed to load scored_posts' })
  }

  // 2) Vectorize signals
  const vectors = scoredPosts.map(p => Object.values(p.signals))

  // 3) Cluster
  const km = new KMeans({ K: 30 })
  const clusters = km.cluster(vectors)

  // 4) Pick first 10 clusters
  const picks = clusters.slice(0, 10).map(c => c.ids[0])

  // 5) Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
  if (usersError || !users) {
    return res.status(500).json({ error: usersError?.message || 'Failed to load users' })
  }

  // 6) Init OpenAI
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // 7) Generate & insert idea cards
  for (const { id: user_id } of users) {
    for (const pickIdx of picks) {
      const post    = scoredPosts[pickIdx]
      const metrics = post.trending_posts.metrics

      // 7a) AI call
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Output exactly three lines:\n' +
              '1) prompt\n' +
              '2) caption\n' +
              '3) 5–10 comma-separated hashtags'
          },
          { role: 'user', content: `Metrics: ${JSON.stringify(metrics)}` }
        ]
      })

      const text = completion.choices[0].message.content
      const [prompt, caption, tagLine] = text.split('\n').map(l => l.trim())

      // 7b) Insert
      await supabase.from('idea_cards').insert([{
        user_id,
        scored_post_id: post.id,
        prompt,
        caption,
        hashtags: tagLine.split(',').map(t => t.trim()).filter(Boolean),
        cluster_id: clusters.findIndex(c => c.ids.includes(pickIdx)),
        issued_date: new Date().toISOString().slice(0,10),
      }])
    }
  }

  return res.status(200).json({ ok: true })
}
