// src/pages/api/computeSignals.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  try {
    // 1) Load all trending posts + their metrics + created_at
    const { data: posts, error } = await supabaseAdmin
      .from('trending_posts')
      .select('id, metrics, inserted_at')
    if (error) throw error

    const now = Date.now()

    // 2) Compute signals for each post
    const scored = posts.map((p) => {
      const m = p.metrics || {}
      const ageSec = (now - new Date(p.inserted_at).getTime()) / 1000 || 1
      const likes = m.likes || 0
      const comments = m.comments || 0
      const saves = m.saves || 0
      const views = m.views || 1

      const engagementVelocity = (likes + comments + saves) / ageSec
      const engagementRate = (likes + comments + saves) / views
      const commentVelocity = comments / ageSec
      const saveRate = saves / views
      const watchCompletionRatio = (m.avgWatchTime || 0) / (m.avgWatchTime ? m.avgWatchTime : 1)

      return {
        trending_post_id: p.id,
        signals: {
          engagementVelocity,
          engagementRate,
          commentVelocity,
          saveRate,
          watchCompletionRatio,
        },
      }
    })

    // 3) Upsert into scored_posts
    for (const s of scored) {
      await supabaseAdmin
        .from('scored_posts')
        .upsert(s, { onConflict: ['trending_post_id'] })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('🛑 /api/computeSignals error:', err)
    return res.status(500).json({ error: err.message })
  }
}
