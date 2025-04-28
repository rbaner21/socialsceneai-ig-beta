// src/pages/api/generateDailyIdeas.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import OpenAI from 'openai'
import KMeans from 'kmeans-ts'

export default async function handler(req, res) {
  // 0) Authenticate via Bearer token
  const token = (req.headers.authorization || '').split(' ')[1] || ''
  const {
    data: { user },
    error: userErr,
  } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) {
    return res.status(401).json({ error: 'Not signed in' })
  }

  try {
    // 1) Fetch all scored_posts with their trending_posts metrics
    const { data: scoredPosts, error: e1 } = await supabaseAdmin
      .from('scored_posts')
      .select('id, signals, trending_posts(id, image_url, metrics)')
    if (e1 || !scoredPosts) throw e1 || new Error('No scored posts')

    // 2) Cluster by signal vectors
    const vectors = scoredPosts.map((p) => Object.values(p.signals))
    const km = new KMeans({ K: 30 })
    const clusters = km.cluster(vectors)
    const picks = clusters.slice(0, 10).map((c) => c.ids[0])

    // 3) Get all users
    const { data: users, error: e2 } = await supabaseAdmin
      .from('users')
      .select('id')
    if (e2 || !users) throw e2 || new Error('No users found')

    // 4) Prepare OpenAI
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // 5) For each user & each pick, generate and insert IdeaCard
    for (const { id: user_id } of users) {
      for (const idx of picks) {
        const post = scoredPosts[idx]
        const tp = post.trending_posts?.[0]
        if (!tp) continue

        // 5a) AI prompt
        const resp = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Exactly three lines: 1) prompt, 2) caption, 3) 5–10 comma-separated hashtags',
            },
            { role: 'user', content: `Metrics: ${JSON.stringify(tp.metrics)}` },
          ],
        })
        const lines = resp.choices[0].message.content
          .split('\n')
          .map((l) => l.trim())
        const [prompt, caption, tagLine] = lines

        // 5b) Insert into idea_cards
        await supabaseAdmin.from('idea_cards').insert([
          {
            user_id,
            scored_post_id: post.id,
            prompt,
            caption,
            hashtags: tagLine
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
            cluster_id: clusters.findIndex((c) => c.ids.includes(idx)),
            issued_date: new Date().toISOString().slice(0, 10),
          },
        ])
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('🛑 /api/generateDailyIdeas error:', err)
    return res.status(500).json({ error: err.message })
  }
}
