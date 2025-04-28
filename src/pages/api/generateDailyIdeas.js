// src/pages/api/generateDailyIdeas.js
import { supabase } from '@/lib/supabaseClient'
import OpenAI from 'openai'
import KMeans from 'kmeans-ts'

export default async function handler(req, res) {
  // 1) Load scored posts
  const { data: scoredPosts, error: e1 } = await supabase
    .from('scored_posts')
    .select('id, signals, trending_posts(image_url, metrics)')
  if (e1 || !scoredPosts) return res.status(500).json({ error: e1?.message })

  // 2) Vectorize and cluster
  const vectors = scoredPosts.map(p => Object.values(p.signals))
  const km = new KMeans({ K: 30 })
  const clusters = km.cluster(vectors)
  const picks = clusters.slice(0, 10).map(c => c.ids[0])

  // 3) Load users
  const { data: users, error: e2 } = await supabase
    .from('users')
    .select('id')
  if (e2 || !users) return res.status(500).json({ error: e2?.message })

  // 4) Init OpenAI
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // 5) Generate & insert idea cards
  for (const { id: user_id } of users) {
    for (const idx of picks) {
      const post = scoredPosts[idx]
      const metrics = post.trending_posts.metrics

      const resp = await openai.chat.completions.create({
        model,
        messages: [
          { role:'system', content:
            'Output exactly three lines: 1) prompt, 2) caption, 3) 5–10 comma-separated hashtags' },
          { role:'user', content:`Metrics: ${JSON.stringify(metrics)}` }
        ]
      })
      const lines = resp.choices[0].message.content.split('\n').map(l=>l.trim())
      const [prompt, caption, tagLine] = lines

      await supabase.from('idea_cards').insert([{
        user_id,
        scored_post_id: post.id,
        prompt,
        caption,
        hashtags: tagLine.split(',').map(t=>t.trim()).filter(Boolean),
        cluster_id: clusters.findIndex(c=>c.ids.includes(idx)),
        issued_date: new Date().toISOString().slice(0,10),
      }])
    }
  }

  res.status(200).json({ ok: true })
}
