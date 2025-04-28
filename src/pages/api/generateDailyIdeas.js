// src/pages/api/generateDailyIdeas.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import OpenAI from 'openai'
import KMeans from 'kmeans-ts'

export default async function handler(req, res) {
  // ─── 0) AUTH GUARD ───────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1] || ''
  const isAdmin = token === process.env.SUPABASE_SERVICE_ROLE_KEY

  let userId = null
  if (!isAdmin) {
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userData.user) {
      return res.status(401).json({ error: 'Not signed in' })
    }
    userId = userData.user.id
  }

  try {
    // ─── 1) FETCH SCORED POSTS + THEIR METRICS ─────────────────────────────────
    const { data: scoredPosts, error: e1 } = await supabaseAdmin
      .from('scored_posts')
      .select('id, signals, trending_posts(id, image_url, metrics)')
    if (e1 || !scoredPosts) {
      throw new Error('Failed to load scored_posts')
    }

    // ─── 2) CLUSTER SIGNAL VECTORS ─────────────────────────────────────────────
    const vectors = scoredPosts.map((p) => Object.values(p.signals || {}))
    const km = new KMeans({ K: 30 })
    const clusters = km.cluster(vectors)
    const picks = clusters.slice(0, 10).map((c) => c.ids[0])

    // ─── 3) GET USER LIST ───────────────────────────────────────────────────────
    let usersList
    if (isAdmin) {
      const { data: allUsers, error: e2 } = await supabaseAdmin
        .from('users')
        .select('id')
      if (e2 || !allUsers) {
        throw new Error('Failed to load users')
      }
      usersList = allUsers
    } else {
      usersList = [{ id: userId }]
    }

    // ─── 4) INITIALIZE OPENAI CLIENT ────────────────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'

    // ─── 5) FOR EACH USER & PICK, GENERATE & INSERT AN IDEACARD ────────────────
    for (const { id: uid } of usersList) {
      for (const idx of picks) {
        const post = scoredPosts[idx]
        const tp = post.trending_posts && post.trending_posts[0]
        if (!tp) continue

        // 5a) Call OpenAI
        const resp = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Generate EXACTLY three lines: 1) concise content prompt, 2) draft caption, 3) 5–10 comma-separated hashtags',
            },
            { role: 'user', content: `Metrics: ${JSON.stringify(tp.metrics)}` },
          ],
        })
        const text = (resp.choices[0].message || {}).content || ''
        const [prompt, caption, tagLine] = text.split('\n').map((l) => l.trim())

        // 5b) Insert into idea_cards
        await supabaseAdmin.from('idea_cards').insert([
          {
            user_id: uid,
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
    return res.status(500).json({ error: err.message || String(err) })
  }
}
